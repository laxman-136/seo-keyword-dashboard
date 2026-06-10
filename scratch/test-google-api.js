// scratch/test-google-api.js
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
  
  if (!configs || configs.length === 0) {
    console.error('No active config in database');
    return;
  }

  const config = configs[0];
  console.log('Google Client ID:', config.google_client_id ? 'Configured' : 'Missing');
  console.log('Google Client Secret:', config.google_client_secret ? 'Configured' : 'Missing');
  console.log('Google Developer Token:', config.google_developer_token ? 'Configured' : 'Missing');
  console.log('Google Refresh Token:', config.google_refresh_token ? 'Configured' : 'Missing');
  console.log('Google Customer ID:', config.google_customer_id || 'Missing');

  const customerId = config.google_customer_id;
  const devToken = config.google_developer_token;
  const clientId = config.google_client_id;
  const clientSecret = config.google_client_secret;
  const refreshToken = config.google_refresh_token;

  if (!customerId || !devToken || !clientId || !clientSecret || !refreshToken) {
    console.error('Some Google Ads credentials are missing!');
    return;
  }

  // Test query
  const todayStr = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
      WHERE segments.date BETWEEN '${sevenDaysAgo}' AND '${todayStr}'
    `;

    console.log('Running query on Google Customer ID:', customerId);
    const rows = await customer.query(query);
    console.log('Google Ads query successful!');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Google Ads API Error:', err);
  }
}

run();
