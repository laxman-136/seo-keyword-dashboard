const fs = require('fs');
const path = require('path');

function run() {
  const allLeads = JSON.parse(fs.readFileSync(path.join(__dirname, 'all-telecrm-leads.json'), 'utf8'));

  const fromTime = new Date('2026-03-01T00:00:00+05:30').getTime();
  const toTime = new Date('2026-06-23T23:59:59+05:30').getTime();

  // Filter leads within the range
  const periodLeads = allLeads.filter(l => {
    const ld = l.fields?.lead_date;
    return ld >= fromTime && ld <= toTime;
  });

  const activeLeads = periodLeads.filter(l => !l.isArchived && !l.isSpam);
  const archivedLeads = periodLeads.filter(l => l.isArchived);
  const spamLeads = periodLeads.filter(l => l.isSpam);

  console.log(`Total leads in range: ${periodLeads.length}`);
  console.log(`Active (not archived, not spam): ${activeLeads.length}`);
  console.log(`Archived: ${archivedLeads.length}`);
  console.log(`Spam: ${spamLeads.length}`);
}

run();
