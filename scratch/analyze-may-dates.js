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
      return response.json();
    };

    // June 1st to June 23rd, 2026 in IST (+5:30)
    const fromDate = new Date('2026-06-01T00:00:00.000+05:30');
    const toDate = new Date('2026-06-23T23:59:59.999+05:30');
    const fromMs = fromDate.getTime();
    const toMs = toDate.getTime();

    // Fetch lead_date chunk
    let leadDateLeads = [];
    let skip = 0;
    while (true) {
      const res = await testSearch({ lead_date: { from: fromMs, to: toMs } }, 100, skip);
      leadDateLeads.push(...res.data);
      if (res.data.length < 100 || leadDateLeads.length >= res.total_count) break;
      skip += 100;
    }

    // Fetch created_on chunk
    let createdOnLeads = [];
    skip = 0;
    while (true) {
      const res = await testSearch({ created_on: { from: fromMs, to: toMs } }, 100, skip);
      createdOnLeads.push(...res.data);
      if (res.data.length < 100 || createdOnLeads.length >= res.total_count) break;
      skip += 100;
    }

    console.log(`Leads with 'Lead Date' in May 2026: ${leadDateLeads.length}`);
    console.log(`Leads with 'Created On' in May 2026: ${createdOnLeads.length}`);

    // Merge them and analyze how the 478 total is composed
    const mergedMap = new Map();
    leadDateLeads.forEach(l => mergedMap.set(l.id, { lead: l, source: 'lead_date' }));
    createdOnLeads.forEach(l => {
      if (mergedMap.has(l.id)) {
        mergedMap.get(l.id).source = 'both';
      } else {
        mergedMap.set(l.id, { lead: l, source: 'created_on' });
      }
    });

    let countLeadDateOnly = 0;
    let countCreatedOnOnly = 0;
    let countBoth = 0;
    let countTotalWithEffectiveInMay = 0;

    mergedMap.forEach(item => {
      const l = item.lead;
      const dateVal = l.fields?.lead_date || l.fields?.created_on;
      if (dateVal >= fromMs && dateVal <= toMs) {
        countTotalWithEffectiveInMay++;
        if (item.source === 'lead_date') countLeadDateOnly++;
        else if (item.source === 'created_on') countCreatedOnOnly++;
        else if (item.source === 'both') countBoth++;
      }
    });

    console.log('\n=== MERGED ANALYSIS ===');
    console.log(`Total Leads with effective date in May 2026: ${countTotalWithEffectiveInMay}`);
    console.log(`- Contributed by Lead Date only: ${countLeadDateOnly}`);
    console.log(`- Contributed by Created On only (missing lead_date or lead_date empty): ${countCreatedOnOnly}`);
    console.log(`- Contributed by Both filters: ${countBoth}`);

  } catch (err) {
    console.error(err);
  }
}

run();
