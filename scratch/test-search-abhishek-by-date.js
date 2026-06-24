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
    const token = config.telecrm_api_token;
    const enterpriseId = config.telecrm_enterprise_id;

    // Abhishek Singh lead_date: 1780684200000 (June 6th)
    const fromMs = 1780684200000 - 1000;
    const toMs = 1780684200000 + 1000;

    const testSearch = async (filters) => {
      const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=10&skip=0`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: filters })
      });
      return response.json();
    };

    console.log('Searching by lead_date...');
    const res1 = await testSearch({ lead_date: { from: fromMs, to: toMs } });
    console.log(`Found by lead_date search: ${res1.data.map(l => l.fields.name).join(', ')}`);

    console.log('Searching by created_on...');
    const res2 = await testSearch({ created_on: { from: 1780729816418 - 1000, to: 1780729816418 + 1000 } });
    console.log(`Found by created_on search: ${res2.data.map(l => l.fields.name).join(', ')}`);

  } catch (err) {
    console.error(err);
  }
}

run();
