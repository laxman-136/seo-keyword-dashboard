// scripts/find-proxy.js
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

console.log('Searching for proxy.ts files...');
walkDir(path.join(__dirname, '..'), filePath => {
  if (path.basename(filePath) === 'proxy.ts' || path.basename(filePath) === 'proxy.js') {
    console.log(`Found: ${filePath}`);
  }
});
