// lib/user-store.ts
// Database-backed user storage using Supabase PostgreSQL
// Works on both local dev and Vercel

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { User, UserRole, hashPassword } from './auth'

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not configured. Using fallback mode.')
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

// ─── Pre-seeded Admin Accounts ──────────────────────────────────────────────
const DEFAULT_PASSWORD = 'Admin@123'

function buildSeedUsers(): User[] {
  return [
    {
      email: 'laxmansubramanyam@gmail.com',
      name: 'Laxman Subramanyam',
      passwordHash: hashPassword(DEFAULT_PASSWORD),
      role: 'superadmin' as UserRole,
      status: 'approved',
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: 'system'
    },
    {
      email: 'veerasubramanyam.aki@techleadsit.com',
      name: 'Veerasubramanyam AKI',
      passwordHash: hashPassword(DEFAULT_PASSWORD),
      role: 'admin' as UserRole,
      status: 'approved',
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: 'system'
    }
  ]
}

// ─── Convert DB rows to User objects ────────────────────────────────────────

function dbRowToUser(row: any): User {
  return {
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by
  }
}

// ─── User DB Operations ────────────────────────────────────────────────────

export async function ensureSeedUsers(): Promise<void> {
  if (!supabase) return

  try {
    const { data: existing } = await supabase
      .from('users')
      .select('email')
      .limit(1)

    // If users table is empty, seed it
    if (!existing || existing.length === 0) {
      const seed = buildSeedUsers()
      for (const user of seed) {
        await supabase.from('users').insert({
          email: user.email,
          name: user.name,
          password_hash: user.passwordHash,
          role: user.role,
          status: user.status,
          created_at: user.createdAt,
          approved_at: user.approvedAt,
          approved_by: user.approvedBy
        })
      }
    }
  } catch (err) {
    console.error('Error seeding users:', err)
  }
}

export async function getAllUsers(): Promise<User[]> {
  if (!supabase) return []

  try {
    await ensureSeedUsers()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(dbRowToUser)
  } catch (err) {
    console.error('Error fetching all users:', err)
    return []
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
    return data ? dbRowToUser(data) : null
  } catch (err) {
    console.error('Error fetching user:', err)
    return null
  }
}

export async function addUser(user: User): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Database not configured' }

  try {
    const existing = await getUserByEmail(user.email)
    if (existing) return { ok: false, error: 'Email already registered.' }

    const { error } = await supabase.from('users').insert({
      email: user.email,
      name: user.name,
      password_hash: user.passwordHash,
      role: user.role,
      status: user.status,
      created_at: user.createdAt,
      approved_at: user.approvedAt,
      approved_by: user.approvedBy
    })

    if (error) throw error
    return { ok: true }
  } catch (err: any) {
    console.error('Error adding user:', err)
    return { ok: false, error: err.message || 'Failed to create user' }
  }
}

export async function updateUser(email: string, updates: Partial<User>): Promise<boolean> {
  if (!supabase) return false

  try {
    const dbUpdates: any = {}
    if (updates.passwordHash) dbUpdates.password_hash = updates.passwordHash
    if (updates.status) dbUpdates.status = updates.status
    if (updates.role) dbUpdates.role = updates.role
    if (updates.approvedAt) dbUpdates.approved_at = updates.approvedAt
    if (updates.approvedBy) dbUpdates.approved_by = updates.approvedBy

    dbUpdates.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('email', email.toLowerCase())

    if (error) throw error
    return true
  } catch (err) {
    console.error('Error updating user:', err)
    return false
  }
}

export async function deleteUser(email: string): Promise<boolean> {
  if (!supabase) return false

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('email', email.toLowerCase())

    if (error) throw error
    return true
  } catch (err) {
    console.error('Error deleting user:', err)
    return false
  }
}

export function exportUsersAsEnvVar(): string {
  // Legacy support - not used with Supabase
  return ''
}

// Token store for password-reset / email-verification (simple in-memory map)
const tokenStore = new Map<string, { email: string; exp: number }>()

export function createResetToken(email: string): string {
  const token = crypto.randomBytes(32).toString('hex')
  tokenStore.set(token, { email, exp: Date.now() + 60 * 60 * 1000 }) // 1 hour
  return token
}

export function consumeResetToken(token: string): string | null {
  const entry = tokenStore.get(token)
  if (!entry || entry.exp < Date.now()) return null
  tokenStore.delete(token)
  return entry.email
}

