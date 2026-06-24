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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  try {
    const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
    if (!config) {
      console.log('No active configuration found.');
      return;
    }
    const token = config.telecrm_api_token;
    const enterpriseId = config.telecrm_enterprise_id;

    console.log(`Enterprise ID: ${enterpriseId}`);

    const searchLeads = async (filters, limit = 100, skip = 0) => {
      const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=${limit}&skip=${skip}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: filters })
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      return response.json();
    };

    console.log('Fetching all Enrolled leads...');
    let allEnrolled = [];
    let skip = 0;
    const limit = 100;
    while (true) {
      const res = await searchLeads({ status: 'Enrolled' }, limit, skip);
      if (!res.data || res.data.length === 0) break;
      allEnrolled.push(...res.data);
      if (res.data.length < limit || allEnrolled.length >= res.total_count) break;
      skip += limit;
    }

    console.log(`Fetched ${allEnrolled.length} enrolled leads.`);

    // Filter leads where course_enrollment_date is not updated and statusChangeTimestamp exists
    const targets = [];
    for (const lead of allEnrolled) {
      const fields = lead.fields || {};
      
      let hasEnrollmentField = false;
      if (fields.course_enrollment_date !== undefined && fields.course_enrollment_date !== null && fields.course_enrollment_date !== '') {
        hasEnrollmentField = true;
      } else {
        for (const [k, v] of Object.entries(fields)) {
          if (k.toLowerCase().includes('enrollment') || k.toLowerCase().includes('enrolled')) {
            if (v && !isNaN(Number(v))) {
              hasEnrollmentField = true;
              break;
            }
          }
        }
      }

      const statusChangeVal = lead.leadMetaData?.statusChangeTimestamp;

      if (!hasEnrollmentField && statusChangeVal) {
        targets.push({
          id: lead.id,
          name: fields.name || 'Unnamed',
          enrollmentDate: statusChangeVal
        });
      }
    }

    console.log(`Found ${targets.length} leads that need enrollment date updates.`);

    if (targets.length === 0) {
      console.log('All enrolled leads are already updated!');
      return;
    }

    // Load progress state if exists
    const statePath = path.join(__dirname, 'bulk-enrollment-update-state.json');
    let completedIds = new Set();
    if (fs.existsSync(statePath)) {
      try {
        const savedState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        completedIds = new Set(savedState.completedIds || []);
        console.log(`Resuming: ${completedIds.size} leads already updated in previous attempts.`);
      } catch (e) {
        console.log('Could not load existing state, starting fresh.');
      }
    }

    const leadsToProcess = targets.filter(t => !completedIds.has(t.id));
    console.log(`Remaining leads to process: ${leadsToProcess.length}`);

    if (leadsToProcess.length === 0) {
      console.log('All target leads are already updated!');
      return;
    }

    const concurrency = 5; 
    let count = completedIds.size;
    const total = targets.length;

    console.log(`Starting bulk update process with concurrency of ${concurrency}...`);
    
    for (let i = 0; i < leadsToProcess.length; i += concurrency) {
      const batch = leadsToProcess.slice(i, i + concurrency);
      
      const promises = batch.map(async (lead) => {
        const leadId = lead.id;
        const enrollmentDate = lead.enrollmentDate;
        
        const updateWithRetry = async (attempt = 1) => {
          const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/${leadId}`;
          try {
            const res = await fetch(url, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                fields: { course_enrollment_date: enrollmentDate }
              })
            });
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`);
            }
            return true;
          } catch (err) {
            if (attempt < 3) {
              console.warn(`[Retry] Retrying update for lead ${leadId} (attempt ${attempt + 1})...`);
              await sleep(1000);
              return updateWithRetry(attempt + 1);
            } else {
              throw err;
            }
          }
        };

        try {
          await updateWithRetry();
          completedIds.add(leadId);
          return { id: leadId, success: true };
        } catch (err) {
          console.error(`❌ Failed to update lead ${lead.name} (${leadId}):`, err.message);
          return { id: leadId, success: false };
        }
      });

      await Promise.all(promises);
      count += batch.length;

      // Save state progress after every batch
      fs.writeFileSync(statePath, JSON.stringify({ completedIds: Array.from(completedIds) }, null, 2));

      console.log(`[Progress] Updated ${count}/${total} leads (${((count/total)*100).toFixed(1)}%)...`);

      // Throttle delay to prevent hitting rate limits
      await sleep(150);
    }

    console.log(`\n🎉 Bulk update completed! ${completedIds.size}/${total} leads successfully updated.`);
    
    // Clean up state file on success
    if (fs.existsSync(statePath)) {
      fs.unlinkSync(statePath);
    }

  } catch (err) {
    console.error('Error running bulk updates:', err);
  }
}

run();
