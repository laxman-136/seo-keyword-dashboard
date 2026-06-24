const fs = require('fs');
const path = require('path');

function run() {
  const allLeads = JSON.parse(fs.readFileSync(path.join(__dirname, 'all-telecrm-leads.json'), 'utf8'));

  const fromTime = new Date('2026-03-01T00:00:00+05:30').getTime();
  const toTime = new Date('2026-06-23T23:59:59+05:30').getTime();

  // Filter leads within March 1 - June 23 range
  const periodLeads = allLeads.filter(l => {
    const ld = l.fields?.lead_date;
    return ld >= fromTime && ld <= toTime;
  });

  console.log(`Total leads in March 1 - June 23: ${periodLeads.length}`);

  const statusBreakdown = {};
  periodLeads.forEach(l => {
    const s = l.status || 'N/A';
    statusBreakdown[s] = (statusBreakdown[s] || 0) + 1;
  });

  console.log('\n--- Status Breakdown ---');
  Object.entries(statusBreakdown).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} leads`);
  });
}

run();
