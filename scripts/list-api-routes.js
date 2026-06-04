// scripts/list-api-routes.js
const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const apiDir = path.join(__dirname, '..', 'app', 'api');
if (fs.existsSync(apiDir)) {
  console.log('List of API routes:');
  walkDir(apiDir, filePath => {
    const relative = path.relative(path.join(__dirname, '..'), filePath);
    const stat = fs.statSync(filePath);
    console.log(`- ${relative} (${stat.size} bytes)`);
  });
} else {
  console.log('app/api does not exist');
}
