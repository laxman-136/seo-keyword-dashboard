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

    // Scan modified leads in the last 15 days
    const daysAgo = 15;
    const fromMs = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
    const toMs = Date.now() + 24 * 60 * 60 * 1000;

    console.log(`Scanning leads modified in the last ${daysAgo} days (since ${new Date(fromMs).toLocaleDateString()})...`);

    const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=100&skip=0`;
    const body = {
      fields: {
        modified_on: { from: fromMs, to: toMs }
      }
    };

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
    console.log(`Found ${leads.length} recently modified leads.`);

    leads.forEach((lead, i) => {
      const f = lead.fields || {};
      console.log(`\n[${i+1}] Name: ${f.name} | Phone: ${f.phone} | Status: ${lead.status || f.status} | Modified: ${new Date(f.modified_on).toLocaleDateString()}`);
      
      // Let's print ALL keys in this lead's fields
      const keys = Object.keys(f);
      console.log('    Fields:', JSON.stringify(f, null, 2));
    });

  } catch (err) {
    console.error(err);
  }
}

run();
