// scripts/get-all-grants.js
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
  console.log('Fetching all access_grants sorted by created_at desc...');
  try {
    const { data, error } = await supabase.from('access_grants').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching grants:', error);
    } else {
      console.log(`Found ${data.length} grants:`);
      data.forEach((g, idx) => {
        console.log(`[${idx}] Created: ${g.created_at}`);
        console.log(`    Recipient: ${g.recipient_email}`);
        console.log(`    Label: ${g.label}`);
        console.log(`    Sheet ID: ${g.sheet_id}`);
        console.log(`    SEO Sheet ID: ${g.seo_sheet_id}`);
        console.log(`    Leads Sheet ID: ${g.leads_sheet_id}`);
        console.log(`    Revenue Sheet ID: ${g.revenue_sheet_id}`);
        console.log(`    API Key: ${g.api_key}`);
      });
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

run();
