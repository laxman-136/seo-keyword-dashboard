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

function getStartOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function getEndOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
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
    // Let's match the range on the dashboard: 2026-06-01 to 2026-06-23
    const fromDate = new Date('2026-06-01T00:00:00.000+05:30');
    const toDate = new Date('2026-06-23T23:59:59.999+05:30');
    const fromMs = fromDate.getTime();
    const toMs = toDate.getTime();

    console.log(`Analyzing June 1 to June 23 range (${fromMs} to ${toMs})`);

    // 1. Fetch by lead_date
    const leadDateLeads = [];
    let skip = 0;
    while (true) {
      const res = await testSearch({ lead_date: { from: fromMs, to: toMs } }, 100, skip);
      leadDateLeads.push(...res.data);
      if (res.data.length < 100 || leadDateLeads.length >= res.total_count) break;
      skip += 100;
    }
    console.log(`Fetched by lead_date filter: ${leadDateLeads.length} leads.`);

    // 2. Fetch by created_on
    const createdOnLeads = [];
    skip = 0;
    while (true) {
      const res = await testSearch({ created_on: { from: fromMs, to: toMs } }, 100, skip);
      createdOnLeads.push(...res.data);
      if (res.data.length < 100 || createdOnLeads.length >= res.total_count) break;
      skip += 100;
    }
    console.log(`Fetched by created_on filter: ${createdOnLeads.length} leads.`);

    // Let's do merging & diagnostics
    const leadDateMap = new Map(leadDateLeads.map(l => [l.id, l]));
    const createdOnMap = new Map(createdOnLeads.map(l => [l.id, l]));

    // Unique merged
    const mergedMap = new Map();
    leadDateLeads.forEach(l => mergedMap.set(l.id, l));
    createdOnLeads.forEach(l => mergedMap.set(l.id, l));
    console.log(`Total unique merged leads: ${mergedMap.size}`);

    // Filter using: lead_date || created_on
    const filteredLeads = [];
    const onlyCreatedInWindow = [];
    const onlyLeadDateInWindow = [];
    const bothInWindow = [];

    mergedMap.forEach(l => {
      const effectiveDate = l.fields?.lead_date || l.fields?.created_on;
      const inWindow = effectiveDate >= fromMs && effectiveDate <= toMs;
      if (inWindow) {
        filteredLeads.push(l);
        
        const hasLeadDateInWindow = l.fields?.lead_date >= fromMs && l.fields?.lead_date <= toMs;
        const hasCreatedInWindow = l.fields?.created_on >= fromMs && l.fields?.created_on <= toMs;

        if (hasLeadDateInWindow && hasCreatedInWindow) {
          bothInWindow.push(l);
        } else if (hasLeadDateInWindow) {
          onlyLeadDateInWindow.push(l);
        } else if (hasCreatedInWindow) {
          onlyCreatedInWindow.push(l);
        }
      }
    });

    console.log(`\nFiltered results (effective date in window): ${filteredLeads.length}`);
    console.log(`- Both lead_date and created_on in window: ${bothInWindow.length}`);
    console.log(`- Only lead_date in window (created_on outside): ${onlyLeadDateInWindow.length}`);
    console.log(`- Only created_on in window (lead_date outside or missing): ${onlyCreatedInWindow.length}`);

    console.log(`\nLet's analyze the ${onlyCreatedInWindow.length} leads where only created_on was in the window:`);
    onlyCreatedInWindow.slice(0, 15).forEach((l, idx) => {
      const ldVal = l.fields?.lead_date;
      const coVal = l.fields?.created_on;
      console.log(`Lead ${idx+1}: id=${l.id}, name=${l.fields?.name}, lead_date=${ldVal ? new Date(ldVal).toISOString() : 'MISSING'}, created_on=${coVal ? new Date(coVal).toISOString() : 'MISSING'}`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
