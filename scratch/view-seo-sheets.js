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

async function checkSheets() {
  const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
  if (!config) {
    console.log('No active configuration found');
    return;
  }
  console.log('Active Configuration:', config.label);
  console.log('SEO Sheet ID:', config.seo_sheet_id);
  console.log('API Key:', config.api_key);

  if (!config.seo_sheet_id || !config.api_key) {
    console.log('SEO Sheet ID or API Key is missing in active configuration.');
    return;
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth: config.api_key });
    const response = await sheets.spreadsheets.get({
      spreadsheetId: config.seo_sheet_id
    });
    
    console.log('\nSpreadsheet Title:', response.data.properties.title);
    console.log('\nSheets list:');
    for (const sheet of response.data.sheets) {
      const title = sheet.properties.title;
      console.log(`- ${title} (gridProperties: ${JSON.stringify(sheet.properties.gridProperties)})`);
      try {
        const valuesRes = await sheets.spreadsheets.values.get({
          spreadsheetId: config.seo_sheet_id,
          range: `${title}!A:C`
        });
        console.log(`  Fetched rows count: ${valuesRes.data.values ? valuesRes.data.values.length : 0}`);
      } catch (err) {
        console.log(`  Failed to fetch values: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Error connecting to Google Sheets:', err.message);
  }
}

checkSheets();
