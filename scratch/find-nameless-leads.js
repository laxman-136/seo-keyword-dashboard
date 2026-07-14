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

    let skip = 0;
    const limit = 100;
    let hasMore = true;
    const namelessLeads = [];

    console.log('Scanning all leads in TeleCRM database for nameless leads...');

    while (hasMore) {
      const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=${limit}&skip=${skip}`;
      const body = { fields: {} }; // Match all leads

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
        break;
      }

      const result = await res.json();
      const chunk = result.data || [];
      if (chunk.length === 0) break;

      chunk.forEach(lead => {
        const f = lead.fields || {};
        const nameVal = f.name;

        // Check if name is nameless
        const isNameless = (
          !nameVal || 
          nameVal.trim() === '' || 
          nameVal.trim().toLowerCase() === 'n/a' || 
          nameVal.trim().toLowerCase() === 'no name' ||
          nameVal.trim().toLowerCase() === 'unknown'
        );

        if (isNameless) {
          namelessLeads.push({
            id: lead.id,
            status: lead.status || f.status,
            phone: f.phone,
            email: f.email,
            created_on: f.created_on,
            lead_source_1: f.lead_source_1,
            course: f.course,
            remarks: f.remarks,
            fields: f
          });
        }
      });

      skip += limit;
      // Stop after 3,500 leads to avoid timeouts
      if (chunk.length < limit || skip >= 3500) {
        hasMore = false;
      }
    }

    console.log(`\nScan complete. Found ${namelessLeads.length} nameless leads.`);

    namelessLeads.forEach((l, idx) => {
      console.log(`\n[${idx + 1}] Lead ID: ${l.id} | Status: ${l.status}`);
      console.log(`    Phone: ${l.phone || 'N/A'} | Email: ${l.email || 'N/A'}`);
      console.log(`    Created: ${l.created_on ? new Date(l.created_on).toLocaleDateString() : 'N/A'}`);
      console.log(`    Source: ${l.lead_source_1 || 'N/A'} | Course: ${l.course || 'N/A'}`);
      console.log(`    Remarks: ${l.remarks || 'N/A'}`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
