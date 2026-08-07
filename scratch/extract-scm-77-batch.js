const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load local environment variables
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

// Utility functions copied from telecrm-api
function getCourseGroup(courseName) {
  if (!courseName) return '';
  const lower = courseName.toLowerCase().trim();
  if (lower.includes('scm') || lower.includes('supply chain') || lower.includes('logistics') || lower.includes('sap scm')) {
    return 'SCM';
  }
  if (lower.includes('hcm') || lower.includes('human capital') || lower.includes('hr') || lower.includes('sap hcm')) {
    return 'HCM';
  }
  if (lower.includes('finance') || lower.includes('fico') || lower.includes('financial') || lower.includes('tax') || lower.includes('s4 hana finance') || lower.includes('s/4hana finance')) {
    return 'Financials';
  }
  return 'Technical'; // Default fallback
}

function getBatchName(batchVal) {
  if (!batchVal) return '';
  const clean = String(batchVal).trim();
  if (!clean) return '';
  
  // Extract digits
  const numMatch = clean.match(/\d+/);
  if (!numMatch) return clean;
  
  const num = parseInt(numMatch[0], 10);
  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;
  
  let suffix = 'th';
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    suffix = 'th';
  } else if (lastDigit === 1) {
    suffix = 'st';
  } else if (lastDigit === 2) {
    suffix = 'nd';
  } else if (lastDigit === 3) {
    suffix = 'rd';
  }
  
  return `${num}${suffix} Batch`;
}

function parseAmount(val) {
  if (typeof val === 'number') return val;
  if (!val || typeof val !== 'string') return 0;
  const match = val.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  if (!match) return 0;
  const num = parseFloat(match[0]);
  return num > 0 && num < 150 ? num * 1000 : num;
}

async function run() {
  try {
    const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
    if (!config) {
      console.log('No active configuration found');
      return;
    }
    const token = config.telecrm_api_token || envVars.TELECRM_API_TOKEN;
    const enterpriseId = config.telecrm_enterprise_id || envVars.TELECRM_ENTERPRISE_ID;

    console.log(`[TeleCRM Extract] Fetching leads with status='Enrolled' for SCM Batch 77...`);

    let skip = 0;
    const limit = 100;
    let hasMore = true;
    const matchedLeads = [];
    let scannedCount = 0;

    while (hasMore) {
      const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=${limit}&skip=${skip}`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            status: 'Enrolled'
          }
        })
      });

      if (!res.ok) {
        console.error('Failed to fetch:', res.status, res.statusText);
        break;
      }

      const result = await res.json();
      const chunk = result.data || [];
      if (chunk.length === 0) break;

      scannedCount += chunk.length;

      chunk.forEach(lead => {
        const fields = lead.fields || {};
        
        // --- Course 1 Check ---
        const courseName1 = getCourseGroup(fields.course || '');
        const batchNum1 = fields.batch_number;
        const formattedBatchName1 = batchNum1 ? getBatchName(batchNum1) : '';
        const isScmBatch77_Course1 = (courseName1 === 'SCM' && formattedBatchName1 === '77th Batch');

        // --- Course 2 Check ---
        const courseName2 = getCourseGroup(fields.course_name_2 || fields.course_2_name || fields.course2_name || '');
        const batchName2 = fields.course_2_batch_name;
        const formattedBatchName2 = batchName2 ? getBatchName(batchName2) : '';
        const isScmBatch77_Course2 = (courseName2 === 'SCM' && formattedBatchName2 === '77th Batch');

        if (isScmBatch77_Course1 || isScmBatch77_Course2) {
          // Calculate cash
          let cash = 0;
          let enrollDate = 'N/A';
          
          if (isScmBatch77_Course1) {
            cash = parseAmount(fields.amount_paid) + parseAmount(fields.amount_paid_emi_2);
            enrollDate = fields.course_enrollment_date 
              ? new Date(fields.course_enrollment_date).toLocaleDateString()
              : 'N/A';
          } else {
            cash = parseAmount(fields.amount_paid_emi_1_course_2) + parseAmount(fields.amount_paid_emi_2_course_2);
            
            const enroll2DateVal = fields.course_2_enrollment_date || fields.course_2_enroll_date || fields.course2_enrollment_date;
            if (enroll2DateVal) {
              if (typeof enroll2DateVal === 'number') {
                enrollDate = new Date(enroll2DateVal).toLocaleDateString();
              } else {
                enrollDate = String(enroll2DateVal);
              }
            }
          }

          matchedLeads.push({
            id: lead.id,
            name: fields.name || 'N/A',
            phone: fields.phone || 'N/A',
            email: fields.email || 'N/A',
            enrollment_date: enrollDate,
            amount_paid: cash,
            course_type: isScmBatch77_Course1 ? 'Course 1' : 'Course 2',
            telecrm_course: isScmBatch77_Course1 ? fields.course : (fields.course_name_2 || fields.course_2_name),
            remarks: fields.remarks || 'N/A'
          });
        }
      });

      skip += limit;
      if (chunk.length < limit) {
        hasMore = false;
      }
    }

    console.log(`\nScan complete. Fetched ${scannedCount} enrolled leads.`);
    console.log(`Found ${matchedLeads.length} SCM 77th Batch students.`);

    // Sort by name
    matchedLeads.sort((a, b) => a.name.localeCompare(b.name));

    // Save to CSV in artifacts directory
    const artifactsDir = 'C:\\Users\\Veera\\.gemini\\antigravity\\brain\\60c7c6ff-585a-480c-8429-d0bf204f1ad7';
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }
    const csvPath = path.join(artifactsDir, 'scm_77th_batch_students.csv');
    
    const headers = ['Serial No', 'Name', 'Phone', 'Email', 'Enrollment Date', 'Amount Paid', 'Course Type', 'TeleCRM Course Name', 'Remarks'];
    const rows = matchedLeads.map((l, idx) => [
      idx + 1,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.enrollment_date}"`,
      l.amount_paid,
      `"${l.course_type}"`,
      `"${String(l.telecrm_course).replace(/"/g, '""')}"`,
      `"${l.remarks.replace(/\r?\n/g, ' ').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    fs.writeFileSync(csvPath, csvContent, 'utf8');
    console.log(`Report generated successfully: ${csvPath}`);

    // Print summary in JSON so our agent can capture it
    console.log(JSON.stringify({
      success: true,
      totalCount: matchedLeads.length,
      totalRevenue: matchedLeads.reduce((acc, curr) => acc + curr.amount_paid, 0),
      leads: matchedLeads,
      csvPath: csvPath
    }));

  } catch (err) {
    console.error(err);
  }
}

run();
