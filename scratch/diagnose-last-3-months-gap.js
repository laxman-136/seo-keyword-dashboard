const fs = require('fs');
const path = require('path');

function run() {
  const allLeadsPath = path.join(__dirname, 'all-telecrm-leads.json');
  if (!fs.existsSync(allLeadsPath)) {
    console.error('Cache not found');
    return;
  }
  const allLeads = JSON.parse(fs.readFileSync(allLeadsPath, 'utf8'));
  console.log(`Total leads in cache: ${allLeads.length}`);

  // Range: April 1, 2026 (00:00:00 IST) to June 23, 2026 (23:59:59 IST)
  // Let's use timestamps
  const fromTime = new Date('2026-04-01T00:00:00+05:30').getTime();
  const toTime = new Date('2026-06-23T23:59:59+05:30').getTime();

  console.log(`IST Range: ${new Date(fromTime).toLocaleString('en-IN')} to ${new Date(toTime).toLocaleString('en-IN')}`);

  let matchLeadDateCount = 0;
  let matchCreatedOnCount = 0;

  allLeads.forEach(l => {
    const ld = l.fields?.lead_date;
    const co = l.fields?.created_on;

    if (ld >= fromTime && ld <= toTime) {
      matchLeadDateCount++;
    }
    if (co >= fromTime && co <= toTime) {
      matchCreatedOnCount++;
    }
  });

  console.log(`Leads with lead_date in this range: ${matchLeadDateCount}`);
  console.log(`Leads with created_on in this range: ${matchCreatedOnCount}`);

  // Let's breakdown by month for both lead_date and created_on
  const monthsLD = {};
  const monthsCO = {};

  allLeads.forEach(l => {
    const ld = l.fields?.lead_date;
    const co = l.fields?.created_on;

    if (ld) {
      const d = new Date(ld);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsLD[ym] = (monthsLD[ym] || 0) + 1;
    }
    if (co) {
      const d = new Date(co);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsCO[ym] = (monthsCO[ym] || 0) + 1;
    }
  });

  console.log('\n--- Monthly Breakdown (lead_date) ---');
  Object.keys(monthsLD).sort().forEach(ym => {
    console.log(`  ${ym}: ${monthsLD[ym]}`);
  });

  console.log('\n--- Monthly Breakdown (created_on) ---');
  Object.keys(monthsCO).sort().forEach(ym => {
    console.log(`  ${ym}: ${monthsCO[ym]}`);
  });
}

run();
