const fs = require('fs');
const path = require('path');

function run() {
  const allLeads = JSON.parse(fs.readFileSync(path.join(__dirname, 'all-telecrm-leads.json'), 'utf8'));
  const lead = allLeads.find(l => l.id === '6a08bda759e10b6d8fca886e');
  console.log('Lead in Cache:', JSON.stringify(lead, null, 2));
}

run();
