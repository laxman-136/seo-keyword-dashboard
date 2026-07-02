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

    // June 1st to June 30th, 2026
    const fromMsIST = new Date('2026-06-01T00:00:00.000+05:30').getTime();
    const toMsIST = new Date('2026-06-30T23:59:59.999+05:30').getTime();

    const fromMsUTC = new Date('2026-06-01T00:00:00.000Z').getTime();
    const toMsUTC = new Date('2026-06-30T23:59:59.999Z').getTime();

    // Query both ranges to make sure we don't miss any leads
    const minFrom = Math.min(fromMsIST, fromMsUTC);
    const maxTo = Math.max(toMsIST, toMsUTC);

    let leads = [];
    let skip = 0;
    while (true) {
      const res = await testSearch({ lead_date: { from: minFrom, to: maxTo } }, 100, skip);
      leads.push(...res.data);
      if (res.data.length < 100 || leads.length >= res.total_count) break;
      skip += 100;
    }

    console.log(`Total live leads fetched: ${leads.length}`);

    // IST Count
    let totalIST = 0;
    leads.forEach(lead => {
      const leadDateVal = lead.fields?.lead_date || lead.fields?.created_on;
      if (leadDateVal && leadDateVal >= fromMsIST && leadDateVal <= toMsIST) {
        totalIST++;
      }
    });

    // UTC Count
    let totalUTC = 0;
    leads.forEach(lead => {
      const leadDateVal = lead.fields?.lead_date || lead.fields?.created_on;
      if (leadDateVal && leadDateVal >= fromMsUTC && leadDateVal <= toMsUTC) {
        totalUTC++;
      }
    });

    console.log(`Live Leads count using IST boundaries: ${totalIST}`);
    console.log(`Live Leads count using UTC boundaries: ${totalUTC}`);

    // Let's print which leads are in UTC but not in IST, or vice-versa
    const inIST = new Set(leads.filter(l => {
      const val = l.fields?.lead_date || l.fields?.created_on;
      return val >= fromMsIST && val <= toMsIST;
    }).map(l => l.id));

    const inUTC = new Set(leads.filter(l => {
      const val = l.fields?.lead_date || l.fields?.created_on;
      return val >= fromMsUTC && val <= toMsUTC;
    }).map(l => l.id));

    const onlyIST = leads.filter(l => inIST.has(l.id) && !inUTC.has(l.id));
    const onlyUTC = leads.filter(l => inUTC.has(l.id) && !inIST.has(l.id));

    console.log(`\nLeads ONLY in IST: ${onlyIST.length}`);
    onlyIST.forEach(l => {
      const val = l.fields?.lead_date || l.fields?.created_on;
      console.log(`ID: ${l.id} | Name: ${l.fields?.name} | Date: ${new Date(val).toLocaleString('en-IN')}`);
    });

    console.log(`\nLeads ONLY in UTC: ${onlyUTC.length}`);
    onlyUTC.forEach(l => {
      const val = l.fields?.lead_date || l.fields?.created_on;
      console.log(`ID: ${l.id} | Name: ${l.fields?.name} | Date: ${new Date(val).toLocaleString('en-IN')}`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
