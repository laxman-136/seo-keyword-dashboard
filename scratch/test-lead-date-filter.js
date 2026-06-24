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

    const testSearch = async (filters) => {
      const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=10&skip=0`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: filters })
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
      }
      return response.json();
    };

    const toMs = Date.now();
    const fromMs = toMs - 15 * 24 * 60 * 60 * 1000; // last 15 days

    console.log(`--- Testing created_on filter ---`);
    try {
      const resCreated = await testSearch({ created_on: { from: fromMs, to: toMs } });
      console.log(`Success! Total count by created_on: ${resCreated.total_count}`);
      if (resCreated.data && resCreated.data.length > 0) {
        console.log(`First lead: id=${resCreated.data[0].id}, created_on=${resCreated.data[0].fields?.created_on}, lead_date=${resCreated.data[0].fields?.lead_date}`);
      }
    } catch (e) {
      console.log(`Failed to search by created_on:`, e.message);
    }

    console.log(`\n--- Testing lead_date filter ---`);
    try {
      const resLeadDate = await testSearch({ lead_date: { from: fromMs, to: toMs } });
      console.log(`Success! Total count by lead_date: ${resLeadDate.total_count}`);
      if (resLeadDate.data && resLeadDate.data.length > 0) {
        console.log(`First lead: id=${resLeadDate.data[0].id}, created_on=${resLeadDate.data[0].fields?.created_on}, lead_date=${resLeadDate.data[0].fields?.lead_date}`);
      }
    } catch (e) {
      console.log(`Failed to search by lead_date:`, e.message);
    }

  } catch (err) {
    console.error(err);
  }
}

run();
