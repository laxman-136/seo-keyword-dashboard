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

    const testSearch = async (filters, limit = 5, skip = 0) => {
      const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=${limit}&skip=${skip}`;
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

    // Oct 2025 date range
    const octStart = new Date('2025-10-01T00:00:00.000+05:30').getTime();
    const octEnd = new Date('2025-10-31T23:59:59.999+05:30').getTime();

    // Nov 2025 date range
    const novStart = new Date('2025-11-01T00:00:00.000+05:30').getTime();
    const novEnd = new Date('2025-11-30T23:59:59.999+05:30').getTime();

    console.log('Querying lead counts for Oct 2025...');
    const octLeadDateRes = await testSearch({ lead_date: { from: octStart, to: octEnd } }, 1);
    const octCreatedRes = await testSearch({ created_on: { from: octStart, to: octEnd } }, 1);
    console.log(`Oct 2025 - lead_date total: ${octLeadDateRes.total_count}, created_on total: ${octCreatedRes.total_count}`);

    console.log('\nQuerying lead counts for Nov 2025...');
    const novLeadDateRes = await testSearch({ lead_date: { from: novStart, to: novEnd } }, 1);
    const novCreatedRes = await testSearch({ created_on: { from: novStart, to: novEnd } }, 1);
    console.log(`Nov 2025 - lead_date total: ${novLeadDateRes.total_count}, created_on total: ${novCreatedRes.total_count}`);

    // Let's grab a few samples from Oct 2025 to see where they came from
    const samples = await testSearch({ created_on: { from: octStart, to: octEnd } }, 10);
    console.log('\nOct 2025 Samples:');
    console.log(samples.data.map(l => ({
      name: l.fields?.name,
      source: l.fields?.lead_source_1,
      createdOn: new Date(l.fields?.created_on).toLocaleDateString(),
      leadDate: l.fields?.lead_date ? new Date(l.fields.lead_date).toLocaleDateString() : 'None',
      employeeid: l.employeeid
    })));

  } catch (err) {
    console.error(err);
  }
}

run();
