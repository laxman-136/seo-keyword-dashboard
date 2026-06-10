// scratch/test-meta-account.js
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
  const accountId = config.meta_ad_account_id;
  const token = config.meta_access_token;

  const url = `https://graph.facebook.com/v19.0/${accountId}?fields=name,timezone_name,timezone_offset_hours_utc,account_status,amount_spent,balance,currency`;

  console.log('Fetching account details:', url);
  
  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Response status:', res.status);
    const json = await res.json();
    console.log('Response data:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();
