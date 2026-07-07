const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '../.env.local');
const envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const firstEquals = trimmed.indexOf('=');
    if (firstEquals === -1) return;
    const key = trimmed.substring(0, firstEquals).trim();
    const val = trimmed.substring(firstEquals + 1).trim().replace(/^['"]|['"]$/g, '');
    envVars[key] = val;
  });
}

const supabaseUrl = envVars.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    console.log('Loading active Google Ads configuration...');
    const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
    if (!config) {
      console.log('No configurations found.');
      return;
    }

    const googleDevToken = config.google_developer_token;
    const googleClientId = config.google_client_id;
    const googleClientSecret = config.google_client_secret;
    const googleRefreshToken = config.google_refresh_token;
    const googleCustomerId = config.google_customer_id;
    const googleManagerId = config.google_manager_id;

    console.log('Credentials loaded successfully.');

    // Simulating keywords list
    const testKeywords = [
      'oracle fusion financials online course',
      'oracle ppm fusion training',
      'oracle fusion hcm course'
    ];

    console.log('\nChecking cached search volumes in Supabase...');
    const { data: cachedVolumes, error: cacheErr } = await supabase
      .from('keyword_search_volumes')
      .select('*')
      .in('keyword', testKeywords);

    if (cacheErr) {
      console.error('Cache query error:', cacheErr);
      return;
    }

    console.log(`Found ${cachedVolumes.length} keywords in Supabase cache.`);
    cachedVolumes.forEach(c => {
      console.log(`- Cached: "${c.keyword}" | Vol: ${c.avg_monthly_searches} | Comp: ${c.competition} | Updated At: ${c.updated_at}`);
    });

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const staleKeywords = [];

    testKeywords.forEach(kw => {
      const cached = cachedVolumes.find(c => c.keyword === kw);
      if (!cached || !cached.updated_at || new Date(cached.updated_at).getTime() < thirtyDaysAgo) {
        staleKeywords.push(kw);
      }
    });

    console.log(`\nKeywords requiring live refresh from Google Ads: ${staleKeywords.length}`);
    if (staleKeywords.length > 0) {
      console.log(`Stale/Missing list:`, staleKeywords);
      
      const { fetchKeywordSearchVolumes } = require('../lib/google-ads-api');
      console.log('Querying Google Ads Keyword Planner API...');
      const liveMetrics = await fetchKeywordSearchVolumes(
        staleKeywords,
        googleDevToken,
        googleClientId,
        googleClientSecret,
        googleRefreshToken,
        googleCustomerId,
        googleManagerId
      );

      console.log('\nLive API Response Metrics:');
      console.log(JSON.stringify(liveMetrics, null, 2));

      // Save to Supabase
      const upserts = Object.entries(liveMetrics).map(([kw, metrics]) => ({
        keyword: kw,
        avg_monthly_searches: metrics.avgMonthlySearches,
        competition: metrics.competition,
        competition_index: metrics.competitionIndex,
        monthly_data: metrics.monthlySearchVolumes,
        updated_at: new Date().toISOString()
      }));

      if (upserts.length > 0) {
        console.log(`\nSaving ${upserts.length} updated metrics to Supabase...`);
        const { error: upsertErr } = await supabase
          .from('keyword_search_volumes')
          .upsert(upserts);
        
        if (upsertErr) {
          console.error('Failed to upsert cache:', upsertErr);
        } else {
          console.log('Successfully saved to cache table!');
        }
      }
    } else {
      console.log('All keywords are freshly cached. No live query required.');
    }

  } catch (err) {
    console.error(err);
  }
}

run();
