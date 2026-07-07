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

async function searchLead(term) {
  const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
  const token = config.telecrm_api_token;
  const enterpriseId = config.telecrm_enterprise_id;

  const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: { name: term } })
  });
  return response.json();
}

async function run() {
  try {
    const names = ['Ajeesh', 'Shahid', 'Sridher'];
    for (const name of names) {
      const res = await searchLead(name);
      console.log(`\nResults for name containing "${name}":`);
      if (res.data && res.data.length > 0) {
        res.data.forEach(l => {
          console.log(`- CRM Name: ${l.fields.name} | Email: ${l.fields.email} | Phone: ${l.fields.phone} | Course: ${l.fields.course} | Status: ${l.status}`);
        });
      } else {
        console.log('No matching lead found.');
      }
    }
  } catch (err) {
    console.error(err);
  }
}

run();
