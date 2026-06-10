// scratch/test-google-year.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx > 0) {
    env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY);

async function run() {
  const { data: configs } = await supabase
    .from('configurations')
    .select('*')
    .eq('is_active', true);
  
  const config = configs[0];
  const customerId = config.google_customer_id;
  const devToken = config.google_developer_token;
  const clientId = config.google_client_id;
  const clientSecret = config.google_client_secret;
  const refreshToken = config.google_refresh_token;

  const since = '2026-01-01';
  const todayStr = new Date().toISOString().split('T')[0];

  const { GoogleAdsApi } = require('google-ads-api');
  
  try {
    const client = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: devToken,
    });

    const customer = client.Customer({
      customer_id: customerId.replace(/-/g, ''),
      refresh_token: refreshToken,
    });

    const query = `
      SELECT
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions
      FROM customer
      WHERE segments.date BETWEEN '${since}' AND '${todayStr}'
    `;

    console.log('Running query on Google Customer ID:', customerId);
    const rows = await customer.query(query);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Google Ads API Error:', err);
  }
}

run();
