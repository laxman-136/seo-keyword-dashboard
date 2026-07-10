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
      console.log('No active configuration found');
      return;
    }
    const token = config.telecrm_api_token || envVars.TELECRM_API_TOKEN;
    const enterpriseId = config.telecrm_enterprise_id || envVars.TELECRM_ENTERPRISE_ID;

    const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=10&skip=0`;
    const body = { fields: {} }; // Get any 10 leads

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      console.log('Failed to fetch:', res.status, res.statusText);
      return;
    }

    const result = await res.json();
    const leads = result.data || [];
    if (leads.length === 0) {
      console.log('No leads found.');
      return;
    }

    // Collect all unique keys across these leads
    const allKeys = new Set();
    leads.forEach(lead => {
      const f = lead.fields || {};
      Object.keys(f).forEach(k => allKeys.add(k));
    });

    console.log('All unique field keys found in leads:', Array.from(allKeys).sort());

  } catch (err) {
    console.error(err);
  }
}

run();
