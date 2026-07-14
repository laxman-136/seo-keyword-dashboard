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
      console.log('No active configuration found');
      return;
    }
    const token = config.telecrm_api_token || envVars.TELECRM_API_TOKEN;
    const enterpriseId = config.telecrm_enterprise_id || envVars.TELECRM_ENTERPRISE_ID;

    console.log('Using Token:', token.substring(0, 10) + '...');
    console.log('Using Enterprise ID:', enterpriseId);

    // Test payload
    const payload = {
      fields: {
        name: "Test Import User",
        phone: "919999999991",
        email: "test_import@techleadsit.com",
        course: "SCM",
        status: "Enrolled",
        batch_number: 63
      }
    };

    const tests = [
      {
        name: "App.telecrm.in with Enterprise ID, Auth header",
        url: `https://app.telecrm.in/api/b1/enterprise/${enterpriseId}/autoupdatelead`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      },
      {
        name: "App.telecrm.in with Enterprise ID, Token header",
        url: `https://app.telecrm.in/api/b1/enterprise/${enterpriseId}/autoupdatelead`,
        headers: {
          'x-telecrm-api-token': token,
          'Content-Type': 'application/json'
        }
      },
      {
        name: "Next.telecrm.in with Enterprise ID, autoupdatelead and token header",
        url: `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/autoupdatelead`,
        headers: {
          'x-telecrm-api-token': token,
          'Content-Type': 'application/json'
        }
      }
    ];

    for (const test of tests) {
      console.log(`\nTesting: ${test.name} ...`);
      try {
        const res = await fetch(test.url, {
          method: 'POST',
          headers: test.headers,
          body: JSON.stringify(payload)
        });
        
        console.log('Status:', res.status, res.statusText);
        const text = await res.text();
        console.log('Response:', text);
      } catch (err) {
        console.log('Error:', err.message);
      }
    }

  } catch (err) {
    console.error(err);
  }
}

run();
