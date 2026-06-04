// scripts/inspect-columns.js
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Querying table structure for access_grants...');
  try {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'access_grants' });
    if (error) {
      // If RPC doesn't exist, let's run a generic select from information_schema via a dummy SQL query if possible
      console.log('RPC failed, trying raw query if possible (or checking the table select * keys again)...');
      const { data: rows, error: selectErr } = await supabase.from('access_grants').select('*').limit(1);
      if (selectErr) {
        console.error('Select error:', selectErr);
      } else if (rows && rows.length > 0) {
        console.log('Keys in access_grants row:', Object.keys(rows[0]));
      } else {
        console.log('No rows returned to inspect keys.');
      }
    } else {
      console.log('Columns:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
