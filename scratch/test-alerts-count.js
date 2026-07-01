const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '../.env.local');
const envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const firstEquals = trimmed.indexOf('=');
    if (firstEquals === -1) return;
    const key = trimmed.substring(0, firstEquals).trim();
    const val = trimmed.substring(firstEquals + 1).trim().replace(/^['"]|['"]$/g, '');
    envVars[key] = val;
  });
}

const supabaseUrl = envVars.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAlerts() {
  const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
  console.log('Active Config:', config ? config.label : 'None');

  // Let's call the local API route by calling its internal functions
  // Or we can start the Next dev server in the background and request it, or mock request/response!
  // Wait, the API route is `/api/ads/intelligence/alerts` which maps to route === 'alerts'.
  // Let's just import the handler from app/api/ads/intelligence/[route]/route.ts!
  // But since it's Next.js App Router route, importing it directly might require next.js runtime.
  // Instead, let's write a script that replicates the logic of getCRMStats() and alerts generation!
  // Let's see: does the alerts logic generate many alerts?
  // Let's look at the alert generation code. It only generates low prepaid balance, tracking offline, frequency fatigue, CPL spike, and budget pacing alerts (max 10-15 alerts total).
  // It won't be 196.
}

testAlerts();
