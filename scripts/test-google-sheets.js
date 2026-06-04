// scripts/test-google-sheets.js
const sheetId = '1TGqgOOs4ekYD70_qgE44-cgvsiIML4hf3LUdJzWSkdM';
const apiKey = 'AIzaSyB53lvvuuusDNCqCrwXzymvLIQYR3A4R1M';
const sheetName = 'Keywords';

const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}?key=${apiKey}`;

console.log('Testing Google Sheets fetch URL:', url);

async function run() {
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      console.error('Google Sheets API Error Status:', res.status);
      console.error('Error details:', JSON.stringify(data, null, 2));
    } else {
      console.log('Google Sheets API Success!');
      console.log('Data range:', data.range);
      console.log('Number of rows:', data.values ? data.values.length : 0);
    }
  } catch (err) {
    console.error('Fetch exception:', err);
  }
}

run();
