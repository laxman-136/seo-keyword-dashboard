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
      console.log('No active configuration found in database.');
      return;
    }
    const token = config.telecrm_api_token;
    const enterpriseId = config.telecrm_enterprise_id;

    console.log(`Enterprise ID: ${enterpriseId}`);

    const searchLeads = async (filters, limit = 5, skip = 0) => {
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
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      return response.json();
    };

    const fetchTimeline = async (leadId) => {
      const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/${leadId}/timeline`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Timeline HTTP error ${response.status}`);
      }
      return response.json();
    };

    console.log('Searching for Enrolled leads...');
    const enrolledRes = await searchLeads({ status: 'Enrolled' }, 10, 0);
    console.log(`Found ${enrolledRes.total_count} enrolled leads in total. Displaying first few:`);

    if (enrolledRes.data.length === 0) {
      console.log('No enrolled leads found.');
      return;
    }

    const firstLead = enrolledRes.data[0];
    console.log('\n--- FIRST LEAD FULL JSON ---');
    console.log(JSON.stringify(firstLead, null, 2));

    console.log('\nFetching timeline for the first 3 enrolled leads...');
    for (let i = 0; i < Math.min(3, enrolledRes.data.length); i++) {
      const lead = enrolledRes.data[i];
      console.log(`\nTimeline for ${lead.fields?.name || 'Unnamed'} (ID: ${lead.id}):`);
      try {
        const timeline = await fetchTimeline(lead.id);
        console.log(JSON.stringify(timeline, null, 2));
      } catch (err) {
        console.error(`Error fetching timeline for ${lead.id}:`, err.message);
      }
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
