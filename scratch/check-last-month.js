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

    const COURSE_TO_GROUP = {
      'Oracle Fusion Financial Course':                   'Oracle Fusion Financials',
      'Oracle Fusion SCM Course':                         'Oracle Fusion SCM',
      'Oracle Fusion Technical OIC Training':             'Oracle Fusion Technical',
      'Oracle Fusion Technical + OIC Training':           'Oracle Fusion Technical',
      'Oracle Fusion HCM':                                'Oracle Fusion HCM',
      'Oracle Fusion HCM Online Training':                'Oracle Fusion HCM',
      'Oracle Fusion WMS Cloud Logfire Training Course':  'Oracle Fusion WMS',
      'Oracle Fusion PPM Projects Training':              'Oracle Fusion PPM',
      'Oracle Transportation Management Cloud online training Course': 'Oracle TMS',
      'Oracle EBS R12 Financials':                        'Oracle EBS',
      'Master SAP ABAP Training':                         'SAP',
      'Oracle Fusion Technical Training':                 'Oracle Fusion Technical',
      'Oracle Integration Cloud Online Training Course':  'Oracle Integration',
    };

    function detectLeadChannel(lead) {
      const fields = lead.fields || {}
      
      const utmSourceRaw = fields.utmsource
      const utmMediumRaw = fields.utmmedium
      const lowerUtm = utmSourceRaw?.toLowerCase() || ''
      const lowerMedium = utmMediumRaw?.toLowerCase() || ''
      
      if (lowerUtm) {
        if (lowerUtm.includes('chatgpt') || lowerUtm.includes('chat gpt') || lowerUtm.includes('gpt') || lowerUtm.includes('perplexity') || lowerUtm.includes('openai') || lowerUtm.includes('claude') || lowerUtm.includes('llm')) {
          return 'LLM'
        }
      }

      // 1. Check explicit click IDs
      if (fields.fbclid) return 'Meta Ads'
      if (fields.google_gcl_id || fields.gclid) return 'Google Ads'
      
      // 2. Check UTM source for Ads platforms
      if (lowerUtm === 'google' || lowerUtm === 'gads') {
        return 'Google Ads'
      }
      if (lowerUtm === 'an' || lowerUtm === 'fb' || lowerUtm === 'ig' || lowerUtm.includes('facebook') || lowerUtm.includes('instagram') || lowerUtm.includes('meta')) {
        return 'Meta Ads'
      }
      
      // 3. Check UTM medium for CPC/PPC/Paid
      if (lowerMedium === 'cpc' || lowerMedium === 'ppc' || lowerMedium === 'paid' || lowerMedium === 'paid_social') {
        if (lowerUtm.includes('facebook') || lowerUtm.includes('instagram') || lowerUtm === 'fb' || lowerUtm === 'ig' || lowerUtm === 'an') {
          return 'Meta Ads'
        }
        return 'Google Ads'
      }
      
      const sourceRaw = fields.lead_source_1
      if (sourceRaw) {
        const lower = sourceRaw.toLowerCase()
        if (lower.includes('gads') || lower.includes('google')) {
          return 'Google Ads'
        }
        if (lower.includes('facebook') || lower.includes('fb') || lower.includes('instagram') || lower.includes('meta')) {
          return 'Meta Ads'
        }
        if (lower.includes('chatgpt') || lower.includes('chat gpt') || lower.includes('gpt') || lower.includes('perplexity') || lower.includes('openai') || lower.includes('claude') || lower.includes('llm')) {
          return 'LLM'
        }
        if (lower === 'website') {
          const hasMarketingParams = !!(
            fields.utmsource || fields.utmmedium || fields.utmcampaign || 
            fields.utmcontent || fields.utmterm || fields.gclid || 
            fields.google_gcl_id || fields.fbclid
          )
          if (!hasMarketingParams) {
            return 'Organic'
          }
        }
        return SOURCE_TO_CHANNEL[sourceRaw] || 'Other'
      }
      
      return 'Other'
    }

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

    // May 1st to May 31st, 2026 in IST (+5:30)
    const fromDate = new Date('2026-05-01T00:00:00.000+05:30');
    const toDate = new Date('2026-05-31T23:59:59.999+05:30');
    const fromMs = fromDate.getTime();
    const toMs = toDate.getTime();

    // Fetch both ranges to merge accurately
    let leadDateLeads = [];
    let skip = 0;
    while (true) {
      const res = await testSearch({ lead_date: { from: fromMs, to: toMs } }, 100, skip);
      leadDateLeads.push(...res.data);
      if (res.data.length < 100 || leadDateLeads.length >= res.total_count) break;
      skip += 100;
    }

    let createdOnLeads = [];
    skip = 0;
    while (true) {
      const res = await testSearch({ created_on: { from: fromMs, to: toMs } }, 100, skip);
      createdOnLeads.push(...res.data);
      if (res.data.length < 100 || createdOnLeads.length >= res.total_count) break;
      skip += 100;
    }

    const mergedMap = new Map();
    leadDateLeads.forEach(l => mergedMap.set(l.id, l));
    createdOnLeads.forEach(l => mergedMap.set(l.id, l));

    const filteredLeads = [];
    mergedMap.forEach(l => {
      const dateVal = l.fields?.lead_date || l.fields?.created_on;
      if (dateVal >= fromMs && dateVal <= toMs) {
        filteredLeads.push(l);
      }
    });

    const channelStats = {};
    filteredLeads.forEach(l => {
      const ch = detectLeadChannel(l);
      channelStats[ch] = (channelStats[ch] || 0) + 1;
    });

    console.log('=== MAY 2026 TELECRM DATA ANALYSIS ===');
    console.log(`Total Leads Found: ${filteredLeads.length}`);
    console.log('\n=== CHANNEL COUNTS ===');
    console.log(channelStats);

    const googleAds = channelStats['Google Ads'] || 0;
    const metaAds = channelStats['Meta Ads'] || 0;
    const paidAds = googleAds + metaAds;
    const websiteLeads = channelStats['Website'] || 0;
    const llmLeads = channelStats['LLM'] || 0;
    const organicLeads = filteredLeads.length - paidAds - websiteLeads - llmLeads;

    console.log('\n=== KPI METRIC CORRESPONDENCE ===');
    console.log(`Paid Ads Leads (Google + Meta): ${paidAds}`);
    console.log(`Website Leads (Direct/Campaign referral): ${websiteLeads}`);
    console.log(`Organic Leads (Organic, SOT, Referral, Other): ${organicLeads}`);
    console.log(`LLM Leads: ${llmLeads}`);
    console.log(`Sum of channels check: ${paidAds + websiteLeads + organicLeads + llmLeads} (Expected: ${filteredLeads.length})`);

    // Course performance breakdown check
    const coursesMap = {};
    filteredLeads.forEach(lead => {
      const rawCourse = lead.fields?.course || '';
      const groupName = COURSE_TO_GROUP[rawCourse] || 'Unknown Course';
      if (!coursesMap[groupName]) {
        coursesMap[groupName] = { total: 0, ads: 0, website: 0, organic: 0, llm: 0 };
      }
      const g = coursesMap[groupName];
      g.total++;

      const ch = detectLeadChannel(lead);
      if (ch === 'Website') g.website++;
      else if (ch === 'Google Ads' || ch === 'Meta Ads') g.ads++;
      else if (ch === 'LLM') g.llm++;
      else g.organic++;
    });

    console.log('\n=== COURSE BREAKDOWN COUNTS ===');
    Object.entries(coursesMap).forEach(([name, data]) => {
      const sum = data.ads + data.website + data.organic + data.llm;
      console.log(`Course: ${name.padEnd(35)} | Total: ${data.total.toString().padStart(3)} | Sum: ${sum.toString().padStart(3)} | Ads: ${data.ads} | Web: ${data.website} | Org: ${data.organic} | LLM: ${data.llm} | Matches total: ${data.total === sum ? '✅ YES' : '❌ NO'}`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
