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

function formatDate(timestamp) {
  if (!timestamp) return '';
  // Check if timestamp is in seconds or milliseconds
  let ms = Number(timestamp);
  if (isNaN(ms) || ms <= 0) return '';
  if (ms < 10000000000) {
    // probably in seconds, convert to ms
    ms = ms * 1000;
  }
  const date = new Date(ms);
  // Return formatted as YYYY-MM-DD HH:mm:ss in IST (UTC+5:30)
  // Let's use simple UTC to IST offset formatting
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  const iso = istDate.toISOString(); // 'YYYY-MM-DDTHH:mm:ss.sssZ'
  return iso.replace('T', ' ').substring(0, 19);
}

async function run() {
  try {
    const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
    if (!config) {
      console.log('No active configuration found in database.');
      return;
    }
    const token = config.telecrm_api_token;
    const enterpriseId = config.telecrm_enterprise_id;

    console.log(`Using active Enterprise ID: ${enterpriseId}`);

    const searchLeads = async (filters, limit = 100, skip = 0) => {
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

    console.log('Fetching ALL enrolled leads from TeleCRM...');
    let allEnrolled = [];
    let skip = 0;
    const limit = 100;
    while (true) {
      console.log(`Fetching leads skip=${skip}, limit=${limit}...`);
      const res = await searchLeads({ status: 'Enrolled' }, limit, skip);
      if (!res.data || res.data.length === 0) break;
      allEnrolled.push(...res.data);
      console.log(`Fetched ${allEnrolled.length} / ${res.total_count} leads`);
      if (res.data.length < limit || allEnrolled.length >= res.total_count) break;
      skip += limit;
    }

    console.log(`\nSuccessfully fetched ${allEnrolled.length} enrolled leads.`);

    // Analyze fields and generate rows
    const rows = [];
    let hasEnrollmentDateFieldCount = 0;
    let hasStatusChangeTimestampCount = 0;
    let fallbackCount = 0;

    for (const lead of allEnrolled) {
      const fields = lead.fields || {};
      const name = fields.name || 'Unnamed';
      const phone = fields.phone || '';
      const email = fields.email || '';
      const course = fields.course || '';
      const createdOnVal = fields.created_on;
      const leadDateVal = fields.lead_date;
      const modifiedOnVal = fields.modified_on;

      // Check course_enrollment_date field (could be in fields.course_enrollment_date or similar)
      // Note: TeleCRM fields are sometimes custom fields with lowercase names.
      // Let's inspect fields for any key containing "enrollment" or "enroll" or "date" just in case.
      let courseEnrollmentDateVal = fields.course_enrollment_date;
      
      // Let's also check if there is an alternative spelling in fields
      if (courseEnrollmentDateVal === undefined || courseEnrollmentDateVal === null) {
        for (const [k, v] of Object.entries(fields)) {
          if (k.toLowerCase().includes('enrollment') || k.toLowerCase().includes('enrolled')) {
            if (v && !isNaN(Number(v))) {
              courseEnrollmentDateVal = v;
              break;
            }
          }
        }
      }

      // Check statusChangeTimestamp in leadMetaData
      const statusChangeVal = lead.leadMetaData?.statusChangeTimestamp;

      // Determine final enrollment date and source
      let finalEnrollmentDateRaw = null;
      let dateSource = '';

      if (courseEnrollmentDateVal !== undefined && courseEnrollmentDateVal !== null && courseEnrollmentDateVal !== '') {
        finalEnrollmentDateRaw = courseEnrollmentDateVal;
        dateSource = 'course_enrollment_date_field';
        hasEnrollmentDateFieldCount++;
      } else if (statusChangeVal !== undefined && statusChangeVal !== null && statusChangeVal !== '') {
        finalEnrollmentDateRaw = statusChangeVal;
        dateSource = 'status_change_history';
        hasStatusChangeTimestampCount++;
      } else {
        // Fallback to modified_on or created_on
        finalEnrollmentDateRaw = modifiedOnVal || createdOnVal || null;
        dateSource = modifiedOnVal ? 'fallback_modified_on' : (createdOnVal ? 'fallback_created_on' : 'unknown');
        fallbackCount++;
      }

      rows.push({
        id: lead.id,
        name,
        phone,
        email,
        course,
        created_on: formatDate(createdOnVal),
        lead_date: formatDate(leadDateVal),
        course_enrollment_date_field: courseEnrollmentDateVal ? formatDate(courseEnrollmentDateVal) : 'Not Updated',
        status_change_timestamp: statusChangeVal ? formatDate(statusChangeVal) : 'Not Available',
        final_enrollment_date: formatDate(finalEnrollmentDateRaw),
        enrollment_date_source: dateSource
      });
    }

    // Sort rows by final enrollment date descending
    rows.sort((a, b) => {
      if (!a.final_enrollment_date) return 1;
      if (!b.final_enrollment_date) return -1;
      return b.final_enrollment_date.localeCompare(a.final_enrollment_date);
    });

    // Write to CSV
    const csvHeaders = [
      'Lead ID',
      'Name',
      'Phone',
      'Email',
      'Course',
      'Lead Created On',
      'Lead Date',
      'Course Enrollment Date Field',
      'Status Change Timestamp (History)',
      'Final Enrollment Date',
      'Enrollment Date Source'
    ];

    const csvRows = [
      csvHeaders.join(','),
      ...rows.map(r => [
        `"${r.id}"`,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.phone}"`,
        `"${r.email.replace(/"/g, '""')}"`,
        `"${r.course.replace(/"/g, '""')}"`,
        `"${r.created_on}"`,
        `"${r.lead_date}"`,
        `"${r.course_enrollment_date_field}"`,
        `"${r.status_change_timestamp}"`,
        `"${r.final_enrollment_date}"`,
        `"${r.enrollment_date_source}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const outputPath = path.join(__dirname, 'enrolled_leads_data.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf8');

    console.log('\n--- EXTRACTION STATISTICS ---');
    console.log(`Total Enrolled Leads Processed: ${rows.length}`);
    console.log(`Leads with "Course Enrollment Date" field updated: ${hasEnrollmentDateFieldCount}`);
    console.log(`Leads utilizing "Status Change Timestamp" (history): ${hasStatusChangeTimestampCount}`);
    console.log(`Leads utilizing modified/created fallbacks: ${fallbackCount}`);
    console.log(`CSV successfully written to: ${outputPath}`);

    // Print first 5 rows for preview
    console.log('\n--- PREVIEW OF FIRST 5 ENROLLED LEADS ---');
    console.log(rows.slice(0, 5));

  } catch (err) {
    console.error('Error during run:', err);
  }
}

run();
