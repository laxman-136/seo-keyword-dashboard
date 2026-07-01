const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { google } = require('googleapis');

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

async function checkSiteStatus() {
  const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
  if (!config) {
    console.log('No active configuration found');
    return;
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth: config.api_key });
    const valuesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: config.seo_sheet_id,
      range: 'SiteStatus!A1:Z50'
    });
    const values = valuesRes.data.values;
    if (!values || values.length === 0) {
      console.log('SiteStatus sheet is empty.');
      return;
    }
    console.log(`SiteStatus sheet has ${values.length} rows.`);
    console.log('Headers:', values[0]);
    console.log('First 5 data rows:');
    values.slice(1, 6).forEach((row, idx) => {
      console.log(`Row ${idx+1}:`, row);
    });
  } catch (err) {
    console.error('Error fetching SiteStatus:', err.message);
  }
}

checkSiteStatus();
