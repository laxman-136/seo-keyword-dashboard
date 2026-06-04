// scripts/update-admin-password.js
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// ── Configuration ────────────────────────────────────────────────────────────
const EMAIL = 'laxmansubramanyam@gmail.com';
const NEW_PASSWORD = 'Admin@2024!';

// ── Hash function (matches pbkdf2 signature in lib/auth.ts) ───────────────────
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

const newHash = hashPassword(NEW_PASSWORD);
console.log(`Generated password hash for ${NEW_PASSWORD}:`);
console.log(newHash);

// ── 1. Update Local users.json ────────────────────────────────────────────────
const localJsonPath = path.join(__dirname, '..', 'data', 'users.json');
if (fs.existsSync(localJsonPath)) {
  try {
    const users = JSON.parse(fs.readFileSync(localJsonPath, 'utf8'));
    const idx = users.findIndex(u => u.email.toLowerCase() === EMAIL.toLowerCase());
    if (idx >= 0) {
      users[idx].passwordHash = newHash;
      fs.writeFileSync(localJsonPath, JSON.stringify(users, null, 2), 'utf8');
      console.log('✓ Successfully updated local data/users.json');
    } else {
      console.log(`⚠ User ${EMAIL} not found in data/users.json`);
    }
  } catch (err) {
    console.error('Error updating data/users.json:', err);
  }
} else {
  console.log('data/users.json does not exist. Skipping local update.');
}

// ── 2. Update Supabase Database ──────────────────────────────────────────────
// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Skipping remote database update.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log(`Updating password in Supabase for user: ${EMAIL}...`);
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ password_hash: newHash })
      .eq('email', EMAIL.toLowerCase())
      .select();

    if (error) {
      console.error('Error updating password in Supabase:', error);
    } else if (data && data.length > 0) {
      console.log('✓ Successfully updated password in Supabase for user:', data[0].email);
    } else {
      console.log(`⚠ No user with email ${EMAIL} found in Supabase users table.`);
    }
  } catch (err) {
    console.error('Catch error during Supabase update:', err);
  }
}

run();
