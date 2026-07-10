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
    const { data: configs } = await supabase.from('configurations').select('*');
    console.log(`Found ${configs ? configs.length : 0} configurations:`);
    if (configs) {
      configs.forEach((c, i) => {
        console.log(`\nConfig [${i+1}]`);
        console.log(`  ID: ${c.id}`);
        console.log(`  Label: ${c.label}`);
        console.log(`  Is Active: ${c.is_active}`);
        console.log(`  TeleCRM Enterprise ID: ${c.telecrm_enterprise_id}`);
        console.log(`  Google Customer ID: ${c.google_customer_id}`);
        console.log(`  SEO Sheet ID: ${c.seo_sheet_id}`);
        console.log(`  Revenue Sheet ID: ${c.revenue_sheet_id}`);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

run();
