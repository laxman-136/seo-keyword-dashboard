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

const SOURCE_TO_CHANNEL = {
  'Organic':                    'Organic',
  'Organic- Chatbot':           'Organic',
  'Website':                    'Website',
  'Referral':                   'Referral',
  'Gads-Lead Form-SCM':         'Google Ads',
  'Gads-Lead Form-HCM':         'Google Ads',
  'Gads-Lead Form-Technical':   'Google Ads',
  'googletech':                 'Google Ads',
  'googlescm':                  'Google Ads',
  'Facebook - SCM':             'Meta Ads',
  'Facebook - HCM':             'Meta Ads',
  'Facebook - Technical':       'Meta Ads',
  'Facebook - Financials':      'Meta Ads',
  'facebook':                   'Meta Ads',
  'Website-fb':                 'Meta Ads',
  'SOT':                        'SOT',
  'chatgpt':                    'LLM',
  'perplexity':                 'LLM',
  'openai':                     'LLM',
  'claude':                     'LLM',
  'chatgpt-chatbot':           'LLM',
  'perplexity-ai':              'LLM',
  'LLM':                        'LLM',
};

function detectLeadChannel(lead) {
  const fields = lead.fields || {};
  
  const utmSourceRaw = fields.utmsource;
  const utmMediumRaw = fields.utmmedium;
  const lowerUtm = utmSourceRaw?.toLowerCase() || '';
  const lowerMedium = utmMediumRaw?.toLowerCase() || '';
  
  if (lowerUtm) {
    if (lowerUtm.includes('chatgpt') || lowerUtm.includes('chat gpt') || lowerUtm.includes('gpt') || lowerUtm.includes('perplexity') || lowerUtm.includes('openai') || lowerUtm.includes('claude') || lowerUtm.includes('llm')) {
      return 'LLM';
    }
  }

  // 1. Check explicit click IDs
  if (fields.fbclid) return 'Meta Ads';
  if (fields.google_gcl_id || fields.gclid) return 'Google Ads';
  
  // 2. Check UTM source for Ads platforms
  if (lowerUtm === 'google' || lowerUtm === 'gads') {
    return 'Google Ads';
  }
  if (lowerUtm === 'an' || lowerUtm === 'fb' || lowerUtm === 'ig' || lowerUtm.includes('facebook') || lowerUtm.includes('instagram') || lowerUtm.includes('meta')) {
    return 'Meta Ads';
  }
  
  // 3. Check UTM medium for CPC/PPC/Paid
  if (lowerMedium === 'cpc' || lowerMedium === 'ppc' || lowerMedium === 'paid' || lowerMedium === 'paid_social') {
    if (lowerUtm.includes('facebook') || lowerUtm.includes('instagram') || lowerUtm === 'fb' || lowerUtm === 'ig' || lowerUtm === 'an') {
      return 'Meta Ads';
    }
    return 'Google Ads';
  }
  
  const sourceRaw = fields.lead_source_1;
  if (sourceRaw) {
    const lower = sourceRaw.toLowerCase();
    if (lower.includes('gads') || lower.includes('google')) {
      return 'Google Ads';
    }
    if (lower.includes('facebook') || lower.includes('fb') || lower.includes('instagram') || lower.includes('meta')) {
      return 'Meta Ads';
    }
    if (lower.includes('chatgpt') || lower.includes('chat gpt') || lower.includes('gpt') || lower.includes('perplexity') || lower.includes('openai') || lower.includes('claude') || lower.includes('llm')) {
      return 'LLM';
    }
    if (lower === 'website') {
      const hasMarketingParams = !!(
        fields.utmsource || fields.utmmedium || fields.utmcampaign || 
        fields.utmcontent || fields.utmterm || fields.gclid || 
        fields.google_gcl_id || fields.fbclid
      );
      if (!hasMarketingParams) {
        return 'Organic';
      }
    }
    return SOURCE_TO_CHANNEL[sourceRaw] || 'Other';
  }
  
  return 'Other';
}

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

    // 1. Fetch leads created in June (by lead_date)
    let juneCreatedLeadDate = [];
    let skip = 0;
    while (true) {
      const res = await testSearch({ lead_date: { from: fromMs, to: toMs } }, 100, skip);
      juneCreatedLeadDate.push(...res.data);
      if (res.data.length < 100 || juneCreatedLeadDate.length >= res.total_count) break;
      skip += 100;
    }

    // 2. Fetch leads created in June (by created_on)
    let juneCreatedOn = [];
    skip = 0;
    while (true) {
      const res = await testSearch({ created_on: { from: fromMs, to: toMs } }, 100, skip);
      juneCreatedOn.push(...res.data);
      if (res.data.length < 100 || juneCreatedOn.length >= res.total_count) break;
      skip += 100;
    }

    // 3. Fetch leads enrolled in June (by course_enrollment_date)
    let juneEnrolledLeads = [];
    skip = 0;
    while (true) {
      const res = await testSearch({ course_enrollment_date: { from: fromMs, to: toMs }, status: 'Enrolled' }, 100, skip);
      juneEnrolledLeads.push(...res.data);
      if (res.data.length < 100 || juneEnrolledLeads.length >= res.total_count) break;
      skip += 100;
    }

    // Merge unique leads
    const mergedMap = new Map();
    juneCreatedLeadDate.forEach(l => mergedMap.set(l.id, l));
    juneCreatedOn.forEach(l => mergedMap.set(l.id, l));
    juneEnrolledLeads.forEach(l => mergedMap.set(l.id, l));

    const allLeads = Array.from(mergedMap.values());

    // Filter converted Google Ads leads
    const convertedGoogleAdsLeads = allLeads.filter(lead => {
      // 1. Must be Enrolled
      if (lead.status !== 'Enrolled') return false;

      // 2. Channel must be Google Ads
      const channel = detectLeadChannel(lead);
      if (channel !== 'Google Ads') return false;

      // 3. Must be either in the period by lead_date/created_on OR by course_enrollment_date
      const leadDateVal = lead.fields?.lead_date || lead.fields?.created_on;
      const isLeadInPeriod = !!(leadDateVal && leadDateVal >= fromMs && leadDateVal <= toMs);
      
      const enrollDateVal = lead.fields?.course_enrollment_date;
      const isEnrolledInPeriod = !!(enrollDateVal && enrollDateVal >= fromMs && enrollDateVal <= toMs);

      return isLeadInPeriod || isEnrolledInPeriod;
    });

    console.log(`\n--- June Converted Google Ads Leads (${convertedGoogleAdsLeads.length}) ---`);
    convertedGoogleAdsLeads.forEach((l, idx) => {
      const leadDate = l.fields?.lead_date ? new Date(l.fields.lead_date).toLocaleDateString('en-IN') : 'N/A';
      const createdOn = l.fields?.created_on ? new Date(l.fields.created_on).toLocaleDateString('en-IN') : 'N/A';
      const enrollDate = l.fields?.course_enrollment_date ? new Date(l.fields.course_enrollment_date).toLocaleDateString('en-IN') : 'N/A';
      
      const email = l.fields?.email || 'No Email';
      const phone = l.fields?.phone || 'No Phone';
      const course = l.fields?.course || 'No Course';
      const source = l.fields?.lead_source_1 || 'N/A';

      console.log(`[${idx + 1}] Name: ${l.fields?.name} | Email: ${email} | Phone: ${phone} | Course: ${course} | Lead Date: ${leadDate} | Created On: ${createdOn} | Enroll Date: ${enrollDate} | Source Field: ${source}`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
