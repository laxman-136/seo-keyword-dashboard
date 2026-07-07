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

async function checkLead(email) {
  const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
  const token = config.telecrm_api_token;
  const enterpriseId = config.telecrm_enterprise_id;

  // Add random query param to bust cache
  const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?cb=${Date.now()}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    body: JSON.stringify({ fields: { email } })
  });
  const res = await response.json();
  return res.data && res.data[0] ? res.data[0] : null;
}

async function run() {
  try {
    const targets = [
      'mrigank120488@gmail.com',
      'vaishnavichaudhari.865@gmail.com',
      'ajeeshca88@gmail.com'
    ];

    for (const email of targets) {
      const lead = await checkLead(email);
      console.log(`\nEmail: ${email}`);
      if (lead) {
        console.log(`- Name: ${lead.fields.name}`);
        console.log(`- Status: ${lead.status}`);
        console.log(`- Course Enrollment Date: ${lead.fields.course_enrollment_date ? new Date(lead.fields.course_enrollment_date).toLocaleDateString('en-IN') : 'N/A'}`);
      } else {
        console.log('- Lead not found at all.');
      }
    }
  } catch (err) {
    console.error(err);
  }
}

run();
