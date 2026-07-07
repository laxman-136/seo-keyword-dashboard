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

async function run() {
  try {
    const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
    if (!config) {
      console.log('No configuration found');
      return;
    }
    
    const clientEmail = config.ga_client_email;
    const privateKey = config.ga_private_key ? config.ga_private_key.replace(/\\n/g, '\n') : null;
    const revenueSheetId = config.revenue_sheet_id;

    if (!clientEmail || !privateKey || !revenueSheetId) {
      console.log('Missing Google credentials or revenue_sheet_id');
      return;
    }

    const auth = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log('Fetching sheet metadata...');
    const meta = await sheets.spreadsheets.get({ spreadsheetId: revenueSheetId });
    const sheetNames = meta.data.sheets.map(s => s.properties.title);
    console.log('Available sheets:', sheetNames);

    for (const name of sheetNames) {
      if (name.includes('Revenue') || name.includes('Spend') || name.includes('Budget')) {
        const readRes = await sheets.spreadsheets.values.get({
          spreadsheetId: revenueSheetId,
          range: `${name}!A1:Z5`
        });
        console.log(`\nHeaders for sheet [${name}]:`);
        console.log(readRes.data.values ? readRes.data.values[0] : 'Empty sheet');
        if (readRes.data.values && readRes.data.values.length > 1) {
          console.log('Example row:', readRes.data.values[1]);
        }
      }
    }

  } catch (err) {
    console.error(err);
  }
}

run();
