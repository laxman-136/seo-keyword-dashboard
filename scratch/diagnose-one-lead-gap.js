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

    // Search with retry to handle rate limits
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
          console.warn(`[Retry Warning] Status ${response.status}. Retrying in 1s...`);
        } catch (e) {
          console.warn(`[Retry Warning] Error: ${e.message}. Retrying in 1s...`);
        }
        retries--;
        await new Promise(r => setTimeout(r, 1000));
      }
      throw new Error(`Failed to fetch leads for filters: ${JSON.stringify(filters)}`);
    };

    // June 1st to June 23rd, 2026 in IST (+5:30)
    const fromDate = new Date('2026-06-01T00:00:00.000+05:30');
    const toDate = new Date('2026-06-23T23:59:59.999+05:30');
    const fromMs = fromDate.getTime();
    const toMs = toDate.getTime();

    // Fetch lead_date chunk
    console.log('Fetching leads by Lead Date...');
    let leadDateLeads = [];
    let skip = 0;
    while (true) {
      const res = await searchLeadsWithRetry({ lead_date: { from: fromMs, to: toMs } }, 100, skip);
      leadDateLeads.push(...res.data);
      if (res.data.length < 100 || leadDateLeads.length >= res.total_count) break;
      skip += 100;
      await new Promise(r => setTimeout(r, 200)); // rate limit breathing room
    }

    // Fetch created_on chunk
    console.log('Fetching leads by Created On...');
    let createdOnLeads = [];
    skip = 0;
    while (true) {
      const res = await searchLeadsWithRetry({ created_on: { from: fromMs, to: toMs } }, 100, skip);
      createdOnLeads.push(...res.data);
      if (res.data.length < 100 || createdOnLeads.length >= res.total_count) break;
      skip += 100;
      await new Promise(r => setTimeout(r, 200)); // rate limit breathing room
    }

    console.log(`\nLeads in TeleCRM with 'Lead Date' in June 2026: ${leadDateLeads.length}`);
    console.log(`Leads in TeleCRM with 'Created On' in June 2026: ${createdOnLeads.length}`);

    // Analyze counts using the dashboard effective date rules:
    // Effective Date = lead_date || created_on
    // Keep only if Effective Date is in June 2026.
    const mergedMap = new Map();
    leadDateLeads.forEach(l => mergedMap.set(l.id, { lead: l, inLeadDate: true, inCreatedOn: false }));
    createdOnLeads.forEach(l => {
      if (mergedMap.has(l.id)) {
        mergedMap.get(l.id).inCreatedOn = true;
      } else {
        mergedMap.set(l.id, { lead: l, inLeadDate: false, inCreatedOn: true });
      }
    });

    const finalDashboardLeads = [];
    mergedMap.forEach((item, id) => {
      const l = item.lead;
      const dateVal = l.fields?.lead_date || l.fields?.created_on;
      if (dateVal >= fromMs && dateVal <= toMs) {
        finalDashboardLeads.push(item);
      }
    });

    console.log(`Dashboard Total Leads resolved: ${finalDashboardLeads.length}`);

    // Find the leads that are in Dashboard but NOT in the "Lead Date is Month 06/2026" search.
    // In TeleCRM UI, filtering by "Lead date Is Month 06/2026" should fetch all leads where fields.lead_date is in June 2026.
    // Let's print those dashboard leads where inLeadDate is false (meaning they got in because of Created On fallback!).
    const fallbackLeads = finalDashboardLeads.filter(item => !item.inLeadDate);
    console.log(`\nLeads in Dashboard that have NO Lead Date in June (using Created On fallback): ${fallbackLeads.length}`);
    fallbackLeads.forEach((item, idx) => {
      const l = item.lead;
      console.log(`\nFallback Lead ${idx + 1}:`);
      console.log(`ID: ${l.id}`);
      console.log(`Name: ${l.fields?.name}`);
      console.log(`Lead Date: ${l.fields?.lead_date ? new Date(l.fields.lead_date).toLocaleDateString() : 'EMPTY/MISSING'}`);
      console.log(`Created On: ${new Date(l.fields?.created_on).toLocaleString()}`);
    });

    // Also let's check if there are any leads with Lead Date in June but NOT in the dashboard (e.g. effective date filtered out? shouldn't happen)
    const oddLeads = finalDashboardLeads.filter(item => item.inLeadDate && (item.lead.fields?.lead_date < fromMs || item.lead.fields?.lead_date > toMs));
    console.log(`\nOdd leads (should be 0): ${oddLeads.length}`);

  } catch (err) {
    console.error(err);
  }
}

run();
