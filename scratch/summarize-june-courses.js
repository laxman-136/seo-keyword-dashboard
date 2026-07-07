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

    const courseStats = {};

    enrolledLeads.forEach(lead => {
      const fields = lead.fields || {};
      const enrollDateVal = fields.course_enrollment_date;
      if (enrollDateVal && enrollDateVal >= fromTime && enrollDateVal <= toTime) {
        let course = fields.course || 'Other/Unspecified';
        course = course.trim();
        
        const emi1 = parseAmount(fields.amount_paid);
        const emi2 = parseAmount(fields.amount_paid_emi_2);
        const cash = emi1 + emi2;
        const contract = parseAmount(fields.course_fee);

        if (!courseStats[course]) {
          courseStats[course] = { count: 0, cash: 0, contract: 0 };
        }
        courseStats[course].count++;
        courseStats[course].cash += cash;
        courseStats[course].contract += contract;
      }
    });

    console.log(`Course Breakdown for June 2026:`);
    console.log(`================================`);
    console.log(JSON.stringify(courseStats, null, 2));

    // Save report to file
    let md = `# June 2026 Course-wise Performance Report\n\n`;
    md += `| Course Name | Enrolled Count | Cash Collected | Contract Value |\n`;
    md += `| --- | --- | --- | --- |\n`;
    Object.entries(courseStats).sort((a,b) => b[1].count - a[1].count).forEach(([course, data]) => {
      md += `| ${course} | ${data.count} | ₹${data.cash.toLocaleString('en-IN')} | ₹${data.contract.toLocaleString('en-IN')} |\n`;
    });

    const reportPath = 'C:\\Users\\Veera/.gemini/antigravity/brain/f58a670f-73e6-4823-95d3-c88d333753ea/june_course_report.md';
    fs.writeFileSync(reportPath, md, 'utf8');
    console.log(`Generated report at ${reportPath}`);

  } catch (err) {
    console.error(err);
  }
}

run();
