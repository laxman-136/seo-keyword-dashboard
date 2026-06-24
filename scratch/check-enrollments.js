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

    // Use our actual telecrm-api library functions to be consistent
    // We can require lib/telecrm-api
    // Since we are running in node, let's register ts-node or just fetch directly to make it simple
    const testSearch = async (filters, limit = 100, skip = 0) => {
      const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=${limit}&skip=${skip}`;
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
      return response.json();
    };

    // June 1st to June 23rd, 2026 in IST (+5:30)
    const fromDate = new Date('2026-06-01T00:00:00.000+05:30');
    const toDate = new Date('2026-06-23T23:59:59.999+05:30');
    const fromMs = fromDate.getTime();
    const toMs = toDate.getTime();

    // Fetch both lead_date and created_on ranges to merge accurately
    let leadDateLeads = [];
    let skip = 0;
    while (true) {
      const res = await testSearch({ lead_date: { from: fromMs, to: toMs } }, 100, skip);
      leadDateLeads.push(...res.data);
      if (res.data.length < 100 || leadDateLeads.length >= res.total_count) break;
      skip += 100;
    }

    let createdOnLeads = [];
    skip = 0;
    while (true) {
      const res = await testSearch({ created_on: { from: fromMs, to: toMs } }, 100, skip);
      createdOnLeads.push(...res.data);
      if (res.data.length < 100 || createdOnLeads.length >= res.total_count) break;
      skip += 100;
    }

    const mergedMap = new Map();
    leadDateLeads.forEach(l => mergedMap.set(l.id, l));
    createdOnLeads.forEach(l => mergedMap.set(l.id, l));

    // Filter using: lead_date || created_on
    const filteredLeads = [];
    mergedMap.forEach(l => {
      const effectiveDate = l.fields?.lead_date || l.fields?.created_on;
      if (effectiveDate >= fromMs && effectiveDate <= toMs) {
        filteredLeads.push(l);
      }
    });

    const enrolled = filteredLeads.filter(l => l.status === 'Enrolled');

    console.log(`Total Enrollments this month (effective date in June 1 - June 23): ${enrolled.length}`);
    console.log(`\nList of Enrolled Students:`);
    enrolled.forEach((l, idx) => {
      const dateVal = l.fields?.lead_date || l.fields?.created_on;
      console.log(`${idx+1}. Name: ${l.fields?.name}, Course: ${l.fields?.course}, Date: ${new Date(dateVal).toLocaleDateString('en-IN')}, Phone: ${l.fields?.phone}`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
