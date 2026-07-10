const fs = require('fs');

const filePath = 'C:/Users/Veera/.gemini/antigravity/brain/f58a670f-73e6-4823-95d3-c88d333753ea/june_enrollment_data.md';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
const courseSums = {};

lines.forEach(line => {
  if (line.startsWith('|') && !line.includes('Student Name') && !line.includes('---')) {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 8) {
      const course = parts[4];
      const amountPaidStr = parts[7];
      if (amountPaidStr && amountPaidStr !== 'N/A' && amountPaidStr !== '') {
        const cleaned = amountPaidStr.replace(/[^0-9]/g, '');
        const amount = parseInt(cleaned, 10) || 0;
        courseSums[course] = (courseSums[course] || 0) + amount;
      }
    }
  }
});

console.log('--- COURSE SUMS FROM ENROLLMENT DATA ---');
let grandTotal = 0;
Object.keys(courseSums).forEach(course => {
  console.log(`${course}: ₹${courseSums[course].toLocaleString('en-IN')}`);
  grandTotal += courseSums[course];
});
console.log(`Grand Total: ₹${grandTotal.toLocaleString('en-IN')}`);
