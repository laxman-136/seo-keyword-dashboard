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

    // Search last 1000 modified leads of all time
    let allKeys = new Set();
    let skip = 0;
    const limit = 100;
    const totalToFetch = 1000;
    let leadsWithCourse2 = [];

    console.log('Scanning recent 1000 modified leads of all time for Course 2 fields...');

    while (skip < totalToFetch) {
      const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=${limit}&skip=${skip}`;
      // Query body: empty filters to match all leads, sorted by modification
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
        break;
      }

      const result = await res.json();
      const chunk = result.data || [];
      if (chunk.length === 0) break;

      chunk.forEach(lead => {
        const f = lead.fields || {};
        Object.keys(f).forEach(k => {
          allKeys.add(k);
          
          // Check if key contains 'course' and '2', or 'name2', or 'emi1course2'
          const lowerK = k.toLowerCase();
          if (lowerK.includes('course_2') || lowerK.includes('course2') || lowerK.includes('name_2') || lowerK.includes('name2')) {
            if (f[k] && f[k] !== 'N/A' && f[k] !== '') {
              leadsWithCourse2.push({
                leadName: f.name,
                phone: f.phone,
                fieldKey: k,
                fieldVal: f[k],
                allFields: f
              });
            }
          }
        });
      });

      skip += limit;
      if (chunk.length < limit) break;
    }

    console.log('\n--- SCAN RESULTS ---');
    console.log(`Total unique field keys found: ${allKeys.size}`);
    console.log('All keys starting with "course" or containing "2" or "emi":');
    console.log(Array.from(allKeys).filter(k => {
      const l = k.toLowerCase();
      return l.includes('course') || l.includes('2') || l.includes('emi');
    }).sort());

    console.log(`\nLeads with populated Course 2 fields: ${leadsWithCourse2.length}`);
    leadsWithCourse2.forEach((l, i) => {
      console.log(`\n[${i+1}] Student: ${l.leadName} | Phone: ${l.phone}`);
      console.log(`    Key: ${l.fieldKey} = ${l.fieldVal}`);
      console.log(`    All fields:`, JSON.stringify(l.allFields, null, 2));
    });

  } catch (err) {
    console.error(err);
  }
}

run();
