// scratch/test-meta-future.js
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

  // This Year date range (extends to December 31, 2026)
  const since = '2026-01-01';
  const until = '2026-12-31';

  const timeRange = JSON.stringify({ since, until });
  const url = `https://graph.facebook.com/v19.0/${accountId}/insights?fields=spend,impressions,clicks,ctr,cpm,cpc,reach,frequency,actions,action_values&time_range=${encodeURIComponent(timeRange)}&level=account`;

  console.log('Fetching insights for future date range:', url.substring(0, 120) + '...');
  
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
