const fs = require('fs');

const filePath = 'C:/Users/Veera/.gemini/antigravity/brain/f58a670f-73e6-4823-95d3-c88d333753ea/june_telecrm_only_report.md';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
let sum = 0;
let rowCount = 0;

lines.forEach(line => {
  if (line.startsWith('|') && !line.includes('Student Name') && !line.includes('---')) {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 8) {
      const amountPaidStr = parts[7]; // index 7 is "Cash Paid (EMI 1 + EMI 2)"
      if (amountPaidStr && amountPaidStr !== 'N/A' && amountPaidStr !== '') {
        // Amount paid is formatted as: ₹27,500 (₹15000 + ₹12500)
        // We can match the first currency amount before the parenthesis
        const match = amountPaidStr.match(/₹([0-9,]+)/);
        if (match) {
          const cleaned = match[1].replace(/[^0-9]/g, '');
          const amount = parseInt(cleaned, 10) || 0;
          sum += amount;
          rowCount++;
          console.log(`Row ${parts[1]} (${parts[2]}): ${amountPaidStr} -> ${amount}`);
        } else {
          console.log(`Row ${parts[1]} (${parts[2]}): ${amountPaidStr} -> 0 (No match)`);
        }
      }
    }
  }
});

console.log('\n--- SUMMARY ---');
console.log(`Total rows processed: ${rowCount}`);
console.log(`Total amount collected: ₹${sum.toLocaleString('en-IN')}`);
