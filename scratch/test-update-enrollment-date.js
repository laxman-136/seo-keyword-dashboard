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

    // We will test updating Purnima Kulkarni
    const leadId = '6a33a6c6c7336c42a09aecf7'; 
    const resolvedEnrollmentDate = 1782207565000; // Status change timestamp for Purnima (2026-06-23 06:59:25 IST)

    console.log(`[Test] Attempting to update lead ${leadId} (Purnima Kulkarni) with course_enrollment_date = ${resolvedEnrollmentDate} (${new Date(resolvedEnrollmentDate).toISOString()})...`);

    const updateUrl = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/${leadId}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: { course_enrollment_date: resolvedEnrollmentDate }
      })
    });

    if (!updateResponse.ok) {
      throw new Error(`Update API failed: HTTP ${updateResponse.status} - ${await updateResponse.text()}`);
    }

    const updateData = await updateResponse.json();
    console.log('Update API response status:', updateResponse.status);
    console.log('Update API response:', JSON.stringify(updateData, null, 2));

    // Fetch the lead online to confirm it was updated
    console.log('\nFetching lead online to verify update...');
    const searchUrl = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=10&skip=0`;
    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: { phone: '916360226292' } })
    });

    const searchData = await searchResponse.json();
    const updatedLead = searchData.data.find(l => l.id === leadId);
    
    if (updatedLead) {
      console.log('✅ Found lead!');
      console.log('Online course_enrollment_date after update:', updatedLead.fields?.course_enrollment_date);
      console.log('All lead fields after update:', JSON.stringify(updatedLead.fields, null, 2));
      
      if (Number(updatedLead.fields?.course_enrollment_date) === resolvedEnrollmentDate) {
        console.log('\n🎉 SUCCESS: The enrollment date was successfully updated in TeleCRM!');
      } else {
        console.log('\n❌ FAILURE: Sourced date does not match.');
      }
    } else {
      console.log('❌ Lead not found in search.');
    }

  } catch (err) {
    console.error('Error testing single update:', err);
  }
}

run();
