// scratch/test-real-retargeting.js
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
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.cost_micros,
          metrics.conversions
        FROM campaign
        WHERE campaign.status IN ('ENABLED', 'PAUSED')
          AND segments.date BETWEEN '2026-05-01' AND '2026-06-09'
      `;
      const rows = await customer.query(query);
      googleCampaigns = rows.map(r => ({
        name: r.campaign?.name || '',
        spend: (r.metrics?.cost_micros || 0) / 1000000,
        conversions: r.metrics?.conversions || 0,
        platform: 'google'
      }));
    }

    console.log('Fetching Meta Campaigns...');
    let metaCampaigns = [];
    if (metaAccountId && metaAccessToken) {
      const url = `https://graph.facebook.com/v19.0/${metaAccountId}/campaigns?fields=name,status,insights.time_range({"since":"2026-05-01","until":"2026-06-09"}){spend,actions}&limit=100`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${metaAccessToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        metaCampaigns = (json.data || []).map(c => {
          const ins = c.insights?.data?.[0] || {};
          const spend = Number(ins.spend || 0);
          return {
            name: c.name || '',
            spend,
            conversions: 0, // we can parse actions if needed
            platform: 'meta'
          };
        });
      } else {
        console.error('Failed to fetch Meta campaigns:', await res.text());
      }
    }

    const allCampaigns = [...googleCampaigns, ...metaCampaigns];
    console.log(`\nFetched ${allCampaigns.length} total campaigns.`);

    const segmented = allCampaigns.map(c => {
      const nameLower = c.name.toLowerCase();
      let segment = 'Cold';
      if (nameLower.includes('retargeting') || nameLower.includes('remarketing') || nameLower.includes('rt') || nameLower.includes('rm') || nameLower.includes('warm') || nameLower.includes('hot') || nameLower.includes('pixel') || nameLower.includes('visitor') || nameLower.includes('custom') || nameLower.includes('reengage')) {
        segment = 'Hot';
      } else if (nameLower.includes('lookalike') || nameLower.includes('lal') || nameLower.includes('lla') || nameLower.includes('similar') || nameLower.includes('mid')) {
        segment = 'Warm';
      }
      return {
        name: c.name,
        spend: c.spend,
        segment,
        platform: c.platform
      };
    });

    console.log('\n--- CAMPAIGN SEGMENTATION ---');
    console.table(segmented);

    // Sum spends
    const summary = {
      Cold: { count: 0, spend: 0 },
      Warm: { count: 0, spend: 0 },
      Hot: { count: 0, spend: 0 }
    };

    segmented.forEach(c => {
      summary[c.segment].count++;
      summary[c.segment].spend += c.spend;
    });

    console.log('\n--- SPEND BY SEGMENT ---');
    console.table(summary);

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
