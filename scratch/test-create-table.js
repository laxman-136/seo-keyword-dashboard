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
    // Attempt 1: Check if channel_budgets already exists
    const { data: selectData, error: selectError } = await supabase.from('channel_budgets').select('*').limit(1);
    if (!selectError) {
      console.log('channel_budgets table already exists!');
      return;
    }
    console.log('channel_budgets table check returned:', selectError.message);

    // Attempt 2: Try calling custom RPC to execute SQL (sometimes named exec_sql, run_sql, sql)
    const sql = `
      CREATE TABLE IF NOT EXISTS public.channel_budgets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        month TEXT NOT NULL,
        channel TEXT NOT NULL,
        budget NUMERIC NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(month, channel)
      );
    `;

    const rpcs = ['exec_sql', 'run_sql', 'sql', 'execute_sql'];
    let success = false;
    for (const rpcName of rpcs) {
      console.log(`Trying RPC: ${rpcName}...`);
      const { data, error } = await supabase.rpc(rpcName, { sql_query: sql, query: sql, sql });
      if (!error) {
        console.log(`Successfully created table using RPC: ${rpcName}`);
        success = true;
        break;
      }
      console.log(`RPC ${rpcName} failed:`, error.message);
    }

    if (!success) {
      console.log('Could not create table via RPC. We will need to check if there is an alternative storage (e.g. Google Sheets or configuration settings).');
    }

  } catch (err) {
    console.error(err);
  }
}

run();
