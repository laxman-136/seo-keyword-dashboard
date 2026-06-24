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
      console.log('No configuration found');
      return;
    }
    const token = config.telecrm_api_token;
    const enterpriseId = config.telecrm_enterprise_id;

    // Load cached leads
    const allLeadsPath = path.join(__dirname, 'all-telecrm-leads.json');
    if (!fs.existsSync(allLeadsPath)) {
      console.error('All leads cache file not found. Please run check-empty-lead-dates.js first.');
      return;
    }

    const allLeads = JSON.parse(fs.readFileSync(allLeadsPath, 'utf8'));
    
    // Filter leads that have empty lead_date and valid created_on
    const targets = allLeads.filter(l => {
      const ld = l.fields?.lead_date;
      const co = l.fields?.created_on;
      return (ld === null || ld === undefined || ld === '' || ld === 0) && co;
    });

    console.log(`Found ${targets.length} target leads to update.`);

    // Load progress state if exists
    const statePath = path.join(__dirname, 'bulk-update-state.json');
    let completedIds = new Set();
    if (fs.existsSync(statePath)) {
      try {
        const savedState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        completedIds = new Set(savedState.completedIds || []);
        console.log(`Resuming: ${completedIds.size} leads already updated in previous runs.`);
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

    const limit = 5; // Concurrency limit
    let count = completedIds.size;
    const total = targets.length;

    console.log(`Starting update process with concurrency of ${limit}...`);
    
    for (let i = 0; i < leadsToProcess.length; i += limit) {
      const batch = leadsToProcess.slice(i, i + limit);
      const promises = batch.map(async (lead) => {
        const leadId = lead.id;
        const createdOn = lead.fields.created_on;
        
        const updateLeadWithRetry = async (attempt = 1) => {
          const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/${leadId}`;
          try {
            const res = await fetch(url, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                fields: { lead_date: createdOn }
              })
            });
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`);
            }
            return true;
          } catch (err) {
            if (attempt < 3) {
              await sleep(1000);
              return updateLeadWithRetry(attempt + 1);
            } else {
              throw err;
            }
          }
        };

        try {
          await updateLeadWithRetry();
          completedIds.add(leadId);
          return { id: leadId, success: true };
        } catch (err) {
          console.error(`Failed to update lead ${leadId} after 3 attempts:`, err.message);
          return { id: leadId, success: false };
        }
      });

      await Promise.all(promises);
      count += batch.length;

      // Save state progress after every batch
      fs.writeFileSync(statePath, JSON.stringify({ completedIds: Array.from(completedIds) }, null, 2));

      if (count % 100 === 0 || count === total) {
        console.log(`[Progress] Updated ${count}/${total} leads (${((count/total)*100).toFixed(1)}%)...`);
      }

      // Small throttle delay between batches to be safe
      await sleep(100);
    }

    console.log(`Finished bulk update! ${completedIds.size}/${total} leads successfully updated.`);
    
    // Clean up state file on success
    if (fs.existsSync(statePath)) {
      fs.unlinkSync(statePath);
    }

  } catch (err) {
    console.error('Error running bulk updates:', err);
  }
}

run();
