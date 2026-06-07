const fs = require('fs');
const readline = require('readline');

async function run() {
  const fileStream = fs.createReadStream('C:/Users/DELL/.gemini/antigravity/brain/af9d7db8-682b-4f9f-bda7-468ff9f5da97/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const out = fs.createWriteStream('C:/Users/DELL/.gemini/antigravity/scratch/seo-keyword-dashboard/scratch/autoupdate-results.txt');

  let lineCount = 0;
  let matchCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (line.includes('autoupdate/v2') || line.includes('telecrm-api.ts')) {
      matchCount++;
      const parsed = JSON.parse(line);
      out.write(`Match ${matchCount} (Line ${lineCount}, Step ${parsed.step_index}, Type ${parsed.type}): ${line.slice(0, 500)}...\n`);
    }
  }
  out.end();
  console.log(`Finished. Found ${matchCount} matches.`);
}

run();
