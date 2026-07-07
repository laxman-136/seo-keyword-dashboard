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

// June 2026 bounds
const fromTime = new Date('2026-06-01T00:00:00.000+05:30').getTime();
const toTime = new Date('2026-06-30T23:59:59.999+05:30').getTime();

// Helper to sanitize emails for comparison
function cleanEmail(e) {
  if (!e) return '';
  return e.trim().toLowerCase();
}

async function run() {
  try {
    // 1. Read the saved 78 leads from june_enrollment_data.md
    const savedPath = 'C:\\Users\\Veera/.gemini/antigravity/brain/f58a670f-73e6-4823-95d3-c88d333753ea/june_enrollment_data.md';
    const savedContent = fs.readFileSync(savedPath, 'utf8');
    const savedEmails = new Set();
    const savedPhones = new Set();

    savedContent.split('\n').forEach(line => {
      if (line.startsWith('|') && !line.includes('Student Name') && !line.includes('---')) {
        const parts = line.split('|');
        if (parts.length >= 9) {
          const email = parts[8].trim().toLowerCase();
          const phone = parts[9].trim().replace(/[^0-9]/g, '');
          if (email && email !== 'n/a') savedEmails.add(email);
          if (phone) savedPhones.add(phone.substring(Math.max(0, phone.length - 10)));
        }
      }
    });

    console.log(`Loaded ${savedEmails.size} emails and ${savedPhones.size} phones from saved report.`);

    // 2. Fetch June 2026 Enrolled Leads from TeleCRM API
    const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
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
      return response.json();
    };

    let enrolledLeads = [];
    for (let skip = 0; skip < 1000; skip += 100) {
      const res = await testSearch({ status: 'Enrolled' }, 100, skip);
      if (res.data && res.data.length > 0) {
        enrolledLeads.push(...res.data);
        if (res.data.length < 100) break;
      } else {
        break;
      }
    }

    const juneLeads = [];
    enrolledLeads.forEach(lead => {
      const fields = lead.fields || {};
      const enrollDateVal = fields.course_enrollment_date;
      if (enrollDateVal && enrollDateVal >= fromTime && enrollDateVal <= toTime) {
        juneLeads.push(lead);
      }
    });

    console.log(`Current June Leads in TeleCRM: ${juneLeads.length}`);

    // 3. Find which of the current 81 leads were NOT in the saved 78 leads
    console.log('\n--- Leads currently in TeleCRM but NOT in the first report of 78 ---');
    let diffCount = 0;
    juneLeads.forEach(l => {
      const fields = l.fields || {};
      const email = cleanEmail(fields.email);
      const phoneDigits = fields.phone ? fields.phone.replace(/[^0-9]/g, '') : '';
      const phone10 = phoneDigits.substring(Math.max(0, phoneDigits.length - 10));

      const hasEmail = email && savedEmails.has(email);
      const hasPhone = phone10 && savedPhones.has(phone10);

      if (!hasEmail && !hasPhone) {
        diffCount++;
        console.log(`[${diffCount}] Name: ${fields.name} | Email: ${fields.email} | Phone: ${fields.phone} | Date: ${new Date(fields.course_enrollment_date).toLocaleDateString('en-IN')}`);
      }
    });

  } catch (err) {
    console.error(err);
  }
}

run();
