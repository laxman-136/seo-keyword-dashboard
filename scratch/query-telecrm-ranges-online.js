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

async function testSearch(token, enterpriseId, filters) {
  const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=1&skip=0`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: filters })
  });
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }
  const data = await response.json();
  return data.total_count;
}

async function run() {
  try {
    const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
    if (!config) {
      console.log('No configuration found');
      return;
    }
    const token = config.telecrm_api_token;
    const enterpriseId = config.telecrm_enterprise_id;

    // Define dates in IST
    const toTime = new Date('2026-06-23T23:59:59+05:30').getTime();

    // 1. March 1 to June 23 (Dashboard "Last 3 Months" range)
    const m1From = new Date('2026-03-01T00:00:00+05:30').getTime();
    
    // 2. March 23 to June 23 (Rolling 3 months)
    const m23From = new Date('2026-03-23T00:00:00+05:30').getTime();

    // 3. April 1 to June 23 (Strict last 3 calendar months: Apr, May, Jun)
    const a1From = new Date('2026-04-01T00:00:00+05:30').getTime();

    console.log('Querying TeleCRM API online...');

    const countM1 = await testSearch(token, enterpriseId, { lead_date: { from: m1From, to: toTime } });
    console.log(`Leads with lead_date between March 1 and June 23: ${countM1}`);

    const countM23 = await testSearch(token, enterpriseId, { lead_date: { from: m23From, to: toTime } });
    console.log(`Leads with lead_date between March 23 and June 23: ${countM23}`);

    const countA1 = await testSearch(token, enterpriseId, { lead_date: { from: a1From, to: toTime } });
    console.log(`Leads with lead_date between April 1 and June 23: ${countA1}`);

    // Let's also check created_on for March 1 to June 23
    const countCreatedM1 = await testSearch(token, enterpriseId, { created_on: { from: m1From, to: toTime } });
    console.log(`Leads with created_on between March 1 and June 23: ${countCreatedM1}`);

  } catch (err) {
    console.error(err);
  }
}

run();
