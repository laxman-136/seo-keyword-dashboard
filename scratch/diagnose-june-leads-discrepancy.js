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

    // June 1st to June 30th, 2026 in IST (+5:30)
    const fromDate = new Date('2026-06-01T00:00:00.000+05:30');
    const toDate = new Date('2026-06-30T23:59:59.999+05:30');
    const fromMs = fromDate.getTime();
    const toMs = toDate.getTime();

    // 1. Fetch leads by lead_date in June 2026
    let leadDateLeads = [];
    let skip = 0;
    while (true) {
      const res = await testSearch({ lead_date: { from: fromMs, to: toMs } }, 100, skip);
      leadDateLeads.push(...res.data);
      if (res.data.length < 100 || leadDateLeads.length >= res.total_count) break;
      skip += 100;
    }

    // 2. Fetch leads by created_on in June 2026
    let createdOnLeads = [];
    skip = 0;
    while (true) {
      const res = await testSearch({ created_on: { from: fromMs, to: toMs } }, 100, skip);
      createdOnLeads.push(...res.data);
      if (res.data.length < 100 || createdOnLeads.length >= res.total_count) break;
      skip += 100;
    }

    // 3. Fetch enrolled leads with course_enrollment_date in June 2026
    let enrolledLeads = [];
    skip = 0;
    while (true) {
      const res = await testSearch({ course_enrollment_date: { from: fromMs, to: toMs }, status: 'Enrolled' }, 100, skip);
      enrolledLeads.push(...res.data);
      if (res.data.length < 100 || enrolledLeads.length >= res.total_count) break;
      skip += 100;
    }

    console.log(`Leads by lead_date filter count (TeleCRM standard search): ${leadDateLeads.length}`);
    console.log(`Leads by created_on filter count: ${createdOnLeads.length}`);
    console.log(`Leads by course_enrollment_date in June (Enrolled): ${enrolledLeads.length}`);

    // Let's mimic the dashboard's merging and filtering logic
    const mergedMap = new Map();
    leadDateLeads.forEach(l => mergedMap.set(l.id, l));
    createdOnLeads.forEach(l => mergedMap.set(l.id, l));
    enrolledLeads.forEach(l => mergedMap.set(l.id, l));

    const totalMerged = Array.from(mergedMap.values());
    console.log(`Total unique merged leads: ${totalMerged.length}`);

    // Now apply dashboard filter:
    const dashboardFiltered = totalMerged.filter(lead => {
      const leadDateVal = lead.fields?.lead_date || lead.fields?.created_on;
      const isLeadInPeriod = !!(leadDateVal && dateValIsInPeriod(leadDateVal, fromMs, toMs));
      
      const isEnrolled = lead.status === 'Enrolled';
      const enrollDateVal = lead.fields?.course_enrollment_date;
      const isEnrolledInPeriod = !!(isEnrolled && enrollDateVal && dateValIsInPeriod(enrollDateVal, fromMs, toMs));
      
      return isLeadInPeriod || isEnrolledInPeriod;
    });

    function dateValIsInPeriod(val, from, to) {
      const t = typeof val === 'number' ? val : new Date(val).getTime();
      return t >= from && t <= to;
    }

    console.log(`Total Dashboard filtered leads: ${dashboardFiltered.length}`);

    // Now find the leads that are in Dashboard but NOT in standard lead_date TeleCRM query
    const standardIds = new Set(leadDateLeads.map(l => l.id));
    const extraLeads = dashboardFiltered.filter(l => !standardIds.has(l.id));

    console.log(`\nDiscrepancy count: ${extraLeads.length}`);
    console.log('\n--- Details of Extra Leads Included in Dashboard ---');
    extraLeads.forEach((l, idx) => {
      const leadDate = l.fields?.lead_date ? new Date(l.fields.lead_date).toLocaleDateString() : 'N/A';
      const createdOn = l.fields?.created_on ? new Date(l.fields.created_on).toLocaleDateString() : 'N/A';
      const enrollDate = l.fields?.course_enrollment_date ? new Date(l.fields.course_enrollment_date).toLocaleDateString() : 'N/A';
      console.log(`${idx + 1}. ID: ${l.id} | Name: ${l.fields?.name} | Status: ${l.status} | Lead Date: ${leadDate} | Created On: ${createdOn} | Enroll Date: ${enrollDate}`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
