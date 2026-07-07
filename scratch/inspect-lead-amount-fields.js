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
    const token = config.telecrm_api_token;
    const enterpriseId = config.telecrm_enterprise_id;

    const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=20`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: { status: 'Enrolled' } })
    });
    const res = await response.json();
    
    // Print all field names that have numerical values or look like amounts
    console.log('Inspecting fields for Enrolled leads:');
    const fieldKeys = new Set();
    res.data.forEach(lead => {
      Object.entries(lead.fields || {}).forEach(([k, v]) => {
        const valStr = String(v).toLowerCase();
        if (typeof v === 'number' || k.includes('fee') || k.includes('amount') || k.includes('pay') || k.includes('price') || k.includes('cost') || k.includes('rupee') || k.includes('received') || k.includes('given')) {
          fieldKeys.add(`${k} (Type: ${typeof v}, Example: ${v})`);
        }
      });
    });

    console.log(Array.from(fieldKeys));

  } catch (err) {
    console.error(err);
  }
}

run();
