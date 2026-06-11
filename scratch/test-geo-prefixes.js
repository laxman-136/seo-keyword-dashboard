// scratch/test-geo-prefixes.js
const fs = require('fs');
const path = require('path');

// Replicate the mapping structures and functions from the route
const STATES = [
  'Telangana', 'Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Tamil Nadu', 
  'Delhi', 'Uttar Pradesh', 'Gujarat', 'West Bengal', 'Rajasthan', 'Haryana'
];

// Extract the PREFIX_TO_STATE from the route file to ensure absolute synchronization
function loadPrefixMapFromRoute() {
  const routePath = path.join(__dirname, '../app/api/leads/geography/route.ts');
  const content = fs.readFileSync(routePath, 'utf8');
  
  // Find PREFIX_TO_STATE block
  const match = content.match(/const PREFIX_TO_STATE: Record<string, string> = {([\s\S]*?)\n}/);
  if (!match) {
    throw new Error('Could not find PREFIX_TO_STATE in route.ts');
  }
  
  // Parse the object block
  const block = match[1];
  const map = {};
  const keyValueRegex = /'(\d+)':\s*'([^']+)'/g;
  let kvMatch;
  while ((kvMatch = keyValueRegex.exec(block)) !== null) {
    map[kvMatch[1]] = kvMatch[2];
  }
  
  return map;
}

const PREFIX_TO_STATE = loadPrefixMapFromRoute();

function getStateFromPhone(phone) {
  if (!phone) return null;
  
  // Strip all non-digits
  const clean = phone.replace(/\D/g, '');
  
  // Normalise to 10 digit number
  let tenDigit = clean;
  if (clean.length > 10) {
    if (clean.startsWith('91')) {
      tenDigit = clean.substring(2);
    } else if (clean.startsWith('0')) {
      tenDigit = clean.substring(1);
    }
  }
  
  if (tenDigit.length !== 10) {
    return null;
  }
  
  const prefix = tenDigit.substring(0, 4);
  const matchedState = PREFIX_TO_STATE[prefix];
  if (!matchedState) return null;
  
  if (matchedState === 'AP_CIRCLE') {
    const sum = tenDigit.split('').reduce((s, d) => s + parseInt(d, 10), 0);
    return sum % 2 === 0 ? 'Telangana' : 'Andhra Pradesh';
  }
  
  return matchedState;
}

// Test cases
const tests = [
  // Delhi
  { phone: '+91 98101 23456', expected: 'Delhi' },
  { phone: '09810123456', expected: 'Delhi' },
  { phone: '9810123456', expected: 'Delhi' },
  
  // Karnataka
  { phone: '+91 98450 12345', expected: 'Karnataka' },
  { phone: '9845012345', expected: 'Karnataka' },
  
  // Maharashtra
  { phone: '+91 98200 12345', expected: 'Maharashtra' },
  
  // Tamil Nadu
  { phone: '+91 98400 12345', expected: 'Tamil Nadu' },
  
  // Gujarat
  { phone: '98250 12345', expected: 'Gujarat' },
  
  // AP Circle (Telangana / Andhra Pradesh)
  { phone: '+91 90000 12345', expected: ['Telangana', 'Andhra Pradesh'] }, // Dynamic split
  
  // Invalid/Unknown
  { phone: '', expected: null },
  { phone: '12345', expected: null },
  { phone: '5555555555', expected: null } // Unknown prefix
];

console.log('🧪 Running Geographic Prefix Mapping tests...\n');
let passed = 0;

tests.forEach((t, index) => {
  const result = getStateFromPhone(t.phone);
  let isMatch = false;
  if (Array.isArray(t.expected)) {
    isMatch = t.expected.includes(result);
  } else {
    isMatch = result === t.expected;
  }

  if (isMatch) {
    console.log(`✅ Test #${index + 1} passed: "${t.phone}" -> "${result}"`);
    passed++;
  } else {
    console.error(`❌ Test #${index + 1} FAILED: "${t.phone}" expected "${t.expected}" but got "${result}"`);
  }
});

console.log(`\n📊 Test results: ${passed}/${tests.length} passed.`);
if (passed === tests.length) {
  console.log('\x1b[32m✔ All prefix mapping tests passed successfully!\x1b[0m');
} else {
  process.exit(1);
}
