const fs = require('fs');
const path = require('path');

function run() {
  const allLeadsPath = path.join(__dirname, 'all-telecrm-leads.json');
  if (!fs.existsSync(allLeadsPath)) {
    console.error('Cache file not found');
    return;
  }
  const allLeads = JSON.parse(fs.readFileSync(allLeadsPath, 'utf8'));
  const targets = allLeads.filter(l => {
    const ld = l.fields?.lead_date;
    const co = l.fields?.created_on;
    return (ld === null || ld === undefined || ld === '' || ld === 0) && co;
  });

  console.log(`Found ${targets.length} leads with empty lead_date.`);
  if (targets.length > 0) {
    console.log('Sample leads:');
    targets.slice(0, 5).forEach(l => {
      console.log(`ID: ${l.id}, Name: ${l.fields.name}, Email: ${l.fields.email}, Phone: ${l.fields.phone}, Created On: ${l.fields.created_on} (${new Date(l.fields.created_on).toISOString()})`);
    });
  }
}

run();
