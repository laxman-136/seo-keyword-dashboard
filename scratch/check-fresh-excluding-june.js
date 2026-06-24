const fs = require('fs');
const path = require('path');

function run() {
  const allLeads = JSON.parse(fs.readFileSync(path.join(__dirname, 'all-telecrm-leads.json'), 'utf8'));

  const fromTime = new Date('2025-12-01T00:00:00+05:30').getTime();
  const toTime = new Date('2026-05-31T23:59:59+05:30').getTime(); // Exclude June

  let countFresh = 0;
  allLeads.forEach(l => {
    const ld = l.fields?.lead_date;
    if (ld >= fromTime && ld <= toTime) {
      if (l.status === 'Fresh') {
        countFresh++;
      }
    }
  });

  console.log(`Fresh leads in cache (Dec 1, 2025 to May 31, 2026): ${countFresh}`);
}

run();
