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

    const leadId = '69c4d7f622556424e249f3d4'; // Ravi
    const createdOn = 1774508022001; // Ravi's created_on timestamp

    console.log(`Attempting to update lead ${leadId} with lead_date = ${createdOn} (${new Date(createdOn).toISOString()})...`);

    const updateUrl = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/${leadId}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: { lead_date: createdOn }
      })
    });

    if (!updateResponse.ok) {
      throw new Error(`Update API failed: HTTP ${updateResponse.status} - ${await updateResponse.text()}`);
    }

    const updateData = await updateResponse.json();
    console.log('Update API response:', JSON.stringify(updateData, null, 2));

    // Fetch the lead online to confirm it was updated
    console.log('Fetching lead online to verify update...');
    const searchUrl = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=10&skip=0`;
    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: { email: 'ravinderpal7878@gmail.com' } })
    });

    const searchData = await searchResponse.json();
    const updatedLead = searchData.data.find(l => l.id === leadId);
    console.log('Online Lead Date after update:', updatedLead?.fields?.lead_date);
    console.log('Updated Lead details:', JSON.stringify(updatedLead?.fields, null, 2));

  } catch (err) {
    console.error('Error testing single update:', err);
  }
}

run();
