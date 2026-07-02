const { getStartOfDay, getEndOfDay } = require('../lib/telecrm-api');

// Simulate date objects as would be constructed by parsing "2026-06-01" and "2026-06-30"
const fromDate = new Date("2026-06-01");
const toDate = new Date("2026-06-30");

const adjustedFrom = getStartOfDay(fromDate);
const adjustedTo = getEndOfDay(toDate);

console.log("Input From Date (UTC midnight):", fromDate.toISOString());
console.log("Adjusted From Date (IST 12am):", adjustedFrom.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
console.log("Adjusted From Timestamp:", adjustedFrom.getTime());
console.log("Expected: 1780252800000 (which is 2026-06-01 00:00:00 GMT+0530)");
console.log("Matches:", adjustedFrom.getTime() === 1780252800000 ? "✅ YES" : "❌ NO");

console.log("\nInput To Date (UTC midnight):", toDate.toISOString());
console.log("Adjusted To Date (IST 11:59pm):", adjustedTo.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
console.log("Adjusted To Timestamp:", adjustedTo.getTime());
console.log("Expected: 1782844799999 (which is 2026-06-30 23:59:59.999 GMT+0530)");
console.log("Matches:", adjustedTo.getTime() === 1782844799999 ? "✅ YES" : "❌ NO");
