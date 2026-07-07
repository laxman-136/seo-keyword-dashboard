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

const fromTime = new Date('2026-06-01T00:00:00.000+05:30').getTime();
const toTime = new Date('2026-06-30T23:59:59.999+05:30').getTime();

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

    const scmLeads = [];
    const nonScmLeads = [];

    enrolledLeads.forEach(lead => {
      const fields = lead.fields || {};
      const enrollDateVal = fields.course_enrollment_date;
      if (enrollDateVal && enrollDateVal >= fromTime && enrollDateVal <= toTime) {
        const course = fields.course || '';
        if (course.toLowerCase().includes('scm')) {
          scmLeads.push(lead);
        } else {
          nonScmLeads.push(lead);
        }
      }
    });

    console.log(`SCM Leads Count: ${scmLeads.length}`);
    console.log(`Non-SCM Leads Count: ${nonScmLeads.length}`);
    console.log(`Total June Enrolled: ${scmLeads.length + nonScmLeads.length}`);

    console.log('\nList of SCM leads currently enrolled in June:');
    scmLeads.forEach((l, idx) => {
      const fields = l.fields || {};
      console.log(`[${idx+1}] Name: ${fields.name} | Email: ${fields.email} | Course: ${fields.course} | Date: ${new Date(fields.course_enrollment_date).toLocaleDateString('en-IN')}`);
    });

    console.log('\nList of Non-SCM leads currently enrolled in June:');
    nonScmLeads.forEach((l, idx) => {
      const fields = l.fields || {};
      console.log(`[${idx+1}] Name: ${fields.name} | Email: ${fields.email} | Course: ${fields.course} | Date: ${new Date(fields.course_enrollment_date).toLocaleDateString('en-IN')}`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
