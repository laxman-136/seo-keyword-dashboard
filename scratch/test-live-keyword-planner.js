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
    const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
    if (!config) {
      console.log('No configuration found');
      return;
    }
    const devToken = config.google_developer_token;
    const clientId = config.google_client_id;
    const clientSecret = config.google_client_secret;
    const refreshToken = config.google_refresh_token;
    const customerId = config.google_customer_id.replace(/-/g, '');
    const managerId = config.google_manager_id ? config.google_manager_id.replace(/-/g, '') : null;

    console.log('Fetching OAuth Access Token...');
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Failed to get access token:', errText);
      return;
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    console.log('Successfully retrieved OAuth Access Token.');

    // We will query for "oracle hcm cloud training" and "oracle fusion financials online course"
    const targetKeywords = ['oracle hcm cloud training', 'oracle fusion financials online course'];

    console.log('\nQuerying Google Ads GenerateKeywordIdeas REST API (v16)...');
    const url = `https://googleads.googleapis.com/v16/customers/${customerId}:generateKeywordIdeas`;
    
    const headers = {
      'Content-Type': 'application/json',
      'developer-token': devToken,
      'Authorization': `Bearer ${accessToken}`
    };
    if (managerId) {
      headers['login-customer-id'] = managerId;
    }

    const body = {
      language: 'languageConstants/1000', // English
      geoTargetConstants: [
        'geoTargetConstants/2356' // India
      ],
      includeAdultKeywords: false,
      keywordSeed: {
        keywords: targetKeywords
      },
      keywordPlanNetwork: 'GOOGLE_SEARCH'
    };

    const apiRes = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('Google Ads API Error:', errText);
      return;
    }

    const apiData = await apiRes.json();
    console.log('\n--- API Response Summary ---');
    console.log(`Received ${apiData.results ? apiData.results.length : 0} results.`);

    if (apiData.results && apiData.results.length > 0) {
      apiData.results.slice(0, 10).forEach((res, idx) => {
        const text = res.text;
        const metrics = res.keywordIdeaMetrics || {};
        const avgVolume = metrics.avgMonthlySearches || 'N/A';
        const competition = metrics.competition || 'N/A';
        console.log(`${idx + 1}. Keyword: "${text}" | Avg Monthly Searches (India): ${avgVolume} | Competition: ${competition}`);
      });
    } else {
      console.log('No results returned.');
    }

  } catch (err) {
    console.error(err);
  }
}

run();
