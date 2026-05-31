// scripts/reset-password.js
// Resets a user's password directly in data/users.json
const crypto = require('crypto')
const fs     = require('fs')
const path   = require('path')

// ── Config ───────────────────────────────────────────────────────────────────
const EMAIL        = process.argv[2]
const NEW_PASSWORD = process.argv[3]

if (!EMAIL || !NEW_PASSWORD) {
  console.error('Usage: node scripts/reset-password.js <email> <new-password>')
  process.exit(1)
}

// ── Hash (same algorithm as lib/auth.ts) ─────────────────────────────────────
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

// ── Update DB ─────────────────────────────────────────────────────────────────
const filePath = path.join(__dirname, '..', 'data', 'users.json')

if (!fs.existsSync(filePath)) {
  console.error('data/users.json not found. Start the dev server first to generate it.')
  process.exit(1)
}

const users = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
const idx   = users.findIndex(u => u.email.toLowerCase() === EMAIL.toLowerCase())

if (idx < 0) {
  console.error(`User not found: ${EMAIL}`)
  console.log('Existing users:', users.map(u => u.email).join(', '))
  process.exit(1)
}

users[idx].passwordHash = hashPassword(NEW_PASSWORD)
fs.writeFileSync(filePath, JSON.stringify(users, null, 2))

console.log(`✓ Password reset successfully for: ${users[idx].name} (${EMAIL})`)
console.log(`  New password: ${NEW_PASSWORD}`)
console.log(`  Role: ${users[idx].role} | Status: ${users[idx].status}`)
