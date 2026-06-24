const fs = require('fs');
const path = require('path');

function run() {
  const allLeads = JSON.parse(fs.readFileSync(path.join(__dirname, 'all-telecrm-leads.json'), 'utf8'));

  const fromTime = new Date('2026-06-13T00:00:00+05:30').getTime();
  const toTime = new Date('2026-06-23T23:59:59+05:30').getTime();

  const recentLeads = allLeads.filter(l => {
    const co = l.fields?.created_on;
    return co >= fromTime && co <= toTime;
  });

  console.log(`Leads created in last 10 days (June 13 - June 23): ${recentLeads.length}`);
  
  recentLeads.sort((a, b) => b.fields.created_on - a.fields.created_on);

  recentLeads.slice(0, 15).forEach(l => {
    console.log(`Name: ${l.fields.name}, Created On: ${new Date(l.fields.created_on).toLocaleString('en-IN')}, Lead Date: ${l.fields?.lead_date ? new Date(l.fields.lead_date).toLocaleString('en-IN') : 'N/A'}`);
  });
}

run();
