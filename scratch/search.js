const fs = require('fs');
const content = fs.readFileSync('C:/Users/DELL/.gemini/antigravity/scratch/seo-keyword-dashboard/app/settings/page.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('telecrm')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
