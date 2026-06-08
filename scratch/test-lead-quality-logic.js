// scratch/test-lead-quality-logic.js
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

// Re-implement the key logic from the intelligence route and attribution
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

// Fetch campaigns helper
async function fetchMetaCampaigns(dateRange, accountId, token) {
  const META_BASE = "https://graph.facebook.com/v19.0";
  const timeRange = JSON.stringify({ since: dateRange.from, until: dateRange.to });
  const url = `${META_BASE}/${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time&filtering=[{field:'effective_status',operator:'IN',value:['ACTIVE','PAUSED']}]`;

  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const errText = await res.text();
      console.log(`⚠️ Meta API failed, using mock. Error: ${errText}`);
      return getMockMetaCampaigns(dateRange.from, dateRange.to);
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
    console.log(`⚠️ Meta API exception, using mock:`, err);
    return getMockMetaCampaigns(dateRange.from, dateRange.to);
  }
}

function getMockMetaCampaigns() {
  return [
    { id: 'meta_camp_1', name: 'SCM Lead Gen Campaign', status: 'ACTIVE' },
    { id: 'meta_camp_2', name: 'Financials Brand Awareness', status: 'ACTIVE' },
    { id: 'meta_camp_3', name: 'HCM Lookalike Conversions', status: 'ACTIVE' },
    { id: 'meta_camp_4', name: 'PPM Retargeting Funnel', status: 'PAUSED' }
  ];
}

async function getTeleCRMLeads() {
  // Simple fetch from telecrm table in Supabase
  const { data, error } = await supabase
    .from('telecrm_leads')
    .select('*')
    .limit(1000);
  
  if (error) {
    console.error('TeleCRM fetch error:', error);
    return [];
  }
  return data || [];
}

// Attribute lead logic
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

    const dateRange = { from: '2026-03-01', to: '2026-06-08' };
    const metaCampaigns = await fetchMetaCampaigns(dateRange, config.meta_ad_account_id, config.meta_access_token);
    const rawLeads = await getTeleCRMLeads();
    const attributedLeads = rawLeads.map(attributeLead);

    // Calculate campaign lists
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

    console.log('--- RESOLVED CAMPAIGNS ---');
    campaignNames.forEach(name => {
      let status = 'ACTIVE';
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

      console.log(`Campaign: "${name}" | Platform: ${platform} | Status: ${status} | Found in Meta API: ${!!metaC}`);
    });

  } catch (err) {
    console.error('Exception:', err);
  }
}

run();
