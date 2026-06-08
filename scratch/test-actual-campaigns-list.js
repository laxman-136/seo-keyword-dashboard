// scratch/test-actual-campaigns-list.js
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
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeCampaignName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^(google|meta|facebook|instagram|gads|adset)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function isFuzzyCampaignMatch(nameA, nameB) {
  if (!nameA || !nameB) return false;
  const normA = normalizeCampaignName(nameA);
  const normB = normalizeCampaignName(nameB);
  if (!normA || !normB) return false;
  return normA === normB || normA.includes(normB) || normB.includes(normA);
}

async function fetchMetaCampaigns(dateRange, accountId, token) {
  const META_BASE = "https://graph.facebook.com/v19.0";
  const timeRange = JSON.stringify({ since: dateRange.from, until: dateRange.to });
  const url = `${META_BASE}/${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&filtering=[{field:'effective_status',operator:'IN',value:['ACTIVE','PAUSED']}]`;

  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      console.log('❌ Meta campaigns fetch failed.');
      return [];
    }
    const json = await res.json();
    return (json.data || []).map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      spend: 0,
      totalConversions: 0
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function fetchGoogleCampaigns(dateRange, devToken, clientId, clientSecret, refreshToken, customerId) {
  // Return empty array since we don't have Google Ads API running locally easily without setup
  return [];
}

async function searchLeads(filters, pagination, token, enterpriseId) {
  const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=${pagination.limit}&skip=${pagination.skip}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: filters })
  });
  if (!response.ok) return { data: [], total_count: 0 };
  return response.json();
}

async function getAllLeads(dateRange, token, enterpriseId) {
  const fromMs = new Date(dateRange.from).getTime();
  const toMs = new Date(dateRange.to).getTime();
  
  const leads = [];
  let skip = 0;
  const limit = 100;
  
  while (true) {
    const apiRes = await searchLeads({ created_on: { from: fromMs, to: toMs } }, { limit, skip }, token, enterpriseId);
    leads.push(...apiRes.data);
    if (leads.length >= apiRes.total_count || apiRes.data.length < limit) {
      break;
    }
    skip += limit;
  }
  return leads;
}

function attributeLead(lead) {
  const fields = lead.fields || {};
  const status = lead.status || 'Fresh';
  const utmSource = fields.utmsource?.toLowerCase() || null;
  const utmMedium = fields.utmmedium?.toLowerCase() || null;
  const utmCampaign = fields.utmcampaign || null;
  const fbclid = fields.fbclid || null;
  const gclid = fields.google_gcl_id || null;
  const leadSource = fields.lead_source_1?.toLowerCase() || '';

  let channel = 'unknown';
  if (fbclid) channel = 'meta';
  else if (gclid) channel = 'google';
  else if (utmSource === 'an' || utmSource?.includes('facebook') || utmSource?.includes('instagram') || utmSource?.includes('meta')) channel = 'meta';
  else if (utmSource === 'google' || utmSource === 'gads' || utmMedium === 'cpc' || utmMedium === 'ppc') channel = 'google';
  else if (utmSource === 'organic' || leadSource.includes('organic')) channel = 'organic';
  else if (utmSource === 'referral' || leadSource.includes('referral')) channel = 'referral';
  else if (leadSource.includes('website')) channel = 'direct';

  return {
    leadId: lead.id,
    status,
    channel,
    campaignName: utmCampaign || (channel === 'meta' ? 'Meta Paid Campaign' : channel === 'google' ? 'Google Paid Campaign' : 'Organic Traffic')
  };
}

async function run() {
  try {
    const { data: config } = await supabase
      .from('configurations')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    // Last 3 months range (approximate)
    const dateRange = { from: '2026-03-01', to: '2026-06-08' };
    
    console.log('Fetching Meta campaigns...');
    const metaCampaigns = await fetchMetaCampaigns(dateRange, config.meta_ad_account_id, config.meta_access_token);
    console.log(`Fetched ${metaCampaigns.length} Meta campaigns.`);

    console.log('Fetching TeleCRM Leads...');
    const rawLeads = await getAllLeads(dateRange, config.telecrm_api_token, config.telecrm_enterprise_id);
    console.log(`Fetched ${rawLeads.length} CRM Leads.`);
    
    const attributedLeads = rawLeads.map(attributeLead);

    const adCampaignNames = new Set();
    metaCampaigns.forEach(c => adCampaignNames.add(c.name));

    const leadCampaignNames = new Set(
      attributedLeads
        .map(l => l.campaignName)
        .filter(Boolean)
    );

    const campaignNames = Array.from(new Set([
      ...adCampaignNames,
      ...leadCampaignNames,
      'Organic Traffic'
    ]));

    console.log('\n--- ATTRIBUTION RESULTS ANALYSIS ---');
    let activeCampaignsCount = 0;
    let pausedCampaignsCount = 0;
    
    campaignNames.forEach(name => {
      let status = 'ACTIVE'; // default
      let platform = 'other';
      
      const metaC = metaCampaigns.find(c => isFuzzyCampaignMatch(c.name, name));
      if (metaC) {
        platform = 'meta';
        status = metaC.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED';
      } else {
        const nameLower = name.toLowerCase();
        if (nameLower.includes('organic')) platform = 'organic';
        else if (nameLower.includes('direct') || nameLower.includes('website')) platform = 'direct';
        else if (nameLower.includes('referral')) platform = 'referral';
        else {
          const sample = attributedLeads.find(l => isFuzzyCampaignMatch(l.campaignName || '', name));
          if (sample) {
            platform = sample.channel;
          }
        }
      }
      
      if (status === 'ACTIVE') {
        activeCampaignsCount++;
      } else {
        pausedCampaignsCount++;
      }
      
      console.log(`Campaign: "${name}"`);
      console.log(`  - Resolved Platform: ${platform}`);
      console.log(`  - Resolved Status: ${status}`);
      console.log(`  - Found in Meta API: ${!!metaC} (Meta API status: ${metaC ? metaC.status : 'N/A'})`);
    });

    console.log(`\nSummary: Active (Live) campaigns count: ${activeCampaignsCount}, Paused campaigns count: ${pausedCampaignsCount}`);

  } catch (err) {
    console.error('Exception:', err);
  }
}

run();
