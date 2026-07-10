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
    const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
    if (!config) {
      console.log('No active configuration found in Supabase');
      return;
    }
    
    const sheetId = config.revenue_sheet_id || envVars.GOOGLE_SHEET_ID;
    const apiKey = config.api_key || envVars.GOOGLE_SHEETS_API_KEY;

    console.log('Using Revenue Sheet ID:', sheetId);

    // Let's attempt to fetch the "Revenue Courses" sheet values directly
    const sheetName = 'Revenue Courses';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}?key=${apiKey}`;
    
    console.log('Fetching Google Sheet "Revenue Courses" values directly...');
    const res = await fetch(url);
    if (!res.ok) {
      console.log('Failed to fetch:', res.status, res.statusText);
      return;
    }

    const data = await res.json();
    console.log('Values received. Row count:', data.values ? data.values.length : 0);
    if (data.values) {
      data.values.forEach((row, i) => {
        console.log(`Row ${i}:`, row);
      });
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
