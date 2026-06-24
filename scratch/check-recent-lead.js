const fs = require('fs');
const path = require('path');

function run() {
  const allLeads = JSON.parse(fs.readFileSync(path.join(__dirname, 'all-telecrm-leads.json'), 'utf8'));
  const lead = allLeads.find(l => l.id === '6a3a7a75c96c0f0ac65ec9f4');
  console.log('Recent Lead:', JSON.stringify(lead, null, 2));
}

run();
