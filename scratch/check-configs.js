// scratch/check-configs.js
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Error: Supabase credentials not found in env variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data, error } = await supabase
      .from('configurations')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    if (!data) {
      console.log('⚠️ Warning: No active configuration found in Supabase.');
      return;
    }

    console.log('✅ Active Configuration found:');
    console.log('Label:', data.label);
    console.log('Meta Ad Account ID:', data.meta_ad_account_id ? 'Configured' : 'NOT Configured (NULL)');
    console.log('Meta Access Token:', data.meta_access_token ? 'Configured' : 'NOT Configured (NULL)');
    console.log('Google Client ID:', data.google_client_id ? 'Configured' : 'NOT Configured (NULL)');
    console.log('Google Refresh Token:', data.google_refresh_token ? 'Configured' : 'NOT Configured (NULL)');
    console.log('TeleCRM API Token:', data.telecrm_api_token ? 'Configured' : 'NOT Configured (NULL)');
    console.log('TeleCRM Enterprise ID:', data.telecrm_enterprise_id ? 'Configured' : 'NOT Configured (NULL)');

  } catch (err) {
    console.error('❌ Exception occurred:', err);
  }
}

run();
