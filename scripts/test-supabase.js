// scripts/test-supabase.js
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
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (truncated):', supabaseKey ? supabaseKey.slice(0, 10) + '...' : 'undefined');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching users from Supabase...');
  const start = Date.now();
  try {
    const { data, error } = await supabase.from('users').select('*');
    const duration = Date.now() - start;
    if (error) {
      console.error(`Error after ${duration}ms:`, error);
    } else {
      console.log(`Success in ${duration}ms! Found ${data.length} users:`);
      data.forEach(u => {
        console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Status: ${u.status}`);
      });
    }
  } catch (err) {
    console.error('Catch error:', err);
  }
}

run();
