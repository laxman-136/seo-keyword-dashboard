const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Veera\\.gemini\\antigravity\\brain\\f58a670f-73e6-4823-95d3-c88d333753ea\\.system_generated\\logs\\transcript_full.jsonl';

try {
  const fileContent = fs.readFileSync(logPath, 'utf8');
  const firstLine = fileContent.split('\n')[0];
  const parsed = JSON.parse(firstLine);
  const lines = parsed.content.split('\n');
  console.log('Total lines in user request:', lines.length);
  
  // print first 5 lines
  console.log('First 5 lines:');
  console.log(lines.slice(0, 5));
  
  // print last 10 lines
  console.log('Last 10 lines:');
  console.log(lines.slice(lines.length - 10));
} catch (err) {
  console.error(err);
}
