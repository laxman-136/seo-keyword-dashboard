// scratch/find-duplicates.js
const fs = require('fs');
const path = require('path');

const routePath = path.join(__dirname, '../app/api/leads/geography/route.ts');
const content = fs.readFileSync(routePath, 'utf8');

const match = content.match(/const PREFIX_TO_STATE: Record<string, string> = {([\s\S]*?)\n}/);
if (!match) {
  console.error('Could not find PREFIX_TO_STATE');
  process.exit(1);
}

const block = match[1];
const keyValueRegex = /'(\d+)':\s*'([^']+)'/g;
let kvMatch;
const keys = {};
const duplicates = [];

while ((kvMatch = keyValueRegex.exec(block)) !== null) {
  const key = kvMatch[1];
  const val = kvMatch[2];
  if (keys[key]) {
    duplicates.push({ key, first: keys[key], second: val });
  } else {
    keys[key] = val;
  }
}

if (duplicates.length > 0) {
  console.log('Found duplicate keys:');
  duplicates.forEach(d => {
    console.log(`Key "${d.key}" is mapped to both "${d.first}" and "${d.second}"`);
  });
} else {
  console.log('No duplicate keys found!');
}
