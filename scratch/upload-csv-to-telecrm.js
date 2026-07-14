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

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSVDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return undefined;
  const cleanStr = dateStr.trim();
  const months = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].toLowerCase().substring(0, 3);
    const month = months[monthStr];
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    if (day !== NaN && month !== undefined && year !== NaN) {
      return new Date(year, month, day).getTime();
    }
  }
  return undefined;
}

function formatPhone(phoneStr) {
  if (!phoneStr) return '';
  // Remove all non-numeric characters
  let cleaned = phoneStr.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return cleaned;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned;
  }
  return cleaned;
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

    const csvPath = path.join(__dirname, '../excel/fraawsde-14-Jul-2026_14_53_21 (1).csv');
    if (!fs.existsSync(csvPath)) {
      console.error('CSV file not found at:', csvPath);
      return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Header check
    const header = parseCSVLine(lines[0]);
    console.log('CSV Headers:', header);

    const leadsToUpload = [];
    const defaultEnrollDate = new Date(2024, 9, 4).getTime(); // Fallback enrollment: Oct 4, 2024

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < 4 || !values[3]) continue;

      const rawStatus = values[0] || 'Enrolled';
      const name = values[1];
      const email = values[2];
      const rawPhone = values[3];
      const course = values[4] || 'SCM';
      const rawFee = (values[6] || '').replace(/,/g, '');
      const rawPaid = (values[7] || '').replace(/,/g, '');
      
      const cleanPhone = formatPhone(rawPhone);
      
      // Compute enrollment date (default to Oct 4, 2024 if missing)
      const parsedEnrollDate = parseCSVDate(values[8]);
      const enrollMs = parsedEnrollDate || defaultEnrollDate;
      
      // Lead date is exactly 2 days before enrollment date
      const leadMs = enrollMs - (2 * 24 * 60 * 60 * 1000);

      leadsToUpload.push({
        status: rawStatus,
        fields: {
          name: name,
          phone: cleanPhone,
          email: email || undefined,
          course: course,
          course_fee: rawFee || undefined,
          amount_paid: rawPaid || undefined,
          course_enrollment_date: enrollMs,
          lead_date: leadMs,
          batch_number: 63,
          status: rawStatus
        }
      });
    }

    console.log(`\nPrepared ${leadsToUpload.length} leads for upload.`);

    for (let i = 0; i < leadsToUpload.length; i++) {
      const lead = leadsToUpload[i];
      console.log(`[${i+1}/${leadsToUpload.length}] Uploading ${lead.fields.name} (${lead.fields.phone})...`);
      
      const url = `https://app.telecrm.in/api/b1/enterprise/${enterpriseId}/autoupdatelead`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'x-telecrm-api-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lead)
      });

      if (!res.ok) {
        console.error(`  Failed (Status ${res.status}):`, await res.text());
      } else {
        const responseData = await res.json();
        console.log(`  Success! Status: ${responseData.status} | Lead ID: ${responseData.modifiedLeadIds[0]}`);
      }
      
      // Throttle calls slightly (200ms) to respect TeleCRM API rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\nCSV Lead Upload process complete!');

  } catch (err) {
    console.error(err);
  }
}

run();
