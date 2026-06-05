// scratch/check-supabase.js
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

let supabaseUrl = process.env.SUPABASE_URL
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  try {
    const env = fs.readFileSync('.env.local', 'utf8')
    const urlMatch = env.match(/SUPABASE_URL\s*=\s*(.+)/)
    const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)/)
    if (urlMatch) supabaseUrl = urlMatch[1].trim()
    if (keyMatch) supabaseKey = keyMatch[1].trim()
  } catch (err) {
    console.error('Error reading .env.local:', err.message)
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  try {
    const { data: grants, error: grantsErr } = await supabase.from('access_grants').select('*')
    if (grantsErr) throw grantsErr
    console.log('--- ACCESS GRANTS ---')
    console.log(JSON.stringify(grants, null, 2))

    const { data: users, error: usersErr } = await supabase.from('users').select('*')
    if (usersErr) throw usersErr
    console.log('--- USERS ---')
    console.log(JSON.stringify(users, null, 2))
  } catch (err) {
    console.error('Error querying Supabase:', err)
  }
}

run()
