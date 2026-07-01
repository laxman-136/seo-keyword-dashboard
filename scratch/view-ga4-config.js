const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '../../../../scratch/seo-keyword-dashboard/.env.local');
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

async function checkGA4() {
  const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
  if (!config) {
    console.log('No active configuration found');
    return;
  }
  console.log('Active Configuration:', config.label);
  console.log('GA4 Property ID:', config.ga_property_id);
  console.log('GA4 Client Email:', config.ga_client_email);
  console.log('GA4 Private Key (length):', config.ga_private_key ? config.ga_private_key.length : 0);
  if (config.ga_private_key) {
    console.log('GA4 Private Key Starts With:', config.ga_private_key.substring(0, 30));
  }
}

checkGA4();
