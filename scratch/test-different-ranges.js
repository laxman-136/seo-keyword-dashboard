const fs = require('fs');
const path = require('path');

function run() {
  const allLeads = JSON.parse(fs.readFileSync(path.join(__dirname, 'all-telecrm-leads.json'), 'utf8'));
  
  const today = new Date('2026-06-23T18:46:45+05:30'); // Approximate time of screenshot
  console.log(`Reference Date (IST): ${today.toLocaleString('en-IN')}`);

  // Range 1: April 1, 2026 to June 23, 2026 (Dashboard calendar-based Last 3 Months: current month + 2 previous months starting 1st)
  const r1From = new Date('2026-04-01T00:00:00+05:30').getTime();
  const r1To = new Date('2026-06-23T23:59:59+05:30').getTime();

  // Range 2: March 25, 2026 to June 23, 2026 (90 days rolling)
  const r2From = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).getTime();
  const r2To = r1To;

  // Range 3: March 1, 2026 to June 23, 2026 (Current month + 3 previous full months starting 1st)
  const r3From = new Date('2026-03-01T00:00:00+05:30').getTime();
  const r3To = r1To;

  // Range 4: March 23, 2026 to June 23, 2026 (3 months rolling, same day-of-month)
  const r4From = new Date('2026-03-23T00:00:00+05:30').getTime();
  const r4To = r1To;

  const countLeads = (from, to) => {
    let countLD = 0;
    let countLDorCO = 0;
    allLeads.forEach(l => {
      const ld = l.fields?.lead_date;
      const co = l.fields?.created_on;
      if (ld >= from && ld <= to) countLD++;
      const val = ld || co;
      if (val >= from && val <= to) countLDorCO++;
    });
    return { countLD, countLDorCO };
  };

  console.log('\n--- Count Results ---');
  const res1 = countLeads(r1From, r1To);
  console.log(`Range 1 (April 1 to June 23):`);
  console.log(`  lead_date only: ${res1.countLD}`);
  console.log(`  lead_date || created_on: ${res1.countLDorCO}`);

  const res2 = countLeads(r2From, r2To);
  console.log(`Range 2 (90 days rolling: March 25 to June 23):`);
  console.log(`  lead_date only: ${res2.countLD}`);
  console.log(`  lead_date || created_on: ${res2.countLDorCO}`);

  const res4 = countLeads(r4From, r4To);
  console.log(`Range 4 (3 months rolling: March 23 to June 23):`);
  console.log(`  lead_date only: ${res4.countLD}`);
  console.log(`  lead_date || created_on: ${res4.countLDorCO}`);

  const res3 = countLeads(r3From, r3To);
  console.log(`Range 3 (March 1 to June 23):`);
  console.log(`  lead_date only: ${res3.countLD}`);
  console.log(`  lead_date || created_on: ${res3.countLDorCO}`);
}

run();
