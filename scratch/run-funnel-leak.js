// scratch/run-funnel-leak.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Mock fetchers and libraries since we want to run the exact code
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx > 0) {
    env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY);

// Include api fetchers
const { fetchMetaAccountOverview, fetchMetaCampaigns } = require('../lib/meta-api');
const { fetchGoogleAccountOverview, fetchGoogleCampaigns } = require('../lib/google-ads-api');
const { buildAttributionDataset } = require('../lib/attribution');
const { resolveDateRange } = require('../lib/dateRange');

async function run() {
  const { data: configs } = await supabase
    .from('configurations')
    .select('*')
    .eq('is_active', true);
  
  const config = configs[0];
  const metaAccountId = config.meta_ad_account_id;
  const metaAccessToken = config.meta_access_token;
  const googleDevToken = config.google_developer_token;
  const googleClientId = config.google_client_id;
  const googleClientSecret = config.google_client_secret;
  const googleRefreshToken = config.google_refresh_token;
  const googleCustomerId = config.google_customer_id;
  const googleManagerId = config.google_manager_id;
  const telecrmToken = config.telecrm_api_token;
  const telecrmEnterpriseId = config.telecrm_enterprise_id;

  const dateRange = resolveDateRange('this_year');

  console.log('Fetching data for range:', dateRange);

  const [metaOverview, googleOverview, attributedLeads] = await Promise.all([
    fetchMetaAccountOverview(dateRange, metaAccountId, metaAccessToken),
    fetchGoogleAccountOverview(dateRange, googleDevToken, googleClientId, googleClientSecret, googleRefreshToken, googleCustomerId, googleManagerId),
    buildAttributionDataset({ from: new Date(dateRange.from), to: new Date(dateRange.to) }, telecrmToken, telecrmEnterpriseId, false)
  ]);

  const totalSpend = metaOverview.spend + googleOverview.spend;
  const totalLeadsCRM = attributedLeads.length;
  const enrolledTotal = attributedLeads.filter(l => l.isEnrolled).length;

  const metaLeads = attributedLeads.filter(l => l.channel === 'meta');
  const googleLeads = attributedLeads.filter(l => l.channel === 'google');

  console.log('--- META OVERVIEW ---');
  console.log('Spend:', metaOverview.spend);
  console.log('Impressions:', metaOverview.impressions);
  console.log('Clicks:', metaOverview.clicks);

  console.log('--- GOOGLE OVERVIEW ---');
  console.log('Spend:', googleOverview.spend);
  console.log('Impressions:', googleOverview.impressions);
  console.log('Clicks:', googleOverview.clicks);

  console.log('--- CRM LEADS ---');
  console.log('Total Leads:', totalLeadsCRM);
  console.log('Meta Leads:', metaLeads.length);
  console.log('Google Leads:', googleLeads.length);

  const funnel = {
    overall: {
      impressions: (metaOverview.impressions + googleOverview.impressions) || 500000,
      clicks: (metaOverview.clicks + googleOverview.clicks) || 12000,
      leadsCRM: totalLeadsCRM || 800,
      demos: Math.round(totalLeadsCRM * 0.35) || 280,
      enrolled: enrolledTotal || 28,
      spend: totalSpend || 240000
    },
    meta: {
      impressions: metaOverview.impressions || 350000,
      clicks: metaOverview.clicks || 8000,
      leadsCRM: metaLeads.length || 500,
      demos: Math.round(metaLeads.length * 0.35) || 175,
      enrolled: metaLeads.filter(l => l.isEnrolled).length || 15,
      spend: metaOverview.spend || 150000
    },
    google: {
      impressions: googleOverview.impressions || 150000,
      clicks: googleOverview.clicks || 4000,
      leadsCRM: googleLeads.length || 300,
      demos: Math.round(googleLeads.length * 0.35) || 105,
      enrolled: googleLeads.filter(l => l.isEnrolled).length || 13,
      spend: googleOverview.spend || 90000
    }
  };

  console.log('--- FUNNEL PAYLOAD ---');
  console.log(JSON.stringify(funnel, null, 2));
}

run();
