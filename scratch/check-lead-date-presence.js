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

    // Fetch 100 leads without date filtering
    const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=100&skip=0`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: {} })
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP error ${response.status}: ${errText}`);
    }
    const data = await response.json();
    console.log(`Fetched ${data.data.length} leads.`);
    let missingLeadDate = 0;
    let missingCreatedOn = 0;
    data.data.forEach((l, idx) => {
      if (!l.fields?.lead_date) {
        missingLeadDate++;
        console.log(`Missing lead_date lead: id=${l.id}, name=${l.fields?.name || 'N/A'}, status=${l.status}, created_on=${l.fields?.created_on ? new Date(l.fields?.created_on).toISOString() : 'N/A'}`);
      }
      if (!l.fields?.created_on) missingCreatedOn++;
    });
    console.log(`\nTotal Missing lead_date: ${missingLeadDate}`);
    console.log(`Total Missing created_on: ${missingCreatedOn}`);
  } catch (err) {
    console.error(err);
  }
}

run();
