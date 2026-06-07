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
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching configs from Supabase...');
  try {
    const { data: configs, error } = await supabase.from('configs').select('*');
    if (error) {
      // Maybe table name is different, let's check
      console.error('Error fetching from configs:', error);
      
      // Let's try "active_config" or similar
      const { data: active, error: err2 } = await supabase.from('settings').select('*');
      if (err2) console.error('Error fetching from settings:', err2);
      else console.log('Settings data:', active);
    } else {
      console.log('Found configs:', JSON.stringify(configs, null, 2));
    }
  } catch (err) {
    console.error('Catch error:', err);
  }
}

run();
