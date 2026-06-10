const fs = require('fs');
const path = require('path');

// Load env variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      // Remove quotes
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[key] = value;
    }
  });
}

const supabaseUrl = env['SUPABASE_URL'] || process.env.SUPABASE_URL;
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['SUPABASE_ANON_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let token = env['TELECRM_API_TOKEN'] || process.env.TELECRM_API_TOKEN;
let enterpriseId = env['TELECRM_ENTERPRISE_ID'] || process.env.TELECRM_ENTERPRISE_ID;

async function run() {
  try {
    // If credentials are not in env/env.local, load from Supabase configurations table
    if (supabaseUrl && supabaseKey && (!token || !enterpriseId)) {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('configurations')
        .select('*')
        .eq('is_active', true)
        .limit(1);

      if (data && data[0]) {
        token = data[0].telecrm_api_token || token;
        enterpriseId = data[0].telecrm_enterprise_id || enterpriseId;
        console.log(`Loaded credentials from active Supabase config "${data[0].label}"`);
      } else if (error) {
        console.error('Failed to query Supabase configurations:', error);
      }
    }

    if (!token || !enterpriseId) {
      console.error('Error: TeleCRM API Token or Enterprise ID not found in environment or active database configuration.');
      process.exit(1);
    }

    console.log(`Querying TeleCRM Search API in pages of 100 for enterprise ${enterpriseId}...`);
    
    const leads = [];
    let skip = 0;
    const limit = 100;
    const maxLeads = 1000; // scan up to 1000 recent leads

    while (skip < maxLeads) {
      const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=${limit}&skip=${skip}`;
      const body = { fields: {} };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        console.error(`TeleCRM API Error at skip ${skip}: Status ${response.status} - ${response.statusText}`);
        const text = await response.text();
        console.error(text);
        break;
      }

      const resJson = await response.json();
      const pageData = resJson.data || [];
      leads.push(...pageData);
      
      console.log(`Fetched page at skip ${skip}: ${pageData.length} leads.`);
      
      if (pageData.length < limit || leads.length >= (resJson.total_count || Infinity)) {
        break;
      }
      skip += limit;
    }

    console.log(`Finished fetching. Total leads scanned: ${leads.length}`);

    const sourceCounts = {};
    leads.forEach(l => {
      const source = l.fields?.lead_source_1 || '(no source)';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    console.log('\n---RESULT_START---');
    console.log('| TeleCRM Lead Source Label | Count |');
    console.log('| :--- | :--- |');
    Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([source, count]) => {
        console.log(`| ${source} | ${count} |`);
      });
    console.log('---RESULT_END---');

  } catch (err) {
    console.error('Error running script:', err);
    process.exit(1);
  }
}

run();
