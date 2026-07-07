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
    // List tables by querying the postgres schema information via RPC or direct SQL if allowed, 
    // or by trying to select from standard tables we know (like configurations, access_grants).
    const { data: configTable, error: configErr } = await supabase.from('configurations').select('*').limit(1);
    console.log('Configurations table exists:', !configErr);

    const { data: grantsTable, error: grantsErr } = await supabase.from('access_grants').select('*').limit(1);
    console.log('Access Grants table exists:', !grantsErr);

    // Let's try to query public schemas or run a custom query
    const { data, error } = await supabase.rpc('get_tables');
    if (error) {
      console.log('get_tables RPC not found, checking with general queries...');
    } else {
      console.log('Tables:', data);
    }

  } catch (err) {
    console.error(err);
  }
}

run();
