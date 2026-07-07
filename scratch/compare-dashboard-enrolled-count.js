const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { getChannelBreakdown } = require('../lib/telecrm-api');

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

    // June 1st to June 30th, 2026
    const fromDate = new Date('2026-06-01T00:00:00.000+05:30');
    const toDate = new Date('2026-06-30T23:59:59.999+05:30');

    // Run the actual getChannelBreakdown from lib/telecrm-api.ts
    const channels = await getChannelBreakdown({ from: fromDate, to: toDate }, token, enterpriseId, true);
    console.log('\n--- Channel Breakdown Output ---');
    console.log(channels);

    // Let's copy the code of getChannelBreakdown here to print the actual lead details of the matched leads
    const { getAllLeadsForPeriod, detectLeadChannel, getStartOfDay, getEndOfDay } = require('../lib/telecrm-api');
    const leads = await getAllLeadsForPeriod({ from: fromDate, to: toDate }, token, enterpriseId, true);

    const fromTime = getStartOfDay(fromDate).getTime();
    const toTime = getEndOfDay(toDate).getTime();

    const matchedLeads = [];

    leads.forEach(lead => {
      const channel = detectLeadChannel(lead);
      if (channel !== 'Google Ads') return;

      const leadDateVal = lead.fields?.lead_date || lead.fields?.created_on;
      const isLeadInPeriod = !!(leadDateVal && leadDateVal >= fromTime && leadDateVal <= toTime);
      
      const isEnrolled = lead.status === 'Enrolled';
      const enrollDateVal = lead.fields?.course_enrollment_date;
      const isEnrolledInPeriod = !!(isEnrolled && enrollDateVal && enrollDateVal >= fromTime && enrollDateVal <= toTime);
      
      let wasEnrolled = false;
      if (isLeadInPeriod) {
        if (isEnrolled && isEnrolledInPeriod) {
          wasEnrolled = true;
        }
      } else if (isEnrolledInPeriod) {
        wasEnrolled = true;
      }

      if (wasEnrolled) {
        matchedLeads.push(lead);
      }
    });

    console.log(`\n--- Matched Enrolled Google Ads Leads in getChannelBreakdown (${matchedLeads.length}) ---`);
    matchedLeads.forEach((l, idx) => {
      const leadDate = l.fields?.lead_date ? new Date(l.fields.lead_date).toLocaleDateString('en-IN') : 'N/A';
      const enrollDate = l.fields?.course_enrollment_date ? new Date(l.fields.course_enrollment_date).toLocaleDateString('en-IN') : 'N/A';
      console.log(`[${idx + 1}] ID: ${l.id} | Name: ${l.fields?.name} | Email: ${l.fields?.email} | Lead Date: ${leadDate} | Enroll Date: ${enrollDate} | Source: ${l.fields?.lead_source_1}`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
