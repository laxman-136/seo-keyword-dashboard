const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { GoogleAdsApi } = require('google-ads-api');

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

    console.log('Credentials loaded.');

    const client = new GoogleAdsApi({
      client_id: config.google_client_id,
      client_secret: config.google_client_secret,
      developer_token: config.google_developer_token
    });

    const customer = client.Customer({
      customer_id: config.google_customer_id.replace(/-/g, ''),
      login_customer_id: config.google_manager_id ? config.google_manager_id.replace(/-/g, '') : undefined,
      refresh_token: config.google_refresh_token
    });

    console.log('Testing query...');
    const query = `
      SELECT
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks
      FROM customer
      WHERE segments.date BETWEEN '2026-06-01' AND '2026-06-30'
    `;
    const rows = await customer.query(query);
    console.log('Success! Rows:', JSON.stringify(rows));
  } catch (err) {
    console.error('Google Ads API Error details:');
    console.error(err);
  }
}

run();
