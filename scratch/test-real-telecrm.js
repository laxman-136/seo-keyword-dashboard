// scratch/test-real-telecrm.js
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

    const token = config.telecrm_api_token;
    const enterpriseId = config.telecrm_enterprise_id;
    
    console.log(`Active Config Label: ${config.label}`);
    console.log(`TeleCRM Token: ${token ? token.substring(0, 10) + '...' : 'None'}`);
    console.log(`TeleCRM Enterprise ID: ${enterpriseId}`);

    if (!token || !enterpriseId) {
      console.log('❌ TeleCRM credentials are not configured.');
      return;
    }

    // Call TeleCRM search leads API with limit 1
    const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=5&skip=0`;
    console.log(`Fetching from TeleCRM: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: {} })
    });

    if (!response.ok) {
      const text = await response.text();
      console.log(`❌ TeleCRM API Error (${response.status}):`, text);
      return;
    }

    const data = await response.json();
    console.log('✅ TeleCRM Success! Leads fetched:');
    console.log(`Total Leads in system: ${data.total_count}`);
    console.log(`Fetched leads list samples:`, data.data.map(l => ({
      id: l.id,
      status: l.status,
      course: l.fields?.course,
      utmcampaign: l.fields?.utmcampaign,
      lead_source_1: l.fields?.lead_source_1
    })));

  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

run();
