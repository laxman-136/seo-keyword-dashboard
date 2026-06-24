const fs = require('fs');
const path = require('path');

function formatTimestamp(ts) {
  if (!ts) return 'N/A';
  return new Date(ts).toLocaleDateString('en-IN') + ' ' + new Date(ts).toLocaleTimeString('en-IN');
}

function run() {
  try {
    const targetEmailsPath = path.join(__dirname, 'extracted-emails.json');
    const allLeadsPath = path.join(__dirname, 'all-telecrm-leads.json');

    if (!fs.existsSync(targetEmailsPath)) {
      console.error('Target emails file not found.');
      return;
    }
    if (!fs.existsSync(allLeadsPath)) {
      console.error('All TeleCRM leads file not found. Wait for the fetch script to finish.');
      return;
    }

    const targetEmails = JSON.parse(fs.readFileSync(targetEmailsPath, 'utf8'));
    const allLeads = JSON.parse(fs.readFileSync(allLeadsPath, 'utf8'));

    console.log(`Loaded ${targetEmails.length} target emails.`);
    console.log(`Loaded ${allLeads.length} total leads from TeleCRM.`);

    // Build lookup map
    const leadMap = new Map();
    allLeads.forEach(l => {
      // Primary email field
      const emailVal = l.fields?.email;
      if (emailVal && typeof emailVal === 'string') {
        const cleaned = emailVal.trim().toLowerCase();
        if (cleaned) {
          if (!leadMap.has(cleaned)) {
            leadMap.set(cleaned, []);
          }
          leadMap.get(cleaned).push(l);
        }
      }

      // Check contactMetaInfo (which contains both phone and email)
      if (l.contactMetaInfo && Array.isArray(l.contactMetaInfo)) {
        l.contactMetaInfo.forEach(item => {
          if (item && typeof item === 'string' && item.includes('@')) {
            const cleaned = item.trim().toLowerCase();
            if (cleaned && cleaned !== emailVal?.trim().toLowerCase()) {
              if (!leadMap.has(cleaned)) {
                leadMap.set(cleaned, []);
              }
              leadMap.get(cleaned).push(l);
            }
          }
        });
      }
    });

    console.log(`Indexed ${leadMap.size} unique emails from TeleCRM leads database.`);

    const matchedLeads = [];
    const unmatchedEmails = [];

    targetEmails.forEach(email => {
      const emailKey = email.trim().toLowerCase();
      if (leadMap.has(emailKey)) {
        const leads = leadMap.get(emailKey);
        leads.forEach(l => {
          matchedLeads.push({
            searchedEmail: email,
            matchedEmail: l.fields?.email || emailKey,
            id: l.id,
            name: l.fields?.name || 'N/A',
            phone: l.fields?.phone || 'N/A',
            course: l.fields?.course || 'N/A',
            leadSource: l.fields?.lead_source_1 || 'N/A',
            status: l.status || 'N/A',
            leadDate: formatTimestamp(l.fields?.lead_date),
            createdOn: formatTimestamp(l.fields?.created_on),
            modifiedOn: formatTimestamp(l.fields?.modified_on)
          });
        });
      } else {
        unmatchedEmails.push(email);
      }
    });

    console.log(`\n=== MATCH RESULTS ===`);
    console.log(`Searched Emails: ${targetEmails.length}`);
    console.log(`Matched Records found: ${matchedLeads.length} (across ${targetEmails.length - unmatchedEmails.length} unique emails)`);
    console.log(`Unmatched Emails: ${unmatchedEmails.length}`);

    // Breakdowns
    const statusBreakdown = {};
    const courseBreakdown = {};
    const sourceBreakdown = {};

    matchedLeads.forEach(m => {
      statusBreakdown[m.status] = (statusBreakdown[m.status] || 0) + 1;
      courseBreakdown[m.course] = (courseBreakdown[m.course] || 0) + 1;
      sourceBreakdown[m.leadSource] = (sourceBreakdown[m.leadSource] || 0) + 1;
    });

    console.log('\n=== STATUS BREAKDOWN ===');
    Object.entries(statusBreakdown).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
      console.log(`- ${k}: ${v}`);
    });

    console.log('\n=== COURSE BREAKDOWN ===');
    Object.entries(courseBreakdown).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
      console.log(`- ${k}: ${v}`);
    });

    console.log('\n=== SOURCE BREAKDOWN ===');
    Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
      console.log(`- ${k}: ${v}`);
    });

    // Save JSON output
    fs.writeFileSync(path.join(__dirname, 'matched-leads.json'), JSON.stringify(matchedLeads, null, 2));
    console.log(`\nSaved matched leads details to scratch/matched-leads.json`);

    // Save CSV output
    const csvHeaders = ['Searched Email', 'Matched Email', 'Lead ID', 'Name', 'Phone', 'Course', 'Lead Source', 'Status', 'Lead Date', 'Created On', 'Modified On'];
    const csvRows = [
      csvHeaders.join(','),
      ...matchedLeads.map(m => [
        `"${m.searchedEmail.replace(/"/g, '""')}"`,
        `"${m.matchedEmail.replace(/"/g, '""')}"`,
        `"${m.id}"`,
        `"${m.name.replace(/"/g, '""')}"`,
        `"${m.phone.replace(/"/g, '""')}"`,
        `"${m.course.replace(/"/g, '""')}"`,
        `"${m.leadSource.replace(/"/g, '""')}"`,
        `"${m.status.replace(/"/g, '""')}"`,
        `"${m.leadDate}"`,
        `"${m.createdOn}"`,
        `"${m.modifiedOn}"`
      ].join(','))
    ];
    fs.writeFileSync(path.join(__dirname, 'matched-leads.csv'), csvRows.join('\n'));
    console.log(`Saved matched leads CSV to scratch/matched-leads.csv`);

    // Save unmatched CSV output
    const unmatchedCsvRows = [
      'Email',
      ...unmatchedEmails.map(e => `"${e.replace(/"/g, '""')}"`)
    ];
    fs.writeFileSync(path.join(__dirname, 'unmatched-emails.csv'), unmatchedCsvRows.join('\n'));
    console.log(`Saved unmatched emails CSV to scratch/unmatched-emails.csv`);

  } catch (err) {
    console.error('Error running analysis:', err);
  }
}

run();
