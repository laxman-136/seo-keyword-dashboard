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

    console.log('Fetching total count...');
    const initUrl = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=1&skip=0`;
    const initRes = await fetch(initUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: {} })
    });
    if (!initRes.ok) {
      throw new Error(`HTTP error ${initRes.status}`);
    }
    const initData = await initRes.json();
    const totalCount = initData.total_count;
    console.log(`Total leads in TeleCRM: ${totalCount}`);

    const limit = 100;
    const allLeads = [];
    
    // Fetch page by page with retries and concurrency control
    const totalPages = Math.ceil(totalCount / limit);
    console.log(`Need to fetch ${totalPages} pages of 100 leads each...`);

    // Let's do batching of 3 concurrent requests
    const concurrency = 3;
    for (let i = 0; i < totalPages; i += concurrency) {
      const promises = [];
      for (let j = 0; j < concurrency && (i + j) < totalPages; j++) {
        const pageIndex = i + j;
        const skip = pageIndex * limit;
        
        const fetchPageWithRetry = async (attempt = 1) => {
          const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=${limit}&skip=${skip}`;
          try {
            const res = await fetch(url, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ fields: {} })
            });
            if (!res.ok) {
              throw new Error(`HTTP error ${res.status}`);
            }
            const data = await res.json();
            return { pageIndex, data: data.data };
          } catch (err) {
            if (attempt < 3) {
              console.log(`[Warning] Page ${pageIndex} failed (attempt ${attempt}). Retrying in 1s...`);
              await sleep(1000);
              return fetchPageWithRetry(attempt + 1);
            } else {
              throw err;
            }
          }
        };
        promises.push(fetchPageWithRetry());
      }
      
      const results = await Promise.all(promises);
      results.forEach(r => {
        allLeads.push(...r.data);
      });
      
      console.log(`Fetched ${allLeads.length}/${totalCount} leads...`);
      // small delay to prevent spamming
      await sleep(100);
    }

    console.log(`Successfully fetched ${allLeads.length} leads in total.`);
    fs.writeFileSync('scratch/all-telecrm-leads.json', JSON.stringify(allLeads, null, 2));
    console.log('Saved to scratch/all-telecrm-leads.json');

  } catch (err) {
    console.error(err);
  }
}

run();
