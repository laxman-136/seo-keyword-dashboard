// scripts/test-google-sheets-3.js
const sheetId = '1dPZULPrbh4Qs3dXJqmtW8e4sJAEm0fNi';
const apiKey = 'AIzaSyCif_Ik4cMmhVj8KTe3QvWgdXy3JXvjmkQ';
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
    }
  } catch (err) {
    console.error('Fetch exception:', err);
  }
}

run();
