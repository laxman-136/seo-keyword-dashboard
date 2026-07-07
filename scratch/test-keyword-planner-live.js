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
    const devToken = config.google_developer_token;
    const clientId = config.google_client_id;
    const clientSecret = config.google_client_secret;
    const refreshToken = config.google_refresh_token;
    const customerId = config.google_customer_id.replace(/-/g, '');
    const managerId = config.google_manager_id ? config.google_manager_id.replace(/-/g, '') : null;

    console.log(`Using Customer ID: ${customerId}`);
    console.log(`Using Manager ID: ${managerId}`);

    const { GoogleAdsApi } = await import('google-ads-api');
    
    const client = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: devToken,
    });

    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
      login_customer_id: managerId ? managerId : undefined,
    });

    console.log('Calling customer.keywordPlanIdeas.generateKeywordIdeas...');
    const response = await customer.keywordPlanIdeas.generateKeywordIdeas({
      customer_id: customerId, // pass here
      customerId: customerId,  // pass here too
      language: 'languageConstants/1000', // English
      geo_target_constants: [
        'geoTargetConstants/2356' // India
      ],
      include_adult_keywords: false,
      keyword_seed: {
        keywords: ['oracle hcm cloud training', 'oracle fusion financials online course']
      },
      keyword_plan_network: 'GOOGLE_SEARCH'
    });

    console.log('API Response:', JSON.stringify(response, null, 2));

  } catch (err) {
    console.error('API Error:', err);
  }
}

run();
