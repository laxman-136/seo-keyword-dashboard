const fs = require('fs');
const path = require('path');

function run() {
  const allLeads = JSON.parse(fs.readFileSync(path.join(__dirname, 'all-telecrm-leads.json'), 'utf8'));

  const fromTime = new Date('2025-12-01T00:00:00+05:30').getTime();
  const toTime = new Date('2026-06-23T23:59:59+05:30').getTime();

  const freshLeads = allLeads.filter(l => {
    const ld = l.fields?.lead_date;
    return l.status === 'Fresh' && ld >= fromTime && ld <= toTime;
  });

  console.log(`Total Fresh leads in March 1 - June 23: ${freshLeads.length}`);

  const employeeBreakdown = {};
  freshLeads.forEach(l => {
    const emp = l.employeeid || 'Unassigned';
    employeeBreakdown[emp] = (employeeBreakdown[emp] || 0) + 1;
  });

  console.log('\n--- Employee Assignment Breakdown for Fresh Leads ---');
  Object.entries(employeeBreakdown).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} leads`);
  });
}

run();
