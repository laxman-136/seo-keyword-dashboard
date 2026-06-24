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

const STATUS_TO_CATEGORY = {
  'Enrolled':                                    'Enrolled',
  'Interested to join the Demo':                 'High Potential',
  'Potential Lead 100':                          'High Potential',
  'Demo Attended':                               'High Potential',
  '60-80 Potential':                             'High Potential',
  'Looking for Next batch':                      'Medium Potential',
  '50 % Potential':                              'Medium Potential',
  'below 50 % Potential':                        'Medium Potential',
  'Fresh':                                       'Fresh/Unqualified',
  'Call not answered and Shared the Data':       'Fresh/Unqualified',
  'Number is not working and sent an email':     'Fresh/Unqualified',
  'Not Interested':                              'Low/Cold',
  'Junk Lead':                                   'Low/Cold',
  'Different Course':                            'Low/Cold',
  'Wrong Number &Number Not working':            'Low/Cold',
  'Lost':                                        'Low/Cold'
};

function getLeadAgeInDays(lead, nowTime) {
  const created = lead.fields?.lead_date || lead.fields?.created_on || nowTime;
  return (nowTime - created) / (1000 * 60 * 60 * 24);
}

async function run() {
  try {
    const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
    const token = config.telecrm_api_token;
    const enterpriseId = config.telecrm_enterprise_id;

    // Load cached leads
    const allLeads = JSON.parse(fs.readFileSync(path.join(__dirname, 'all-telecrm-leads.json'), 'utf8'));

    const now = new Date(); // Current time
    const fromDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const toDate = now;

    console.log(`Checking with current time: ${now.toLocaleString('en-IN')}`);
    console.log(`Range: ${fromDate.toLocaleString('en-IN')} to ${toDate.toLocaleString('en-IN')}`);

    const periodLeads = allLeads.filter(lead => {
      const dateVal = lead.fields?.lead_date || lead.fields?.created_on;
      return dateVal && dateVal >= fromDate.getTime() && dateVal <= toDate.getTime();
    });

    const pendingLeads = periodLeads.filter(lead => {
      if (lead.status === 'Junk Lead') return true;
      const cat = STATUS_TO_CATEGORY[lead.status] || 'Fresh/Unqualified';
      return cat !== 'Enrolled' && cat !== 'Low/Cold';
    });

    console.log(`Pending leads: ${pendingLeads.length}`);

    const buckets = [
      { bucketLabel: '🔥 Hot (< 7 days)', count: 0, min: 0, max: 7 },
      { bucketLabel: '⚡ Warm (7-30 days)', count: 0, min: 7, max: 30 },
      { bucketLabel: '🟡 Cooling (30-90 days)', count: 0, min: 30, max: 90 },
      { bucketLabel: '🔴 Cold (90-180 days)', count: 0, min: 90, max: 180 },
      { bucketLabel: '⚫ Dead (> 180 days)', count: 0, min: 180, max: 9999 }
    ];

    pendingLeads.forEach(lead => {
      if (lead.status === 'Junk Lead') {
        buckets[4].count++;
        return;
      }
      const age = getLeadAgeInDays(lead, now.getTime());
      for (const bucket of buckets) {
        if (age >= bucket.min && age < bucket.max) {
          bucket.count++;
          break;
        }
      }
    });

    buckets.forEach(b => {
      console.log(`  - ${b.bucketLabel}: ${b.count}`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
