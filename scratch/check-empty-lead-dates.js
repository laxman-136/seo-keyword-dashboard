const fs = require('fs');
const path = require('path');

function formatTimestamp(ts) {
  if (!ts) return 'N/A';
  return new Date(ts).toLocaleDateString('en-IN') + ' ' + new Date(ts).toLocaleTimeString('en-IN');
}

function run() {
  try {
    const allLeadsPath = path.join(__dirname, 'all-telecrm-leads.json');

    if (!fs.existsSync(allLeadsPath)) {
      console.error('All TeleCRM leads file not found. Please run fetch-all-leads-cache.js first.');
      return;
    }

    const allLeads = JSON.parse(fs.readFileSync(allLeadsPath, 'utf8'));
    console.log(`Loaded ${allLeads.length} total leads from TeleCRM.`);

    // Filter leads where lead_date is empty/null/undefined
    const emptyLeadDateLeads = allLeads.filter(l => {
      const ld = l.fields?.lead_date;
      return ld === null || ld === undefined || ld === '' || ld === 0;
    });

    console.log(`Found ${emptyLeadDateLeads.length} leads with an empty lead_date.`);

    // Breakdowns
    const statusBreakdown = {};
    const courseBreakdown = {};
    const sourceBreakdown = {};
    const yearMonthBreakdown = {};

    emptyLeadDateLeads.forEach(l => {
      const status = l.status || 'N/A';
      const course = l.fields?.course || 'N/A';
      const source = l.fields?.lead_source_1 || 'N/A';
      
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      courseBreakdown[course] = (courseBreakdown[course] || 0) + 1;
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;

      // Group by created_on year/month
      const createdOn = l.fields?.created_on;
      if (createdOn) {
        const dateObj = new Date(createdOn);
        const ym = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        yearMonthBreakdown[ym] = (yearMonthBreakdown[ym] || 0) + 1;
      } else {
        yearMonthBreakdown['No Created On Date'] = (yearMonthBreakdown['No Created On Date'] || 0) + 1;
      }
    });

    console.log('\n=== STATUS BREAKDOWN ===');
    Object.entries(statusBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => {
      console.log(`- ${k}: ${v}`);
    });

    console.log('\n=== COURSE BREAKDOWN ===');
    Object.entries(courseBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => {
      console.log(`- ${k}: ${v}`);
    });

    console.log('\n=== SOURCE BREAKDOWN ===');
    Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => {
      console.log(`- ${k}: ${v}`);
    });

    console.log('\n=== CREATION MONTH BREAKDOWN ===');
    Object.entries(yearMonthBreakdown).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12).forEach(([k, v]) => {
      console.log(`- ${k}: ${v}`);
    });

    // Save CSV output of leads with empty lead date
    const csvHeaders = ['Lead ID', 'Name', 'Phone', 'Email', 'Course', 'Lead Source', 'Status', 'Created On', 'Modified On'];
    const csvRows = [
      csvHeaders.join(','),
      ...emptyLeadDateLeads.map(l => [
        `"${l.id}"`,
        `"${(l.fields?.name || 'N/A').replace(/"/g, '""')}"`,
        `"${(l.fields?.phone || 'N/A').replace(/"/g, '""')}"`,
        `"${(l.fields?.email || 'N/A').replace(/"/g, '""')}"`,
        `"${(l.fields?.course || 'N/A').replace(/"/g, '""')}"`,
        `"${(l.fields?.lead_source_1 || 'N/A').replace(/"/g, '""')}"`,
        `"${(l.status || 'N/A').replace(/"/g, '""')}"`,
        `"${formatTimestamp(l.fields?.created_on)}"`,
        `"${formatTimestamp(l.fields?.modified_on)}"`
      ].join(','))
    ];
    
    try {
      const outputPath = path.join(__dirname, 'empty-lead-dates.csv');
      fs.writeFileSync(outputPath, csvRows.join('\n'));
      console.log(`\nSaved leads with empty lead_date to scratch/empty-lead-dates.csv`);
    } catch (csvErr) {
      console.warn(`\nWarning: Could not save CSV file (it might be open in another application): ${csvErr.message}`);
    }

  } catch (err) {
    console.error('Error running check:', err);
  }
}

run();
