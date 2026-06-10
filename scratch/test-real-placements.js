// scratch/test-real-placements.js
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

    if (!config) {
      console.error('No active config found');
      return;
    }

    const devToken = config.google_developer_token;
    const clientId = config.google_client_id;
    const clientSecret = config.google_client_secret;
    const refreshToken = config.google_refresh_token;
    const customerId = config.google_customer_id;
    const managerId = config.google_manager_id;
    const metaAccountId = config.meta_ad_account_id;
    const metaAccessToken = config.meta_access_token;

    console.log('--- TESTING META PLACEMENTS ---');
    if (metaAccountId && metaAccessToken) {
      const url = `https://graph.facebook.com/v19.0/${metaAccountId}/insights?fields=spend,impressions,clicks,actions&time_range={"since":"2026-05-01","until":"2026-06-09"}&breakdowns=publisher_platform,platform_position&level=account`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${metaAccessToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        console.log('Meta placement rows found:', json.data?.length || 0);
        console.log('First 5 Meta rows:');
        console.log(JSON.stringify(json.data?.slice(0, 5), null, 2));
      } else {
        console.error('Meta placement error:', await res.text());
      }
    } else {
      console.log('No Meta credentials');
    }

    console.log('\n--- TESTING GOOGLE PLACEMENTS ---');
    if (devToken && clientId && clientSecret && refreshToken && customerId) {
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

      const query = `
        SELECT
          segments.ad_network_type,
          metrics.cost_micros,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions
        FROM customer
        WHERE segments.date BETWEEN '2026-05-01' AND '2026-06-09'
      `;
      try {
        const rows = await customer.query(query);
        console.log('Google placement rows found:', rows.length);
        console.log(JSON.stringify(rows, null, 2));
      } catch (err) {
        console.error('Google placement error:', err);
      }
    } else {
      console.log('No Google credentials');
    }

  } catch (err) {
    console.error('Error in script run:', err);
  }
}

run();
