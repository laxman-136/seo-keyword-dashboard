const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

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

async function testGA4() {
  console.log('Fetching active configuration from Supabase...');
  const { data: config, error } = await supabase
    .from('configurations')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('❌ Supabase error:', error);
    process.exit(1);
  }

  if (!config) {
    console.error('❌ No active configuration found in Supabase.');
    process.exit(1);
  }

  console.log('Found active config:', config.label);
  console.log('GA4 Property ID:', config.ga_property_id);
  console.log('GA4 Client Email:', config.ga_client_email);

  if (!config.ga_property_id || !config.ga_client_email || !config.ga_private_key) {
    console.error('❌ GA4 credentials are not fully set in this active configuration.');
    process.exit(1);
  }

  const formattedPrivateKey = config.ga_private_key.replace(/\\n/g, '\n').trim();

  console.log('Initializing GA4 BetaAnalyticsDataClient...');
  try {
    const client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: config.ga_client_email.trim(),
        private_key: formattedPrivateKey
      }
    });

    console.log('Running quick test report on GA4...');
    const property = config.ga_property_id.startsWith('properties/') ? config.ga_property_id : `properties/${config.ga_property_id}`;
    const [response] = await client.runReport({
      property: property,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      metrics: [{ name: 'sessions' }],
      dimensions: [{ name: 'date' }],
      limit: 1
    });

    console.log('✅ GA4 connection successful!');
    console.log('Rows returned:', response.rows ? response.rows.length : 0);
    if (response.rows && response.rows.length > 0) {
      console.log('Sample Row:', JSON.stringify(response.rows[0]));
    }
  } catch (err) {
    console.error('❌ GA4 connection failed:', err.message);
  }
}

testGA4();
