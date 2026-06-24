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

    // June 1st to June 23rd, 2026
    const fromStr = '2026-06-01';
    const toStr = '2026-06-23';

    // Call local endpoint using the node script by mocking the request or hitting localhost (dev server must be off or we hit it if running)
    // Actually, we can just fetch the data and compute the KPI object exactly as the API endpoint route.ts does to check the numbers!
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

    const fromDate = new Date(`${fromStr}T00:00:00.000+05:30`);
    const toDate = new Date(`${toStr}T23:59:59.999+05:30`);
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

    const detectChannel = (l) => {
      const fields = l.fields || {};
      
      const utmSourceRaw = fields.utmsource;
      if (utmSourceRaw) {
        const lowerUtm = utmSourceRaw.toLowerCase();
        if (lowerUtm.includes('chatgpt') || lowerUtm.includes('chat gpt') || lowerUtm.includes('gpt') || lowerUtm.includes('perplexity') || lowerUtm.includes('openai') || lowerUtm.includes('claude') || lowerUtm.includes('llm')) {
          return 'LLM';
        }
      }

      if (fields.fbclid) return 'Meta Ads';
      if (fields.google_gcl_id || fields.gclid) return 'Google Ads';
      if (fields.utmsource === 'google') return 'Google Ads';
      if (fields.utmsource === 'an') return 'Meta Ads';
      
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
        
        const map = {
          'Organic': 'Organic',
          'Organic- Chatbot': 'Organic',
          'Website': 'Website',
          'Referral': 'Referral',
          'SOT': 'SOT'
        };
        return map[sourceRaw] || 'Other';
      }
      return 'Other';
    };

    const counts = {
      'Total': filteredLeads.length,
      'Google Ads': 0,
      'Meta Ads': 0,
      'Website': 0,
      'Organic': 0,
      'Referral': 0,
      'SOT': 0,
      'LLM': 0,
      'Other': 0
    };

    filteredLeads.forEach(l => {
      const ch = detectChannel(l);
      counts[ch] = (counts[ch] || 0) + 1;
    });

    const adsLeads = counts['Google Ads'] + counts['Meta Ads'];
    const websiteLeads = counts['Website'];
    const llmLeads = counts['LLM'];
    const organicLeads = counts['Total'] - adsLeads - websiteLeads - llmLeads;

    console.log(`\nDiagnostics of local KPI metrics:`);
    console.log(`Total Leads: ${counts['Total']}`);
    console.log(`Paid Ads Leads (Google Ads + Meta Ads): ${adsLeads} (Google: ${counts['Google Ads']}, Meta: ${counts['Meta Ads']})`);
    console.log(`Website Leads (Direct Website): ${websiteLeads}`);
    console.log(`Organic Leads (Organic + Referral + SOT + Other): ${organicLeads}`);
    console.log(`LLM Leads (ChatGPT/Perplexity referrals): ${llmLeads}`);

  } catch (err) {
    console.error(err);
  }
}

run();
