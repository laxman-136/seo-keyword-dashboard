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

console.log('Searching for telecrm-related storage/usage...');
walkDir(path.join(__dirname, '..'), filePath => {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx') && !filePath.endsWith('.js')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.toLowerCase().includes('telecrmapitoken') || content.toLowerCase().includes('telecrmenterpriseid')) {
    console.log(`Found in: ${filePath}`);
  }
});
