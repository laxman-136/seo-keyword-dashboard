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

function parseAmount(val) {
  if (!val || val === 'N/A' || val === 'undefined') return 0;
  const match = String(val).match(/([0-9,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10) || 0;
  }
  return 0;
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

    let skip = 0;
    const limit = 100;
    let hasMore = true;
    
    const juneStart = new Date('2026-06-01T00:00:00.000Z').getTime();
    const juneEnd = new Date('2026-06-30T23:59:59.999Z').getTime();

    const juneEnrollments = [];

    console.log('Scanning all leads to identify June 2026 enrollments...');

    while (hasMore) {
      const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=${limit}&skip=${skip}`;
      const body = { fields: {} };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        console.log('Failed to fetch:', res.status, res.statusText);
        break;
      }

      const result = await res.json();
      const chunk = result.data || [];
      if (chunk.length === 0) break;

      chunk.forEach(lead => {
        const f = lead.fields || {};
        
        let isJuneEnrollment1 = false;
        let c1EnrollDateRaw = f.course_enrollment_date;
        if (c1EnrollDateRaw) {
          if (typeof c1EnrollDateRaw === 'number') {
            if (c1EnrollDateRaw >= juneStart && c1EnrollDateRaw <= juneEnd) {
              isJuneEnrollment1 = true;
            }
          } else if (typeof c1EnrollDateRaw === 'string') {
            const cleanStr = c1EnrollDateRaw.trim();
            if (cleanStr.includes('/6/2026') || cleanStr.includes('/06/2026') || cleanStr.includes('-06-2026') || cleanStr.includes('-6-2026')) {
              isJuneEnrollment1 = true;
            }
          }
        }

        let isJuneEnrollment2 = false;
        let c2EnrollDateRaw = f.course_2_enrollment_date || f.course_2_enroll_date || f.course2_enrollment_date;
        if (c2EnrollDateRaw) {
          if (typeof c2EnrollDateRaw === 'number') {
            if (c2EnrollDateRaw >= juneStart && c2EnrollDateRaw <= juneEnd) {
              isJuneEnrollment2 = true;
            }
          } else if (typeof c2EnrollDateRaw === 'string') {
            const cleanStr = c2EnrollDateRaw.trim();
            if (cleanStr.includes('/6/2026') || cleanStr.includes('/06/2026') || cleanStr.includes('-06-2026') || cleanStr.includes('-6-2026')) {
              isJuneEnrollment2 = true;
            }
          }
        }

        if (isJuneEnrollment1 || isJuneEnrollment2) {
          juneEnrollments.push({
            name: f.name,
            phone: f.phone,
            status: lead.status || f.status,
            c1Enrolled: isJuneEnrollment1,
            c2Enrolled: isJuneEnrollment2,
            fields: f
          });
        }
      });

      skip += limit;
      if (chunk.length < limit || skip >= 4000) {
        hasMore = false;
      }
    }

    console.log(`\nScan complete. Found ${juneEnrollments.length} June enrollments.`);

    let totalC1Paid = 0;
    let totalC2Paid = 0;
    let c1Count = 0;
    let c2Count = 0;

    juneEnrollments.forEach((e, idx) => {
      const f = e.fields;
      console.log(`\n[${idx + 1}] Student: ${f.name} | Phone: ${f.phone} | Status: ${e.status}`);
      
      if (e.c1Enrolled) {
        c1Count++;
        const c1Paid = parseAmount(f.amount_paid);
        const emi2 = parseAmount(f.amount_paid_emi_2);
        const totalPaid = c1Paid + emi2;
        totalC1Paid += totalPaid;
        console.log(`    Course 1: ${f.course} (Enrolled) | Fee: ${f.course_fee} | Paid: ₹${totalPaid.toLocaleString()} (${c1Paid} + ${emi2})`);
      } else {
        console.log(`    Course 1: ${f.course} (Not Enrolled in June)`);
      }

      if (e.c2Enrolled) {
        c2Count++;
        const c2Paid1 = parseAmount(f.amount_paid_emi_1_course_2);
        const c2Paid2 = parseAmount(f.amount_paid_emi_2_course_2);
        const totalPaid2 = c2Paid1 + c2Paid2;
        totalC2Paid += totalPaid2;
        console.log(`    Course 2: ${f.course_name_2} (Enrolled) | Fee: ${f.course_2_fee} | Paid: ₹${totalPaid2.toLocaleString()} (${c2Paid1} + ${c2Paid2})`);
      }
    });

    console.log('\n======================================');
    console.log('               SUMMARY                ');
    console.log('======================================');
    console.log(`Total June Enrollments Found: ${juneEnrollments.length}`);
    console.log(`  Course 1 Enrollments: ${c1Count} | Collected: ₹${totalC1Paid.toLocaleString('en-IN')}`);
    console.log(`  Course 2 Enrollments: ${c2Count} | Collected: ₹${totalC2Paid.toLocaleString('en-IN')}`);
    console.log(`Grand Total Cash Collected: ₹${(totalC1Paid + totalC2Paid).toLocaleString('en-IN')}`);

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
