// scripts/inspect-spreadsheet-tabs.js
const sheetId = '1zPsIiGHKqQYzj7Q5kl3FgLADpZdRMUKk2qOu5U02bRQ';
const apiKey = 'AIzaSyB53lvvuuusDNCqCrwXzymvLIQYR3A4R1M';

const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties.title&key=${apiKey}`;

console.log('Fetching spreadsheet metadata...');
async function run() {
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      console.error('Google Sheets API Error Status:', res.status);
      console.error('Error details:', JSON.stringify(data, null, 2));
    } else {
      console.log('Google Sheets API Success! Sheet tabs found in this spreadsheet:');
      const titles = data.sheets ? data.sheets.map(s => s.properties.title) : [];
      titles.forEach((t, i) => {
        console.log(`  [${i + 1}] "${t}"`);
      });
    }
  } catch (err) {
    console.error('Fetch exception:', err);
  }
}

run();
