// scratch/test-real-courses.js
const { createClient } = require('@supabase/supabase-js');
const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local not found');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
}

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    console.log('Fetching active configuration...');
    const { data: config } = await supabase
      .from('configurations')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    const devToken = config.google_developer_token;
    const clientId = config.google_client_id;
    const clientSecret = config.google_client_secret;
    const refreshToken = config.google_refresh_token;
    const customerId = config.google_customer_id;
    const managerId = config.google_manager_id;
    const metaAccountId = config.meta_ad_account_id;
    const metaAccessToken = config.meta_access_token;

    console.log('Fetching Google Campaigns...');
    let googleCampaigns = [];
    if (devToken && clientId && clientSecret && refreshToken && customerId) {
      const client = new GoogleAdsApi({
        client_id: clientId,
        client_secret: clientSecret,
        developer_token: devToken,
      });
      const customer = client.Customer({
        customer_id: customerId.replace(/-/g, ''),
        refresh_token: refreshToken,
        login_customer_id: managerId ? managerId.replace(/-/g, '') : undefined,
      });

      const query = `
        SELECT campaign.id, campaign.name, metrics.cost_micros 
        FROM campaign 
        WHERE campaign.status IN ('ENABLED', 'PAUSED') 
          AND segments.date BETWEEN '2026-05-01' AND '2026-06-09'
      `;
      const rows = await customer.query(query);
      googleCampaigns = rows.map(r => ({
        name: r.campaign?.name || '',
        spend: (r.metrics?.cost_micros || 0) / 1000000
      }));
    }

    console.log('Fetching Meta Campaigns...');
    let metaCampaigns = [];
    if (metaAccountId && metaAccessToken) {
      const url = `https://graph.facebook.com/v19.0/${metaAccountId}/campaigns?fields=name,insights.time_range({"since":"2026-05-01","until":"2026-06-09"}){spend}&limit=100`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${metaAccessToken}` } });
      if (res.ok) {
        const json = await res.json();
        metaCampaigns = (json.data || []).map(c => ({
          name: c.name || '',
          spend: Number(c.insights?.data?.[0]?.spend || 0)
        }));
      }
    }

    const classifyCourse = (name) => {
      const n = name.toLowerCase();
      if (n.includes('scm') || n.includes('supply chain') || n.includes('logistics') || n.includes('wms') || n.includes('manufacturing') || n.includes('ppm') || n.includes('pmp') || n.includes('otm') || n.includes('warehouse') || n.includes('tms')) {
        return 'Oracle Fusion SCM';
      }
      if (n.includes('hcm') || n.includes('human capital') || n.includes('payroll') || n.includes('talent')) {
        return 'Oracle Fusion HCM';
      }
      if (n.includes('financial') || n.includes('finance') || n.includes('accounting') || n.includes('gl') || n.includes('ap') || n.includes('ar') || n.includes('tax') || n.includes('revenue') || n.includes('ebs')) {
        return 'Oracle Fusion Financials';
      }
      if (n.includes('technical') || n.includes('oic') || n.includes('integration') || n.includes('apex') || n.includes('db') || n.includes('sql') || n.includes('developer') || n.includes('admin')) {
        return 'Oracle Fusion Technical';
      }
      return 'Other Courses';
    };

    const courseSpends = {
      'Oracle Fusion SCM': 0,
      'Oracle Fusion HCM': 0,
      'Oracle Fusion Financials': 0,
      'Oracle Fusion Technical': 0,
      'Other Courses': 0
    };

    googleCampaigns.forEach(c => {
      const cat = classifyCourse(c.name);
      courseSpends[cat] += c.spend;
    });

    metaCampaigns.forEach(c => {
      const cat = classifyCourse(c.name);
      courseSpends[cat] += c.spend;
    });

    console.log('\n--- SPENDS BY COURSE ---');
    console.table(courseSpends);

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
