// scratch/pull-sources.js
const fs = require('fs');
const path = require('path');

// Basic dotenv parser to read from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });
  return env;
}

// Map of source patterns to channels (matching SOURCE_TO_CHANNEL in telecrm-api)
const SOURCE_TO_CHANNEL = {
  'Organic':                    'Organic',
  'Organic- Chatbot':           'Organic',
  'Website':                    'Website',
  'Referral':                   'Referral',
  'Gads-Lead Form-SCM':         'Google Ads',
  'Gads-Lead Form-HCM':         'Google Ads',
  'Gads-Lead Form-Technical':   'Google Ads',
  'googletech':                 'Google Ads',
  'googlescm':                  'Google Ads',
  'Facebook - SCM':             'Meta Ads',
  'Facebook - HCM':             'Meta Ads',
  'Facebook - Technical':       'Meta Ads',
  'Facebook - Financials':      'Meta Ads',
  'facebook':                   'Meta Ads',
  'Website-fb':                 'Meta Ads',
  'SOT':                        'SOT',
  'chatgpt':                    'LLM',
  'perplexity':                 'LLM',
  'openai':                     'LLM',
  'claude':                     'LLM',
  'chatgpt-chatbot':           'LLM',
  'perplexity-ai':              'LLM',
  'LLM':                        'LLM',
};

function detectLeadChannel(lead_source, fbclid, gclid) {
  if (fbclid) return 'Meta Ads';
  if (gclid) return 'Google Ads';
  
  if (lead_source) {
    const lower = lead_source.toLowerCase();
    if (lower.includes('gads') || lower.includes('google')) {
      return 'Google Ads';
    }
    if (lower.includes('facebook') || lower.includes('fb') || lower.includes('instagram') || lower.includes('meta')) {
      return 'Meta Ads';
    }
    if (lower.includes('chatgpt') || lower.includes('chat gpt') || lower.includes('gpt') || lower.includes('perplexity') || lower.includes('openai') || lower.includes('claude') || lower.includes('llm')) {
      return 'LLM';
    }
    return SOURCE_TO_CHANNEL[lead_source] || 'Other';
  }
  return 'Other';
}

async function main() {
  const env = loadEnv();
  
  // Parse command line arguments
  const args = {};
  process.argv.slice(2).forEach(val => {
    if (val.startsWith('--token=')) args.token = val.split('=')[1];
    if (val.startsWith('--enterpriseId=')) args.enterpriseId = val.split('=')[1];
  });

  let token = args.token || env.TELECRM_API_TOKEN || process.env.TELECRM_API_TOKEN;
  let enterpriseId = args.enterpriseId || env.TELECRM_ENTERPRISE_ID || process.env.TELECRM_ENTERPRISE_ID;

  const supabaseUrl = env.SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey && (!token || !enterpriseId)) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('configurations')
        .select('*')
        .eq('is_active', true)
        .limit(1);

      if (data && data[0]) {
        token = data[0].telecrm_api_token || token;
        enterpriseId = data[0].telecrm_enterprise_id || enterpriseId;
        console.log(`Loaded credentials from active Supabase config "${data[0].label}"`);
      } else if (error) {
        console.error('Failed to query Supabase configurations:', error);
      }
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err.message);
    }
  }

  if (!token || !enterpriseId) {
    console.error('\x1b[31mError: TeleCRM credentials not found.\x1b[0m');
    console.log('\nPlease provide them via:');
    console.log('  1. Adding TELECRM_API_TOKEN and TELECRM_ENTERPRISE_ID to your .env.local file');
    console.log('  2. Or passing them directly to the command:');
    console.log('     node scratch/pull-sources.js --token=YOUR_TOKEN --enterpriseId=YOUR_ID\n');
    process.exit(1);
  }

  console.log('🔌 Connecting to TeleCRM Search API...');
  const limit = 100;
  let skip = 0;
  let hasMore = true;
  
  const uniqueSources = {};
  let totalLeadsCount = 0;

  console.log(`Enterprise ID: "${enterpriseId}" (length: ${enterpriseId?.length})`);
  console.log(`Token: "${token?.substring(0, 10)}..." (length: ${token?.length})`);

  try {
    while (hasMore && skip < 1000) { // Limit safety check to max 1000 leads
      const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=${limit}&skip=${skip}`;
      console.log(`Fetching URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: {} })
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}: ${response.statusText}`);
      }

      const payload = await response.json();
      const leads = payload.data || [];
      totalLeadsCount = payload.total_count || totalLeadsCount;

      if (leads.length === 0) {
        hasMore = false;
        break;
      }

      leads.forEach(lead => {
        const source = lead.fields?.lead_source_1 || '(no source label)';
        const fbclid = lead.fields?.fbclid;
        const gclid = lead.fields?.google_gcl_id || lead.fields?.gclid;
        const channel = detectLeadChannel(lead.fields?.lead_source_1, fbclid, gclid);

        if (!uniqueSources[source]) {
          uniqueSources[source] = { count: 0, mappedChannel: channel };
        }
        uniqueSources[source].count++;
      });

      skip += limit;
      if (leads.length < limit) {
        hasMore = false;
      }
    }

    console.log(`\n\x1b[32m✔ Successfully retrieved and analyzed leads from TeleCRM (Matched against latest mappings):\x1b[0m`);
    console.log('----------------------------------------------------------------------');
    console.log(`%-30s | %-12s | %-20s`.replace('%-30s', 'Lead Source Label'.padEnd(30)).replace('%-12s', 'Lead Count'.padEnd(12)).replace('%-20s', 'Mapped Channel'));
    console.log('----------------------------------------------------------------------');
    
    Object.entries(uniqueSources)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([source, data]) => {
        let channelColor = '\x1b[0m'; // default
        if (data.mappedChannel === 'Google Ads') channelColor = '\x1b[33m'; // Yellow
        else if (data.mappedChannel === 'Meta Ads') channelColor = '\x1b[34m'; // Blue
        else if (data.mappedChannel === 'LLM') channelColor = '\x1b[35m'; // Pink/Magenta
        else if (data.mappedChannel === 'Organic') channelColor = '\x1b[32m'; // Green

        console.log(`${source.padEnd(30)} | ${data.count.toString().padEnd(12)} | ${channelColor}${data.mappedChannel}\x1b[0m`);
      });
      
    console.log('----------------------------------------------------------------------');
    console.log(`Total Leads Scanned: ${skip}`);
    console.log(`Unique Source Labels Found: ${Object.keys(uniqueSources).length}\n`);

  } catch (err) {
    console.error('\x1b[31mError fetching sources from TeleCRM:\x1b[0m', err.message);
  }
}

main();
