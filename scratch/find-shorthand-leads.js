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

function parseAmountRaw(val) {
  if (typeof val === 'number') return val;
  if (!val || typeof val !== 'string') return null;
  const match = val.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

async function run() {
  try {
    const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
    if (!config) {
      console.log('No configuration found');
      return;
    }
    const token = config.telecrm_api_token;
    const enterpriseId = config.telecrm_enterprise_id;

    // Fetch the last 300 Enrolled leads to scan
    const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=300`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: { status: 'Enrolled' } })
    });
    const res = await response.json();
    
    console.log(`Scanning ${res.data ? res.data.length : 0} enrolled leads for shorthand amounts...`);

    const shorthandLeads = [];

    res.data.forEach(lead => {
      const fields = lead.fields || {};
      const courseFeeStr = fields.course_fee || '';
      const amountPaidStr = fields.amount_paid || '';

      const feeNum = parseAmountRaw(courseFeeStr);
      const paidNum = parseAmountRaw(amountPaidStr);

      const isFeeShorthand = feeNum !== null && feeNum > 0 && feeNum < 150; // Let's check under 150 (since course fees are 15,000+)
      const isPaidShorthand = paidNum !== null && paidNum > 0 && paidNum < 150;

      if (isFeeShorthand || isPaidShorthand) {
        shorthandLeads.push({
          name: fields.name,
          email: fields.email,
          phone: fields.phone,
          course: fields.course,
          status: lead.status,
          courseFee: courseFeeStr,
          amountPaid: amountPaidStr,
          feeNum,
          paidNum
        });
      }
    });

    console.log(`\nFound ${shorthandLeads.length} leads with shorthand amounts:`);
    shorthandLeads.forEach((l, idx) => {
      console.log(`[${idx + 1}] Name: ${l.name} | Course: ${l.course} | Course Fee: "${l.courseFee}" | Amount Paid: "${l.amountPaid}" | Email: ${l.email}`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
