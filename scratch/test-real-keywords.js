// scratch/test-real-keywords.js
const { createClient } = require('@supabase/supabase-js');
const { GoogleAdsApi } = require('google-ads-api');

const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local not found');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
}

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    console.log('Fetching active configuration...');
    const { data: config } = await supabase
      .from('configurations')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    const devToken = config.google_developer_token;
    const clientId = config.google_client_id;
    const clientSecret = config.google_client_secret;
    const refreshToken = config.google_refresh_token;
    const customerId = config.google_customer_id;
    const managerId = config.google_manager_id;

    const client = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: devToken,
    });

    const customer = client.Customer({
      customer_id: customerId.replace(/-/g, ''),
      refresh_token: refreshToken,
      login_customer_id: managerId ? managerId.replace(/-/g, '') : undefined,
    });

    const dateFrom = '2026-01-01';
    const dateTo = '2026-06-09';
    console.log(`Querying keyword_view for keywords containing "free" from ${dateFrom} to ${dateTo}...`);

    const query = `
      SELECT
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.status,
        ad_group_criterion.quality_info.quality_score,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions
      FROM keyword_view
      WHERE ad_group_criterion.status IN ('ENABLED', 'PAUSED')
        AND ad_group_criterion.keyword.text LIKE '%free%'
        AND segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
    `;

    const rows = await customer.query(query);
    console.log(`Fetched ${rows.length} rows matching LIKE %free%.`);

    const keywords = rows.map(r => ({
      text: r.ad_group_criterion?.keyword?.text || '',
      matchType: r.ad_group_criterion?.keyword?.match_type || '',
      status: r.ad_group_criterion?.status || '',
      qualityScore: r.ad_group_criterion?.quality_info?.quality_score || null,
      spend: (r.metrics?.cost_micros || 0) / 1000000,
      impressions: r.metrics?.impressions || 0,
      clicks: r.metrics?.clicks || 0,
      conversions: r.metrics?.conversions || 0,
    }));

    console.table(keywords);

  } catch (err) {
    console.error('An error occurred:', err);
  }
}

run();
