const fs = require('fs');
const path = require('path');

function run() {
  const allLeads = JSON.parse(fs.readFileSync(path.join(__dirname, 'all-telecrm-leads.json'), 'utf8'));
  
  const juneLeads = allLeads.filter(l => {
    const co = l.fields?.created_on;
    if (!co) return false;
    const d = new Date(co);
    return d.getFullYear() === 2026 && d.getMonth() === 5; // June is month 5
  });

  console.log(`Total June leads in cache: ${juneLeads.length}`);
  
  // Sort by created_on descending
  juneLeads.sort((a, b) => b.fields.created_on - a.fields.created_on);

  console.log('Top 10 newest June leads:');
  juneLeads.slice(0, 10).forEach(l => {
    console.log(`ID: ${l.id}, Name: ${l.fields.name}, Created On: ${new Date(l.fields.created_on).toLocaleString('en-IN')}`);
  });
}

run();
