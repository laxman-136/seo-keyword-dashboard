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
    const customerId = config.google_customer_id;
    const managerId = config.google_manager_id;

    const { GoogleAdsApi } = await import('google-ads-api');
    
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

    console.log('Customer methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(customer)));

  } catch (err) {
    console.error(err);
  }
}

run();
