const fs = require('fs');

const line = fs.readFileSync('C:/Users/DELL/.gemini/antigravity/scratch/seo-keyword-dashboard/scratch/search-results.txt', 'utf8').split('\n')[0];
const match = line.match(/{"step_index":.*/);
if (match) {
  const parsed = JSON.parse(match[0]);
  console.log(parsed.content);
}
