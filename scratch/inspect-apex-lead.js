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
      console.log('No active configuration found');
      return;
    }
    const token = config.telecrm_api_token || envVars.TELECRM_API_TOKEN;
    const enterpriseId = config.telecrm_enterprise_id || envVars.TELECRM_ENTERPRISE_ID;

    // Search for leads containing "Apex" in course field or name "Anand Vadapalli"
    const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=50&skip=0`;
    
    // Fetch all leads of all time to find any matches
    const body = { fields: {} };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      console.log('Failed to fetch:', res.status, res.statusText);
      return;
    }

    const result = await res.json();
    const leads = result.data || [];
    
    console.log('Searching through database for Apex leads...');
    let found = false;

    // Since we want to search all leads if needed, we paginate
    let skip = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const pageUrl = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=${limit}&skip=${skip}`;
      const pageRes = await fetch(pageUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!pageRes.ok) break;
      const pageResult = await pageRes.json();
      const chunk = pageResult.data || [];
      if (chunk.length === 0) break;

      chunk.forEach(lead => {
        const f = lead.fields || {};
        const courseStr = String(f.course || '').toLowerCase();
        const nameStr = String(f.name || '').toLowerCase();

        if (courseStr.includes('apex') || nameStr.includes('vadapalli')) {
          found = true;
          console.log('\n======================================');
          console.log('        MATCHING APEX LEAD FOUND      ');
          console.log('======================================');
          console.log(`Lead ID: ${lead.id}`);
          console.log(`Status: ${lead.status || f.status}`);
          console.log(`Fields:`, JSON.stringify(f, null, 2));
        }
      });

      skip += limit;
      if (chunk.length < limit || skip >= 4000) {
        hasMore = false;
      }
    }

    if (!found) {
      console.log('No matching Apex leads found.');
    }

  } catch (err) {
    console.error(err);
  }
}

run();
