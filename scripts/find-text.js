// scripts/find-text.js
const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.next' && f !== '.git') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

const query = "falling back to demo data";

console.log(`Searching for "${query}" in files...`);
walkDir(path.join(__dirname, '..'), filePath => {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx') && !filePath.endsWith('.js') && !filePath.endsWith('.json')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(query)) {
    console.log(`Found in: ${filePath}`);
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes(query)) {
        console.log(`  Line ${idx + 1}: ${line.trim()}`);
      }
    });
  }
});
