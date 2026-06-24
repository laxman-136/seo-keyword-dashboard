const fs = require('fs');
const path = require('path');

function run() {
  const allLeads = JSON.parse(fs.readFileSync(path.join(__dirname, 'all-telecrm-leads.json'), 'utf8'));

  const findAndPrint = (name) => {
    const matches = allLeads.filter(l => l.fields?.name && l.fields.name.toLowerCase().includes(name.toLowerCase()));
    console.log(`\nMatches for ${name}:`);
    matches.forEach(m => {
      console.log(JSON.stringify({
        id: m.id,
        name: m.fields.name,
        created_on: m.fields.created_on ? new Date(m.fields.created_on).toLocaleString('en-IN') : 'N/A',
        lead_date: m.fields.lead_date ? new Date(m.fields.lead_date).toLocaleString('en-IN') : 'N/A'
      }, null, 2));
    });
  };

  findAndPrint('Ashraf');
  findAndPrint('Mumuney');
  findAndPrint('Prakash');
}

run();
