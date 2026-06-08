// scratch/test-meta-api.js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
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
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data: config, error } = await supabase
      .from('configurations')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (error || !config) {
      console.log('❌ Failed to load active configuration:', error);
      return;
    }

    const accountId = config.meta_ad_account_id;
    const token = config.meta_access_token;
    
    console.log(`Using Account ID: ${accountId}`);
    
    // We will test fetch on Graph API
    const META_BASE = "https://graph.facebook.com/v19.0";
    const timeRange = JSON.stringify({ since: '2026-03-01', until: '2026-06-08' });
    const url = `${META_BASE}/${accountId}/campaigns?fields=id,name,status,effective_status,objective,daily_budget,lifetime_budget&filtering=[{field:'effective_status',operator:'IN',value:['ACTIVE','PAUSED']}]`;

    console.log(`Fetching: ${url}`);
    
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.log(`❌ Meta API Error (${res.status}):`, errText);
      return;
    }

    const json = await res.json();
    console.log('✅ Success! Campaigns fetched:');
    console.log(JSON.stringify(json, null, 2));

  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

run();
