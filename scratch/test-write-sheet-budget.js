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
    
    console.log('Checking sheets list...');
    const meta = await sheets.spreadsheets.get({ spreadsheetId: revenueSheetId });
    const sheetNames = meta.data.sheets.map(s => s.properties.title);
    
    const targetSheet = 'Channel Budgets';
    if (!sheetNames.includes(targetSheet)) {
      console.log(`Creating sheet: ${targetSheet}...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: revenueSheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: targetSheet
                }
              }
            }
          ]
        }
      });
      console.log(`Sheet created: ${targetSheet}`);
      
      // Write headers
      console.log('Writing headers...');
      await sheets.spreadsheets.values.update({
        spreadsheetId: revenueSheetId,
        range: `${targetSheet}!A1:C1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Month', 'Channel', 'Budget']]
        }
      });
      console.log('Headers written successfully.');
    } else {
      console.log(`Sheet "${targetSheet}" already exists.`);
    }

    // Write a test value
    console.log('Writing test budget row...');
    const testData = [['June 2026', 'Organic', '15000']];
    await sheets.spreadsheets.values.update({
      spreadsheetId: revenueSheetId,
      range: `${targetSheet}!A2:C2`,
      valueInputOption: 'RAW',
      requestBody: {
        values: testData
      }
    });
    console.log('Test budget row written successfully!');

    // Read back values to verify
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId: revenueSheetId,
      range: `${targetSheet}!A1:C10`
    });
    console.log('\nValues currently in Sheet:');
    console.log(readRes.data.values);

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
