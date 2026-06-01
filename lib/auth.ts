// lib/auth.ts
// Core authentication utilities using Node.js crypto (no external packages)
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'seo-dashboard-secret-change-in-production'

export type UserRole = 'superadmin' | 'admin' | 'user' | 'viewer'
export type UserStatus = 'approved' | 'pending' | 'rejected'

export interface User {
  email: string
  name: string
  passwordHash: string
  role: UserRole
  status: UserStatus
  createdAt: string
  approvedAt?: string
  approvedBy?: string
}

export interface SessionUser {
  email: string
  name: string
  role: UserRole
}

// ─── Password Hashing ───────────────────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':')
    if (!salt || !hash) return false
    const computed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'))
  } catch {
    return false
  }
}

// ─── Session Tokens (signed with HMAC) ──────────────────────────────────────

export function createToken(user: SessionUser): string {
  const payload = {
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('hex')
  return `${data}.${sig}`
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const dotIdx = token.lastIndexOf('.')
    if (dotIdx < 0) return null
    const data = token.slice(0, dotIdx)
    const sig = token.slice(dotIdx + 1)
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('hex')
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) return null
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString())
    if (!payload.exp || payload.exp < Date.now()) return null
    return { email: payload.email, name: payload.name, role: payload.role }
  } catch {
    return null
  }
}

function getCookieValue(cookieHeader: string, name: string): string | null {
  if (!cookieHeader) return null
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const eqIdx = c.indexOf('=')
      return [c.slice(0, eqIdx).trim(), c.slice(eqIdx + 1).trim()]
    })
  )
  return cookies[name] || null
}

export function getTokenFromCookies(cookieHeader: string): string | null {
  return getCookieValue(cookieHeader, 'auth-token') || getCookieValue(cookieHeader, 'viewer-auth-token')
}

export function getViewerTokenFromCookies(cookieHeader: string): string | null {
  return getCookieValue(cookieHeader, 'viewer-auth-token')
}

export function getCurrentUser(request: Request): SessionUser | null {
  const cookieHeader = request.headers.get('cookie') || ''
  const token = getTokenFromCookies(cookieHeader)
  if (!token) return null
  return verifyToken(token)
}

export function makeAuthCookie(token: string): string {
  return `auth-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
}

export function makeViewerAuthCookie(token: string): string {
  return `viewer-auth-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
}

export function makeClearCookie(): string {
  return `auth-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

export function makeClearViewerCookie(): string {
  return `viewer-auth-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}
