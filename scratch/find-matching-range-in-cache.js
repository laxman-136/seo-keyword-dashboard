const fs = require('fs');
const path = require('path');

function run() {
  const allLeads = JSON.parse(fs.readFileSync(path.join(__dirname, 'all-telecrm-leads.json'), 'utf8'));
  
  const toTime = new Date('2026-06-23T23:59:59+05:30').getTime();

  console.log('Searching for a start date that yields 1735 leads...');

  // Scan all days from March 1st to April 1st to find which one yields 1735 leads
  let matchedDate = null;
  for (let day = 1; day <= 31; day++) {
    const dateStr = `2026-03-${String(day).padStart(2, '0')}T00:00:00+05:30`;
    const fromTime = new Date(dateStr).getTime();
    
    let count = 0;
    allLeads.forEach(l => {
      const ld = l.fields?.lead_date;
      if (ld >= fromTime && ld <= toTime) count++;
    });

    console.log(`Start date ${dateStr.split('T')[0]}: ${count} leads`);
    if (count === 1735) {
      matchedDate = dateStr.split('T')[0];
    }
  }
}

run();
