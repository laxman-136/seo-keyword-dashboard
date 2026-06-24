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
  const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=100&skip=0`;
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
  return { count: data.total_count, leads: data.data };
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

    const toTime = new Date('2026-06-23T23:59:59+05:30').getTime();

    // 1. Calendar-based 6 months (Dec 1, 2025)
    const calendarFrom = new Date('2025-12-01T00:00:00+05:30').getTime();

    // 2. Rolling 6 months (Dec 23, 2025)
    const rollingFrom = new Date(new Date('2026-06-23T19:35:50+05:30').getTime() - 180 * 24 * 60 * 60 * 1000).getTime();

    console.log('Querying live TeleCRM API...');

    const resCal = await testSearch(token, enterpriseId, { status: 'Fresh', lead_date: { from: calendarFrom, to: toTime } });
    console.log(`Live Fresh count (Calendar Dec 1 - Jun 23): ${resCal.count}`);
    
    const resRoll = await testSearch(token, enterpriseId, { status: 'Fresh', lead_date: { from: rollingFrom, to: toTime } });
    console.log(`Live Fresh count (Rolling 180 days Dec 25 - Jun 23): ${resRoll.count}`);

    // Print first 5 fresh leads
    console.log('\nSample Live Fresh Leads:');
    resCal.leads.slice(0, 10).forEach(l => {
      console.log(`Name: ${l.fields.name}, Created On: ${new Date(l.fields.created_on).toLocaleString('en-IN')}, Lead Date: ${l.fields.lead_date ? new Date(l.fields.lead_date).toLocaleString('en-IN') : 'N/A'}`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
