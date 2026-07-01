// scratch/view-active-config.js
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

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase URL or Key is missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConfig() {
  try {
    const { data: configs, error } = await supabase
      .from('configurations')
      .select('*');

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    console.log(`Total configurations found: ${configs ? configs.length : 0}`);
    if (configs && configs.length > 0) {
      configs.forEach(config => {
        console.log(`\n--- Config: ${config.label} ---`);
        console.log(`Active: ${config.is_active}`);
        console.log(`SEO Sheet ID: ${config.seo_sheet_id}`);
        console.log(`Leads Sheet ID: ${config.leads_sheet_id}`);
        console.log(`Revenue Sheet ID: ${config.revenue_sheet_id}`);
        console.log(`Meta Account ID: ${config.meta_ad_account_id}`);
        console.log(`Meta Access Token (first 10 chars): ${config.meta_access_token ? config.meta_access_token.substring(0, 10) + '...' : 'None'}`);
        console.log(`Google Customer ID: ${config.google_customer_id}`);
        console.log(`Google Refresh Token (first 10 chars): ${config.google_refresh_token ? config.google_refresh_token.substring(0, 10) + '...' : 'None'}`);
        console.log(`GA4 Property ID: ${config.ga_property_id}`);
        console.log(`GA4 Client Email: ${config.ga_client_email}`);
        console.log(`GA4 Private Key (length): ${config.ga_private_key ? config.ga_private_key.length : 0}`);
        if (config.ga_private_key) {
          console.log(`GA4 Private Key Starts With: ${config.ga_private_key.substring(0, 30)}...`);
        }
        console.log(`TeleCRM API Token: ${config.telecrm_api_token ? config.telecrm_api_token.substring(0, 10) + '...' : 'None'}`);
        console.log(`TeleCRM Enterprise ID: ${config.telecrm_enterprise_id}`);
      });
    } else {
      console.log('No configurations found.');
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

checkConfig();
