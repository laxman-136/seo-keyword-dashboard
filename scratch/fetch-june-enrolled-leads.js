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

// June 2026 local time bounds
const fromTime = new Date('2026-06-01T00:00:00.000+05:30').getTime();
const toTime = new Date('2026-06-30T23:59:59.999+05:30').getTime();

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

    const juneEnrolled = [];
    enrolledLeads.forEach(lead => {
      const fields = lead.fields || {};
      const enrollDateVal = fields.course_enrollment_date;
      if (enrollDateVal && enrollDateVal >= fromTime && enrollDateVal <= toTime) {
        juneEnrolled.push(lead);
      }
    });

    // Generate Markdown table
    let md = `# June 2026 Enrolled Leads Audit\n\n`;
    md += `Total Enrolled Leads: **${juneEnrolled.length}**\n\n`;
    md += `| No. | Student Name | Enrollment Date | Course | Lead Source (Channel) | Course Fee | Amount Paid | Email | Phone |\n`;
    md += `| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;

    juneEnrolled.forEach((l, idx) => {
      const fields = l.fields || {};
      const enrollDate = new Date(fields.course_enrollment_date).toLocaleDateString('en-IN');
      const name = fields.name || 'N/A';
      const course = fields.course || 'N/A';
      const source = fields.lead_source_1 || fields.utmsource || 'Other';
      const fee = fields.course_fee || 'N/A';
      const paid = fields.amount_paid || 'N/A';
      const email = fields.email || 'N/A';
      const phone = fields.phone || 'N/A';

      md += `| ${idx + 1} | ${name} | ${enrollDate} | ${course} | ${source} | ${fee} | ${paid} | ${email} | ${phone} |\n`;
    });

    const artifactPath = 'C:\\Users\\Veera/.gemini/antigravity/brain/f58a670f-73e6-4823-95d3-c88d333753ea/june_enrollment_data.md';
    fs.writeFileSync(artifactPath, md, 'utf8');
    console.log(`Successfully wrote ${juneEnrolled.length} leads to ${artifactPath}`);

  } catch (err) {
    console.error(err);
  }
}

run();
