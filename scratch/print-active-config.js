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
    const { data: config, error } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
    if (error) {
      console.error(error);
      return;
    }
    if (!config) {
      console.log('No active configuration found');
      return;
    }

    console.log('Active Configuration Credentials Check:');
    console.log('google_customer_id:', config.google_customer_id ? 'Configured' : 'MISSING');
    console.log('google_client_id:', config.google_client_id ? 'Configured' : 'MISSING');
    console.log('google_client_secret:', config.google_client_secret ? 'Configured' : 'MISSING');
    console.log('google_refresh_token:', config.google_refresh_token ? 'Configured' : 'MISSING');
    console.log('google_developer_token:', config.google_developer_token ? 'Configured' : 'MISSING');
    console.log('google_manager_id:', config.google_manager_id ? 'Configured' : 'MISSING');
    
    console.log('\nValues:');
    console.log('google_customer_id:', config.google_customer_id);
    console.log('google_developer_token:', config.google_developer_token);
    console.log('google_manager_id:', config.google_manager_id);
  } catch (err) {
    console.error(err);
  }
}

run();
