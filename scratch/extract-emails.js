const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Veera\\.gemini\\antigravity\\brain\\f58a670f-73e6-4823-95d3-c88d333753ea\\.system_generated\\logs\\transcript_full.jsonl';

try {
  const fileContent = fs.readFileSync(logPath, 'utf8');
  const firstLine = fileContent.split('\n')[0];
  const parsed = JSON.parse(firstLine);
  const text = parsed.content;
  
  // Extract emails using regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex) || [];
  
  // Remove duplicates and trim
  const uniqueEmails = [...new Set(emails.map(e => e.trim().toLowerCase()))];
  
  console.log('Total emails extracted:', emails.length);
  console.log('Unique emails extracted:', uniqueEmails.length);
  
  // Write unique emails to a JSON file
  fs.writeFileSync('scratch/extracted-emails.json', JSON.stringify(uniqueEmails, null, 2));
  console.log('Saved to scratch/extracted-emails.json');
} catch (err) {
  console.error(err);
}
