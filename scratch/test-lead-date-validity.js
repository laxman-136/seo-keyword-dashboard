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

    const testSearch = async (filters) => {
      const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=50&skip=0`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: filters })
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
      }
      return response.json();
    };

    // Let's search a specific range: say, 2026-06-01 to 2026-06-05 (which corresponds to June in local time)
    // Wait, the current local time is 2026-06-17. Let's do June 1st to June 5th, 2026.
    const fromDate = new Date('2026-06-01T00:00:00.000Z');
    const toDate = new Date('2026-06-05T23:59:59.999Z');
    const fromMs = fromDate.getTime();
    const toMs = toDate.getTime();

    console.log(`Querying range: ${fromDate.toISOString()} to ${toDate.toISOString()}`);

    console.log(`\n--- Fetching with created_on range ---`);
    const resCreated = await testSearch({ created_on: { from: fromMs, to: toMs } });
    console.log(`Total count by created_on: ${resCreated.total_count}`);
    resCreated.data.slice(0, 5).forEach((l, idx) => {
      console.log(`Lead ${idx+1}: id=${l.id}, created_on=${new Date(l.fields?.created_on).toISOString()}, lead_date=${l.fields?.lead_date ? new Date(l.fields?.lead_date).toISOString() : 'N/A'}`);
    });

    console.log(`\n--- Fetching with lead_date range ---`);
    const resLeadDate = await testSearch({ lead_date: { from: fromMs, to: toMs } });
    console.log(`Total count by lead_date: ${resLeadDate.total_count}`);
    resLeadDate.data.slice(0, 5).forEach((l, idx) => {
      console.log(`Lead ${idx+1}: id=${l.id}, created_on=${new Date(l.fields?.created_on).toISOString()}, lead_date=${l.fields?.lead_date ? new Date(l.fields?.lead_date).toISOString() : 'N/A'}`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
