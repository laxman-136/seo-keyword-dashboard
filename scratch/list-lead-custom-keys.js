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

    const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=30`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: { status: 'Enrolled' } })
    });
    const res = await response.json();
    
    if (res.data && res.data.length > 0) {
      const allKeys = new Set();
      res.data.forEach(lead => {
        if (lead.fields) {
          Object.keys(lead.fields).forEach(key => allKeys.add(key));
        }
      });
      console.log('All custom field keys found across last 30 enrolled leads:');
      console.log(Array.from(allKeys).sort());

      // Print first 5 enrolled leads' payment-related values for comparison
      console.log('\nPayment values on first 5 enrolled leads:');
      res.data.slice(0, 5).forEach((lead, index) => {
        console.log(`\n[Lead ${index+1}] Name: ${lead.fields.name}`);
        console.log(`- course_fee: "${lead.fields.course_fee}"`);
        console.log(`- amount_paid: "${lead.fields.amount_paid}"`);
        console.log(`- amount_paid_emi_1: "${lead.fields.amount_paid_emi_1 || lead.fields.amountpaidemi1 || 'N/A'}"`);
        console.log(`- amount_to_be_paid_emi_2: "${lead.fields.amount_to_be_paid_emi_2 || lead.fields.amounttobepaidemi2 || 'N/A'}"`);
      });

    } else {
      console.log('No enrolled leads found.');
    }

  } catch (err) {
    console.error(err);
  }
}

run();
