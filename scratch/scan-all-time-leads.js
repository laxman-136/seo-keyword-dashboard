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
    let matchCount = 0;
    const matchedLeads = [];

    console.log('Starting full database scan of TeleCRM leads...');

    while (hasMore) {
      const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=${limit}&skip=${skip}`;
      const body = { fields: {} }; // no filters to match all leads

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
        const keys = Object.keys(f);
        
        let hasCourse2Val = false;
        const matchedFields = {};

        keys.forEach(k => {
          const lowerK = k.toLowerCase();
          // We look for any keys containing "course" and "2", or "name_2", or "name2", or "course_name2"
          // Or keys containing "fee" and "2"
          // Or keys containing "emi" and "course" and "2"
          const isCourse2Field = (
            lowerK.includes('course2') ||
            lowerK.includes('course_2') ||
            lowerK.includes('course_name2') ||
            lowerK.includes('course_name_2') ||
            lowerK.includes('coursename2') ||
            lowerK.includes('name_2') ||
            lowerK.includes('name2') ||
            (lowerK.includes('fee') && lowerK.includes('2')) ||
            (lowerK.includes('emi') && lowerK.includes('course_2')) ||
            (lowerK.includes('emi') && lowerK.includes('course2'))
          );

          if (isCourse2Field) {
            matchedFields[k] = f[k];
            if (f[k] && f[k] !== 'N/A' && f[k] !== '') {
              hasCourse2Val = true;
            }
          }
        });

        if (hasCourse2Val) {
          matchCount++;
          matchedLeads.push({
            name: f.name,
            phone: f.phone,
            fields: matchedFields,
            created_on: f.created_on,
            modified_on: f.modified_on,
            lead: lead
          });
        }
      });

      console.log(`Scanned ${skip + chunk.length} leads... found ${matchCount} matches.`);
      skip += limit;
      
      // Safety limit: stop after 3000 leads to avoid rate limit or timeout
      if (chunk.length < limit || skip >= 3000) {
        hasMore = false;
      }
    }

    console.log('\n--- SCAN COMPLETE ---');
    console.log(`Total leads with populated Course 2 fields: ${matchedLeads.length}`);
    
    matchedLeads.forEach((m, idx) => {
      console.log(`\n[${idx + 1}] Lead: ${m.name} | Phone: ${m.phone}`);
      console.log(`    Created: ${new Date(m.created_on).toLocaleDateString()} | Modified: ${new Date(m.modified_on).toLocaleDateString()}`);
      console.log(`    Course 2 Fields:`, JSON.stringify(m.fields, null, 2));
    });

  } catch (err) {
    console.error('Error during scan:', err);
  }
}

run();
