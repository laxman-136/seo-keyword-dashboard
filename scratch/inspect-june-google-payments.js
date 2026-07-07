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

    const emails = [
      'sampadask028@gmail.com',
      'tarunsai.talapaneni@gmail.com',
      'mohammedsuhail.erp@gmail.com',
      'subhanisiddiqua25@gmail.com',
      'vamsisuraiah284@gmail.com',
      'vishwakumbh@gmail.com',
      'abhipillai95@gmail.com',
      'suryaarem17@gmail.com',
      'nareshuk5027@gmail.com'
    ];

    const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search`;
    
    console.log('--- Converted June Google Ads Leads Payment Fields ---');
    for (const email of emails) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: { email } })
      });
      const res = await response.json();
      if (res.data && res.data[0]) {
        const lead = res.data[0];
        const fields = lead.fields || {};
        console.log(`Lead: ${fields.name}`);
        console.log(`  Course: ${fields.course}`);
        console.log(`  Course Fee (actual amount): "${fields.course_fee}"`);
        console.log(`  Amount Paid (amount given): "${fields.amount_paid}"`);
        // print other amount keys if any
        Object.keys(fields).forEach(k => {
          if (k.toLowerCase().includes('amount') || k.toLowerCase().includes('fee') || k.toLowerCase().includes('emi')) {
            if (k !== 'course_fee' && k !== 'amount_paid') {
              console.log(`  ${k}: "${fields[k]}"`);
            }
          }
        });
      }
    }

  } catch (err) {
    console.error(err);
  }
}

run();
