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

    // 1. Enrolled status leads filtered by lead_date in June 1-23
    let leadDateEnrolled = [];
    let skip = 0;
    while (true) {
      const res = await testSearch({ status: 'Enrolled', lead_date: { from: fromMs, to: toMs } }, 100, skip);
      leadDateEnrolled.push(...res.data);
      if (res.data.length < 100 || leadDateEnrolled.length >= res.total_count) break;
      skip += 100;
    }
    console.log(`Enrolled leads by lead_date filter (June 1-23): ${leadDateEnrolled.length}`);

    // 2. Enrolled status leads filtered by created_on in June 1-23
    let createdOnEnrolled = [];
    skip = 0;
    while (true) {
      const res = await testSearch({ status: 'Enrolled', created_on: { from: fromMs, to: toMs } }, 100, skip);
      createdOnEnrolled.push(...res.data);
      if (res.data.length < 100 || createdOnEnrolled.length >= res.total_count) break;
      skip += 100;
    }
    console.log(`Enrolled leads by created_on filter (June 1-23): ${createdOnEnrolled.length}`);

    // Let's merge them
    const leadDateMap = new Map(leadDateEnrolled.map(l => [l.id, l]));
    const createdOnMap = new Map(createdOnEnrolled.map(l => [l.id, l]));

    const merged = new Map();
    leadDateEnrolled.forEach(l => merged.set(l.id, l));
    createdOnEnrolled.forEach(l => merged.set(l.id, l));
    console.log(`Merged enrolled leads (either filter matched): ${merged.size}`);

    // Filtered by effective date in window
    const filteredEnrolled = [];
    const onlyCreatedInWindow = [];
    const onlyLeadDateInWindow = [];

    merged.forEach(l => {
      const dateVal = l.fields?.lead_date || l.fields?.created_on;
      const inWindow = dateVal >= fromMs && dateVal <= toMs;
      if (inWindow) {
        filteredEnrolled.push(l);
        const coInWindow = l.fields?.created_on >= fromMs && l.fields?.created_on <= toMs;
        const ldInWindow = l.fields?.lead_date >= fromMs && l.fields?.lead_date <= toMs;
        if (ldInWindow && !coInWindow) {
          onlyLeadDateInWindow.push(l);
        } else if (coInWindow && !ldInWindow) {
          onlyCreatedInWindow.push(l);
        }
      }
    });

    console.log(`\nFiltered enrolled leads (effective date in window): ${filteredEnrolled.length}`);
    console.log(`- Only lead_date in window (created_on outside): ${onlyLeadDateInWindow.length}`);
    console.log(`- Only created_on in window (lead_date outside or missing): ${onlyCreatedInWindow.length}`);

    if (onlyLeadDateInWindow.length > 0) {
      console.log(`\nLeads where lead_date is in June but created_on is outside:`);
      onlyLeadDateInWindow.forEach(l => {
        console.log(`- ${l.fields?.name}: lead_date=${new Date(l.fields?.lead_date).toISOString()}, created_on=${new Date(l.fields?.created_on).toISOString()}`);
      });
    }

    if (onlyCreatedInWindow.length > 0) {
      console.log(`\nLeads where created_on is in June but lead_date is outside/missing:`);
      onlyCreatedInWindow.forEach(l => {
        console.log(`- ${l.fields?.name}: lead_date=${l.fields?.lead_date ? new Date(l.fields.lead_date).toISOString() : 'MISSING'}, created_on=${new Date(l.fields?.created_on).toISOString()}`);
      });
    }

    // Wait! Let's check if there are Enrolled leads in TeleCRM that do not match either filter or if we can fetch all Enrolled leads and check their dates
    console.log('\nFetching ALL Enrolled leads from the system to check dates...');
    let allEnrolled = [];
    skip = 0;
    while (true) {
      const res = await testSearch({ status: 'Enrolled' }, 100, skip);
      allEnrolled.push(...res.data);
      if (res.data.length < 100 || allEnrolled.length >= res.total_count) break;
      skip += 100;
    }
    console.log(`Total Enrolled leads in system: ${allEnrolled.length}`);

    // Print those that have lead_date in June 2026 (regardless of created_on)
    const leadDateInJuneAll = allEnrolled.filter(l => {
      const dateVal = l.fields?.lead_date;
      return dateVal && dateVal >= fromMs && dateVal <= toMs;
    });
    console.log(`Enrolled leads with lead_date in June 1-23 (entire system): ${leadDateInJuneAll.length}`);

    // Print details of leadDateInJuneAll
    leadDateInJuneAll.forEach((l, idx) => {
      console.log(`June LeadDate Enrolled ${idx+1}: ${l.fields?.name}, lead_date=${new Date(l.fields?.lead_date).toLocaleDateString()}, created_on=${new Date(l.fields?.created_on).toLocaleDateString()}`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
