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

    // May 1st to May 31st, 2026 in IST (+5:30)
    const fromDate = new Date('2026-05-01T00:00:00.000+05:30');
    const toDate = new Date('2026-05-31T23:59:59.999+05:30');
    const fromMs = fromDate.getTime();
    const toMs = toDate.getTime();

    // Fetch lead_date chunk
    let leadDateLeads = [];
    let skip = 0;
    while (true) {
      const res = await searchLeadsWithRetry({ lead_date: { from: fromMs, to: toMs } }, 100, skip);
      leadDateLeads.push(...res.data);
      if (res.data.length < 100 || leadDateLeads.length >= res.total_count) break;
      skip += 100;
      await new Promise(r => setTimeout(r, 200));
    }

    // Fetch created_on chunk
    let createdOnLeads = [];
    skip = 0;
    while (true) {
      const res = await searchLeadsWithRetry({ created_on: { from: fromMs, to: toMs } }, 100, skip);
      createdOnLeads.push(...res.data);
      if (res.data.length < 100 || createdOnLeads.length >= res.total_count) break;
      skip += 100;
      await new Promise(r => setTimeout(r, 200));
    }

    const mergedMap = new Map();
    leadDateLeads.forEach(l => mergedMap.set(l.id, { lead: l, inLeadDate: true }));
    createdOnLeads.forEach(l => {
      if (!mergedMap.has(l.id)) {
        mergedMap.set(l.id, { lead: l, inLeadDate: false });
      }
    });

    const finalDashboardLeads = [];
    mergedMap.forEach(item => {
      const dateVal = item.lead.fields?.lead_date || item.lead.fields?.created_on;
      if (dateVal >= fromMs && dateVal <= toMs) {
        finalDashboardLeads.push(item);
      }
    });

    const gapLeads = finalDashboardLeads.filter(item => !item.inLeadDate);
    console.log(`=== GAP LEADS FOUND: ${gapLeads.length} ===`);
    gapLeads.forEach((item, idx) => {
      const l = item.lead;
      console.log(`${(idx + 1).toString().padStart(2)}. Name: ${l.fields?.name.padEnd(25)} | Created On: ${new Date(l.fields?.created_on).toLocaleDateString()} | Assigned To: ${l.employeeid || 'Unassigned'}`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
