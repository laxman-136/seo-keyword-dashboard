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

    // Query all leads in the database by paginating (since we want a general trend)
    // To do it fast, let's fetch all leads since Oct 2025 (which covers the spikes)
    const fromMs = new Date('2025-08-01T00:00:00.000+05:30').getTime();
    const toMs = new Date('2026-06-23T23:59:59.999+05:30').getTime();

    console.log('Fetching leads to analyze historical trend...');
    let allLeads = [];
    let skip = 0;
    while (true) {
      const res = await testSearch({ created_on: { from: fromMs, to: toMs } }, 100, skip);
      allLeads.push(...res.data);
      if (res.data.length < 100 || allLeads.length >= res.total_count) break;
      skip += 100;
      await new Promise(r => setTimeout(r, 100));
    }

    console.log(`Fetched ${allLeads.length} leads created since Aug 2025.`);

    // Group by month using BOTH logic and STRICT lead_date logic
    const monthStatsBoth = {};
    const monthStatsStrict = {};

    allLeads.forEach(l => {
      const createdOn = l.fields?.created_on;
      const leadDate = l.fields?.lead_date;

      const dateBoth = leadDate || createdOn;
      if (dateBoth && dateBoth >= fromMs && dateBoth <= toMs) {
        const dateObj = new Date(dateBoth);
        const mLabel = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
        monthStatsBoth[mLabel] = (monthStatsBoth[mLabel] || 0) + 1;
      }

      if (leadDate && leadDate >= fromMs && leadDate <= toMs) {
        const dateObj = new Date(leadDate);
        const mLabel = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
        monthStatsStrict[mLabel] = (monthStatsStrict[mLabel] || 0) + 1;
      }
    });

    console.log('\n======================================================');
    console.log('Month     | Dashboard Current (Merged) | Strict Lead Date');
    console.log('======================================================');
    const sortedMonths = Object.keys(monthStatsBoth).sort();
    sortedMonths.forEach(m => {
      const both = monthStatsBoth[m] || 0;
      const strict = monthStatsStrict[m] || 0;
      console.log(`${m}   | ${both.toString().padEnd(26)} | ${strict}`);
    });
    console.log('======================================================');

  } catch (err) {
    console.error(err);
  }
}

run();
