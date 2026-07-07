async function run() {
  try {
    const url = 'http://localhost:3000/api/keywords?refresh=true';
    console.log(`Sending GET request to ${url}...`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Success! Keywords retrieved:', data.rows ? data.rows.length : 0);
    if (data.rows && data.rows.length > 0) {
      console.log('\nFirst 5 enriched keywords:');
      data.rows.slice(0, 5).forEach((kw, idx) => {
        console.log(`[${idx+1}] Keyword: "${kw.keyword}"`);
        console.log(`    Volume: ${kw.searchVolume}`);
        console.log(`    Competition: ${kw.competition} (Index: ${kw.competitionIndex})`);
        console.log(`    Monthly Search Volume History count: ${kw.monthlySearchVolumes ? kw.monthlySearchVolumes.length : 0}`);
      });
    }
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

run();
