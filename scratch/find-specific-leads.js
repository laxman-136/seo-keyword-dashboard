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

    // Let's fetch the last 30 days of leads using created_on
    const toMs = Date.now();
    const fromMs = toMs - 30 * 24 * 60 * 60 * 1000;
    
    const targetNames = [
      'vijaya kumar badipatla',
      'chavali sai sindhu',
      'bhavitha reddy',
      'thimma reddy k'
    ];

    console.log('Searching for leads in TeleCRM...');
    
    let leads = [];
    let skip = 0;
    while (true) {
      const res = await testSearch({ created_on: { from: fromMs, to: toMs } }, 100, skip);
      leads.push(...res.data);
      if (res.data.length < 100 || leads.length >= res.total_count) break;
      skip += 100;
    }

    console.log(`Fetched ${leads.length} leads in created_on range. Filtering matching names...`);

    const matched = leads.filter(l => {
      const name = (l.fields?.name || '').toLowerCase().trim();
      return targetNames.some(t => name.includes(t) || t.includes(name));
    });

    console.log(`\nFound ${matched.length} matching leads:\n`);
    matched.forEach((l, idx) => {
      console.log(`--- Match ${idx+1} ---`);
      console.log(`ID: ${l.id}`);
      console.log(`Name: ${l.fields?.name}`);
      console.log(`Phone: ${l.fields?.phone}`);
      console.log(`Email: ${l.fields?.email}`);
      console.log(`Status: ${l.status}`);
      console.log(`Course: ${l.fields?.course}`);
      console.log(`Source: ${l.fields?.lead_source_1}`);
      console.log(`Created On: ${l.fields?.created_on ? new Date(l.fields.created_on).toISOString() : 'N/A'}`);
      console.log(`Lead Date: ${l.fields?.lead_date ? new Date(l.fields.lead_date).toISOString() : 'N/A'}`);
      console.log(`Raw Fields:`, JSON.stringify(l.fields, null, 2));
      console.log();
    });

  } catch (err) {
    console.error(err);
  }
}

run();
