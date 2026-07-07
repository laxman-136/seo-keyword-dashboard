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

// Text payment parser
function parseAmount(val) {
  if (!val) return 0;
  const cleaned = String(val).replace(/,/g, '').trim();
  const match = cleaned.match(/\d+/);
  if (!match) return 0;
  let num = parseInt(match[0], 10);
  if (num < 150) {
    num = num * 1000;
  }
  return num;
}

async function run() {
  try {
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

    const courseGroups = {};

    enrolledLeads.forEach(lead => {
      const fields = lead.fields || {};
      const enrollDateVal = fields.course_enrollment_date;
      if (enrollDateVal && enrollDateVal >= fromTime && enrollDateVal <= toTime) {
        let course = fields.course || 'Other/Unspecified';
        course = course.trim();

        const name = fields.name || 'N/A';
        const email = fields.email || 'N/A';
        const phone = fields.phone || 'N/A';
        const source = fields.lead_source_1 || fields.utmsource || 'Other';
        
        const emi1 = parseAmount(fields.amount_paid);
        const emi2 = parseAmount(fields.amount_paid_emi_2);
        const cash = emi1 + emi2;
        const contract = parseAmount(fields.course_fee);

        if (!courseGroups[course]) {
          courseGroups[course] = [];
        }

        courseGroups[course].push({
          name,
          email,
          phone,
          enrollDate: new Date(enrollDateVal).toLocaleDateString('en-IN'),
          source,
          contract,
          cash,
          emi1,
          emi2
        });
      }
    });

    // Generate Markdown report
    let md = `# June 2026 Lead Roster Grouped by Course\n\n`;
    md += `This report categorizes all **${enrolledLeads.length}** enrolled leads into course groups.\n\n`;

    // Sort courses by size descending
    const sortedCourses = Object.entries(courseGroups).sort((a, b) => b[1].length - a[1].length);

    sortedCourses.forEach(([course, leads]) => {
      md += `## 📘 ${course} (${leads.length} Students)\n\n`;
      md += `| No. | Student Name | Enrollment Date | Lead Source (Channel) | Fee | Cash Paid (EMI 1 + EMI 2) | Email | Phone |\n`;
      md += `| --- | --- | --- | --- | --- | --- | --- | --- |\n`;

      leads.forEach((l, idx) => {
        md += `| ${idx + 1} | ${l.name} | ${l.enrollDate} | ${l.source} | ₹${l.contract.toLocaleString('en-IN')} | ₹${l.cash.toLocaleString('en-IN')} (₹${l.emi1} + ₹${l.emi2}) | ${l.email} | ${l.phone} |\n`;
      });
      md += `\n---\n\n`;
    });

    const reportPath = 'C:\\Users\\Veera/.gemini/antigravity/brain/f58a670f-73e6-4823-95d3-c88d333753ea/june_leads_by_course.md';
    fs.writeFileSync(reportPath, md, 'utf8');
    console.log(`Generated course-wise leads report at ${reportPath}`);

  } catch (err) {
    console.error(err);
  }
}

run();
