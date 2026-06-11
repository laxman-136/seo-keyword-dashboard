// scratch/cleanup-route-map.js
const fs = require('fs');
const path = require('path');

const routePath = path.join(__dirname, '../app/api/leads/geography/route.ts');
let content = fs.readFileSync(routePath, 'utf8');

const match = content.match(/const PREFIX_TO_STATE: Record<string, string> = {([\s\S]*?)\n}/);
if (!match) {
  console.error('Could not find PREFIX_TO_STATE');
  process.exit(1);
}

const block = match[1];
const keyValueRegex = /'(\d+)':\s*'([^']+)'/g;
let kvMatch;

const keys = new Set();
const cleanPairs = [];
let duplicatesRemoved = 0;

// Regular expression to iterate over the items in order of definition
while ((kvMatch = keyValueRegex.exec(block)) !== null) {
  const key = kvMatch[1];
  const val = kvMatch[2];
  if (keys.has(key)) {
    duplicatesRemoved++;
  } else {
    keys.add(key);
    cleanPairs.push({ key, val });
  }
}

console.log(`Original entries: ${keys.size + duplicatesRemoved}`);
console.log(`Unique entries: ${keys.size}`);
console.log(`Duplicates removed: ${duplicatesRemoved}`);

// Build new PREFIX_TO_STATE string in a clean format
const formattedPairs = [];
// Group by state for neatness
const stateGroups = {};
cleanPairs.forEach(pair => {
  if (!stateGroups[pair.val]) {
    stateGroups[pair.val] = [];
  }
  stateGroups[pair.val].push(pair.key);
});

const newBlockLines = [];
Object.entries(stateGroups).forEach(([state, prefixList]) => {
  newBlockLines.push(`  // ${state}`);
  // Chunk prefixes into groups of 10-15 per line for readability
  const chunkSize = 12;
  for (let i = 0; i < prefixList.length; i += chunkSize) {
    const chunk = prefixList.slice(i, i + chunkSize);
    const line = chunk.map(p => `'${p}': '${state}'`).join(', ');
    newBlockLines.push(`  ${line},`);
  }
});

const newBlockContent = 'const PREFIX_TO_STATE: Record<string, string> = {\n' + newBlockLines.join('\n') + '\n}';

// Replace in the file
const replacedContent = content.replace(/const PREFIX_TO_STATE: Record<string, string> = {[\s\S]*?\n}/, newBlockContent);
fs.writeFileSync(routePath, replacedContent, 'utf8');
console.log('Successfully wrote cleaned-up map back to app/api/leads/geography/route.ts!');
