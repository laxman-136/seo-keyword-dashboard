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

    const fromDate = new Date('2026-06-01T00:00:00.000+05:30');
    const toDate = new Date('2026-06-23T23:59:59.999+05:30');
    const fromMs = fromDate.getTime();
    const toMs = toDate.getTime();

    // 1. Fetch Enrolled by created_on in June
    let createdOnEnrolled = [];
    let skip = 0;
    while (true) {
      const res = await testSearch({ status: 'Enrolled', created_on: { from: fromMs, to: toMs } }, 100, skip);
      createdOnEnrolled.push(...res.data);
      if (res.data.length < 100 || createdOnEnrolled.length >= res.total_count) break;
      skip += 100;
    }

    console.log(`Leads with Status='Enrolled' and Created On in June (Count: ${createdOnEnrolled.length}):`);
    createdOnEnrolled.forEach((l, idx) => {
      console.log(`${idx+1}. Name: ${l.fields?.name}, lead_date=${l.fields?.lead_date ? new Date(l.fields.lead_date).toLocaleDateString() : 'MISSING'}, created_on=${new Date(l.fields.created_on).toLocaleDateString()}`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
