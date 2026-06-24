const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
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
  let ms = Number(timestamp);
  if (isNaN(ms) || ms <= 0) return '';
  if (ms < 10000000000) {
    ms = ms * 1000;
  }
  const date = new Date(ms);
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  const iso = istDate.toISOString();
  return iso.replace('T', ' ').substring(0, 19);
}

async function run() {
  try {
    const XLSX = require('xlsx');

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
      if (res.data.length < limit || allEnrolled.length >= res.total_count) break;
      skip += limit;
    }

    console.log(`Successfully fetched ${allEnrolled.length} enrolled leads.`);

    // Filter leads where course_enrollment_date is not updated and history (statusChangeTimestamp) exists
    const filteredRows = [];

    for (const lead of allEnrolled) {
      const fields = lead.fields || {};
      
      // Check if course_enrollment_date is set
      let hasEnrollmentField = false;
      if (fields.course_enrollment_date !== undefined && fields.course_enrollment_date !== null && fields.course_enrollment_date !== '') {
        hasEnrollmentField = true;
      } else {
        // Double check case-insensitive keywords in fields
        for (const [k, v] of Object.entries(fields)) {
          if (k.toLowerCase().includes('enrollment') || k.toLowerCase().includes('enrolled')) {
            if (v && !isNaN(Number(v))) {
              hasEnrollmentField = true;
              break;
            }
          }
        }
      }

      // If it is NOT updated, we collect it and fetch the history timestamp
      if (!hasEnrollmentField) {
        const name = fields.name || 'Unnamed';
        const phone = fields.phone || '';
        const email = fields.email || '';
        const course = fields.course || '';
        const createdOnVal = fields.created_on;
        const leadDateVal = fields.lead_date;
        const statusChangeVal = lead.leadMetaData?.statusChangeTimestamp;

        filteredRows.push({
          'Lead ID': lead.id,
          'Student Name': name,
          'Phone': phone,
          'Email': email,
          'Course': course,
          'Lead Created On': formatDate(createdOnVal),
          'Lead Date': formatDate(leadDateVal),
          'Enrolled Date (From History Event)': statusChangeVal ? formatDate(statusChangeVal) : 'Not Available'
        });
      }
    }

    // Sort rows by enrollment date descending
    filteredRows.sort((a, b) => {
      const dateA = a['Enrolled Date (From History Event)'];
      const dateB = b['Enrolled Date (From History Event)'];
      return dateB.localeCompare(dateA);
    });

    console.log(`Filtered down to ${filteredRows.length} leads that do not have the course enrollment date updated but have status change history.`);

    // Create workbook and sheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filteredRows);

    // Set column widths
    const colWidths = [
      { wch: 26 }, // Lead ID
      { wch: 25 }, // Student Name
      { wch: 15 }, // Phone
      { wch: 30 }, // Email
      { wch: 35 }, // Course
      { wch: 20 }, // Lead Created On
      { wch: 20 }, // Lead Date
      { wch: 22 }  // Enrolled Date (From History Event)
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Enrolled From History');

    const tempOutputPath = path.join(__dirname, 'enrolled_leads_from_history.xlsx');
    XLSX.writeFile(wb, tempOutputPath);

    const artifactPath = 'C:/Users/Veera/.gemini/antigravity/brain/60c7c6ff-585a-480c-8429-d0bf204f1ad7/enrolled_leads_from_history.xlsx';
    fs.copyFileSync(tempOutputPath, artifactPath);

    console.log(`Excel file successfully created and saved to: ${artifactPath}`);

  } catch (err) {
    console.error('Error during execution:', err);
  }
}

run();
