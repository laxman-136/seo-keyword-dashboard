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

    // Search range: June 1st to June 24th, 2026
    const fromMs = new Date('2026-06-01T00:00:00.000+05:30').getTime();
    const toMs = new Date('2026-06-24T23:59:59.999+05:30').getTime();

    console.log(`Searching for leads with course_enrollment_date in June 2026...`);
    const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=100&skip=0`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          status: 'Enrolled',
          course_enrollment_date: { from: fromMs, to: toMs }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Search failed: HTTP ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    console.log(`Found ${data.total_count} leads with course_enrollment_date in June 2026.`);
    if (data.data.length > 0) {
      console.log(`First lead found: ${data.data[0].fields?.name}, enrollment date: ${data.data[0].fields?.course_enrollment_date}`);
    }

  } catch (err) {
    console.error('Error during search test:', err);
  }
}

run();
