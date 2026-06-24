const fs = require('fs');
const path = require('path');
const STATUS_TO_CATEGORY = {
  'Enrolled':                                    'Enrolled',
  'Interested to join the Demo':                 'High Potential',
  'Potential Lead 100':                          'High Potential',
  'Demo Attended':                               'High Potential',
  '60-80 Potential':                             'High Potential',
  'Looking for Next batch':                      'Medium Potential',
  '50 % Potential':                              'Medium Potential',
  'below 50 % Potential':                        'Medium Potential',
  'Fresh':                                       'Fresh/Unqualified',
  'Call not answered and Shared the Data':       'Fresh/Unqualified',
  'Number is not working and sent an email':     'Fresh/Unqualified',
  'Not Interested':                              'Low/Cold',
  'Junk Lead':                                   'Low/Cold',
  'Different Course':                            'Low/Cold',
  'Wrong Number &Number Not working':            'Low/Cold',
  'Lost':                                        'Low/Cold'
};

function getLeadAgeInDays(lead, todayMs) {
  const createdOn = lead.fields?.created_on || todayMs;
  const age = Math.floor((todayMs - createdOn) / (24 * 60 * 60 * 1000));
  return Math.max(0, age);
}

function run() {
  const allLeads = JSON.parse(fs.readFileSync(path.join(__dirname, 'all-telecrm-leads.json'), 'utf8'));

  const now = new Date('2026-06-23T19:35:50+05:30');
  const fromTime = new Date('2025-12-01T00:00:00+05:30').getTime();
  const toTime = new Date('2026-06-23T23:59:59+05:30').getTime(); // Include June

  const periodLeads = allLeads.filter(l => {
    const val = l.fields?.lead_date || l.fields?.created_on;
    return val >= fromTime && val <= toTime;
  });

  const pendingLeads = periodLeads.filter(lead => {
    if (lead.status === 'Junk Lead') return true;
    const cat = STATUS_TO_CATEGORY[lead.status] || 'Fresh/Unqualified';
    return cat !== 'Enrolled' && cat !== 'Low/Cold';
  });

  console.log(`Total Pending leads in range: ${pendingLeads.length}`);

  const buckets = [
    { label: 'Hot (< 7 days)', count: 0, min: 0, max: 7 },
    { label: 'Warm (7-30 days)', count: 0, min: 7, max: 30 },
    { label: 'Cooling (30-90 days)', count: 0, min: 30, max: 90 },
    { label: 'Cold (90-180 days)', count: 0, min: 90, max: 180 },
    { label: 'Dead (> 180 days)', count: 0, min: 180, max: 99999 }
  ];

  let totalAge = 0;
  pendingLeads.forEach(lead => {
    const age = getLeadAgeInDays(lead, now.getTime());
    totalAge += age;
    if (lead.status === 'Junk Lead') {
      buckets[4].count++;
      return;
    }
    for (const b of buckets) {
      if (age >= b.min && age < b.max) {
        b.count++;
        break;
      }
    }
  });

  const avgAge = pendingLeads.length > 0 ? totalAge / pendingLeads.length : 0;

  buckets.forEach(b => {
    const pct = ((b.count / pendingLeads.length) * 100).toFixed(1);
    console.log(`  - ${b.label}: ${b.count} (${pct}%)`);
  });

  console.log(`Average Age: ${avgAge.toFixed(1)} days`);
}

run();
