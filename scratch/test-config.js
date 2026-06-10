// scratch/test-config.js
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
  const { data: configs, error } = await supabase
    .from('configurations')
    .select('*')
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching config:', error);
    return;
  }

  console.log('Active Configurations count:', configs.length);
  if (configs.length > 0) {
    const config = configs[0];
    console.log('Active Configuration ID:', config.id);
    console.log('Label:', config.label);
    console.log('Meta Ad Account ID:', config.meta_ad_account_id);
    console.log('Meta Access Token configured:', !!config.meta_access_token);
    console.log('Google Customer ID:', config.google_customer_id);
    console.log('TeleCRM Api Token configured:', !!config.telecrm_api_token);
  } else {
    console.log('No active configuration found in database!');
  }
}

run();
