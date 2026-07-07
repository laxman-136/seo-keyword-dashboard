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

    // Fetch leads enrolled in June
    let juneEnrolledLeads = [];
    let skip = 0;
    while (true) {
      const res = await testSearch({ course_enrollment_date: { from: fromMs, to: toMs }, status: 'Enrolled' }, 100, skip);
      juneEnrolledLeads.push(...res.data);
      if (res.data.length < 100 || juneEnrolledLeads.length >= res.total_count) break;
      skip += 100;
    }

    console.log(`Scanning all ${juneEnrolledLeads.length} enrolled leads for Google properties...`);

    juneEnrolledLeads.forEach((l) => {
      const fields = l.fields || {};
      const name = fields.name;
      const email = fields.email;
      const leadSource = fields.lead_source_1 || '';
      const utmSource = fields.utmsource || '';
      const utmMedium = fields.utmmedium || '';
      const gclid = fields.gclid || fields.google_gcl_id || '';
      
      const allText = `${leadSource} ${utmSource} ${utmMedium} ${gclid}`.toLowerCase();
      
      // Let's check if there are any signs of Google/Ads/Gads/PPC
      const isGoogleAds = allText.includes('google') || allText.includes('gads') || allText.includes('cpc') || allText.includes('ppc') || gclid;
      
      if (isGoogleAds) {
        console.log(`- Match: "${name}" | Email: "${email}" | LeadSource: "${leadSource}" | UtmSource: "${utmSource}" | UtmMedium: "${utmMedium}" | Gclid: "${gclid}" | Status: ${l.status}`);
      }
    });

  } catch (err) {
    console.error(err);
  }
}

run();
