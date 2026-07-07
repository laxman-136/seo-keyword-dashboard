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

    console.log('Fetching OAuth Access Token...');
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!tokenRes.ok) {
      console.error('Failed to get access token');
      return;
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const versions = ['v15', 'v16', 'v17', 'v18', 'v19'];
    for (const v of versions) {
      const url = `https://googleads.googleapis.com/${v}/customers/${customerId}:generateKeywordIdeas`;
      
      const headers = {
        'Content-Type': 'application/json',
        'developer-token': devToken,
        'Authorization': `Bearer ${accessToken}`
      };
      if (managerId) {
        headers['login-customer-id'] = managerId;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          language: 'languageConstants/1000',
          geoTargetConstants: ['geoTargetConstants/2356'],
          includeAdultKeywords: false,
          keywordSeed: { keywords: ['oracle'] },
          keywordPlanNetwork: 'GOOGLE_SEARCH'
        })
      });
      console.log(`Version ${v} -> Status: ${res.status}`);
      if (res.status !== 404) {
        const text = await res.text();
        console.log(`Version ${v} response:`, text.substring(0, 300));
      }
    }

  } catch (err) {
    console.error(err);
  }
}

run();
