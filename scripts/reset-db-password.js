// scripts/reset-db-password.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EMAIL = process.argv[2];
const NEW_PASSWORD = process.argv[3];

if (!EMAIL || !NEW_PASSWORD) {
  console.error('Usage: node scripts/reset-db-password.js <email> <new-password>');
  process.exit(1);
}

// Hash function matching lib/auth.ts
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Load env
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx > 0) {
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    env[key] = value;
  }
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const emailLower = EMAIL.toLowerCase();
  
  // Check if user exists
  const { data: user, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('email', emailLower)
    .single();

  if (findError || !user) {
    console.error(`User not found: ${EMAIL}`);
    process.exit(1);
  }

  const newHash = hashPassword(NEW_PASSWORD);

  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: newHash })
    .eq('email', emailLower);

  if (updateError) {
    console.error('Failed to update password:', updateError);
    process.exit(1);
  }

  console.log(`✓ Password reset successfully for: ${user.name} (${EMAIL})`);
  console.log(`  New password set successfully.`);
}

run();
