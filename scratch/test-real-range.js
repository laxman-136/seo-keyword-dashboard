// scratch/test-real-range.js
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

function getStartOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function getEndOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
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

    const testSearch = async (filters) => {
      const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=100&skip=0`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: filters })
      });
      return response;
    };

    const now = new Date()
    const oldestMonthIdx = now.getMonth() - (12 - 1)
    const rangeStart = new Date(now.getFullYear(), oldestMonthIdx, 1)
    const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const fromMs = getStartOfDay(rangeStart).getTime()
    const toMs = getEndOfDay(rangeEnd).getTime()

    // Partition
    const timeChunks = []
    let currentStart = fromMs
    const step = 30 * 24 * 60 * 60 * 1000
    while (currentStart < toMs) {
      const currentEnd = Math.min(currentStart + step, toMs)
      timeChunks.push({ from: currentStart, to: currentEnd })
      currentStart = currentEnd + 1
    }

    console.log(`Running test for ${timeChunks.length} chunks with concurrency limit 3...`);
    const startTime = Date.now();
    const leads = [];
    const concurrencyLimit = 3;

    for (let i = 0; i < timeChunks.length; i += concurrencyLimit) {
      const batch = timeChunks.slice(i, i + concurrencyLimit);
      console.log(`Processing batch starting at index ${i}...`);

      const batchPromises = batch.map(async (chunk, batchIdx) => {
        const chunkId = i + batchIdx;
        const chunkLeads = [];
        let skip = 0;
        const limit = 100;
        const searchFilters = { created_on: { from: chunk.from, to: chunk.to } };

        try {
          const apiRes = await testSearch(searchFilters);
          if (apiRes.ok) {
            const data = await apiRes.json();
            chunkLeads.push(...data.data);
            console.log(`Chunk ${chunkId + 1} page 1 finished: status ${apiRes.status}`);
          } else {
            console.log(`Chunk ${chunkId + 1} page 1 failed: status ${apiRes.status}`);
          }
        } catch (err) {
          console.log(`Chunk ${chunkId + 1} page 1 exception:`, err.message);
        }
        return chunkLeads;
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(res => leads.push(...res));
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`Finished test in ${duration} seconds. Total leads fetched (page 1 only): ${leads.length}`);

  } catch (err) {
    console.error(err);
  }
}

run();
