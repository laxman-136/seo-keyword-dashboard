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

    const searchLeadsWithRetry = async (filters, limit = 100, skip = 0) => {
      const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=${limit}&skip=${skip}`;
      let retries = 3;
      while (retries > 0) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: filters })
          });
          if (response.ok) {
            return await response.json();
          }
        } catch (e) {}
        retries--;
        await new Promise(r => setTimeout(r, 1000));
      }
      throw new Error(`Failed to fetch leads`);
    };

    // Oct 1st to Oct 31st, 2025 in IST (+5:30)
    const fromDate = new Date('2025-10-01T00:00:00.000+05:30');
    const toDate = new Date('2025-10-31T23:59:59.999+05:30');
    const fromMs = fromDate.getTime();
    const toMs = toDate.getTime();

    // Fetch created_on range for Oct 2025
    console.log('Fetching leads by Created On for Oct 2025 (Paging through to inspect first 500)...');
    let createdOnLeads = [];
    let skip = 0;
    while (createdOnLeads.length < 500) {
      const res = await searchLeadsWithRetry({ created_on: { from: fromMs, to: toMs } }, 100, skip);
      createdOnLeads.push(...res.data);
      if (res.data.length < 100 || createdOnLeads.length >= res.total_count) break;
      skip += 100;
      await new Promise(r => setTimeout(r, 200));
    }

    let emptyLeadDateCount = 0;
    let otherMonthLeadDateCount = 0;
    let sameMonthLeadDateCount = 0;
    const sampleExcl = [];

    createdOnLeads.forEach(l => {
      const leadDate = l.fields?.lead_date;
      if (!leadDate) {
        emptyLeadDateCount++;
        if (sampleExcl.length < 10) {
          sampleExcl.push({
            name: l.fields?.name || '(blank name)',
            createdBy: l.createdBy,
            createdOn: new Date(l.fields.created_on).toLocaleDateString(),
            phone: l.fields.phone
          });
        }
      } else if (leadDate < fromMs || leadDate > toMs) {
        otherMonthLeadDateCount++;
      } else {
        sameMonthLeadDateCount++;
      }
    });

    console.log(`\n=== SAMPLE OF 500 LEADS IN OCT 2025 ===`);
    console.log(`Leads with empty/blank Lead Date: ${emptyLeadDateCount} (${(emptyLeadDateCount/createdOnLeads.length * 100).toFixed(1)}%)`);
    console.log(`Leads with Lead Date in another month: ${otherMonthLeadDateCount} (${(otherMonthLeadDateCount/createdOnLeads.length * 100).toFixed(1)}%)`);
    console.log(`Leads with Lead Date in Oct 2025: ${sameMonthLeadDateCount} (${(sameMonthLeadDateCount/createdOnLeads.length * 100).toFixed(1)}%)`);

    console.log('\n=== SAMPLE OF EMPTY LEAD DATE LEADS IN OCT 2025 ===');
    console.log(sampleExcl);

  } catch (err) {
    console.error(err);
  }
}

run();
