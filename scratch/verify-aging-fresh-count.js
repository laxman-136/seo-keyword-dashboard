const fs = require('fs');
const path = require('path');

function run() {
  const allLeads = JSON.parse(fs.readFileSync(path.join(__dirname, 'all-telecrm-leads.json'), 'utf8'));

  const now = new Date('2026-06-23T19:35:50+05:30');
  // Past 6 months: from Dec 1, 2025 (or Dec 23, 2025 rolling)
  // Let's check both calendar-based and rolling 6 months
  const calendarFrom = new Date(now.getFullYear(), now.getMonth() - 6, 1).getTime();
  const rollingFrom = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000).getTime();
  const toTime = now.getTime();

  console.log(`Reference Date (IST): ${now.toLocaleString('en-IN')}`);
  console.log(`Calendar 6 Months From: ${new Date(calendarFrom).toLocaleString('en-IN')}`);
  console.log(`Rolling 6 Months From: ${new Date(rollingFrom).toLocaleString('en-IN')}`);

  const checkStatusCount = (fromTime) => {
    let countFresh = 0;
    let countTotalPending = 0;
    const pendingStatuses = [];

    allLeads.forEach(l => {
      const ld = l.fields?.lead_date;
      if (ld >= fromTime && ld <= toTime) {
        if (l.status === 'Fresh') {
          countFresh++;
        }
        // Count total pending (excluding Enrolled and Low/Cold)
        const cat = l.status;
        if (cat !== 'Enrolled' && cat !== 'Low/Cold' && cat !== 'Not Interested' && cat !== 'Junk Lead') {
          countTotalPending++;
        }
      }
    });

    return { countFresh, countTotalPending };
  };

  const resCal = checkStatusCount(calendarFrom);
  console.log('\n--- Calendar-based 6 Months (Dec 1, 2025 to June 23, 2026) ---');
  console.log(`  Fresh Status Leads: ${resCal.countFresh}`);
  console.log(`  Total Pending Leads: ${resCal.countTotalPending}`);

  const resRoll = checkStatusCount(rollingFrom);
  console.log('\n--- Rolling 6 Months (Dec 23, 2025 to June 23, 2026) ---');
  console.log(`  Fresh Status Leads: ${resRoll.countFresh}`);
  console.log(`  Total Pending Leads: ${resRoll.countTotalPending}`);
}

run();
