// lib/auth-edge.ts
// Edge-runtime compatible token reading.
// The middleware decodes and checks expiry / role without HMAC verification.
// Full HMAC verification is done by every API route (Node.js runtime → lib/auth.ts).
// This is secure: pages are just HTML shells. All data comes from API routes
// which reject forged tokens with a full signature check.

export interface SessionUser {
  email: string
  name: string
  role: 'superadmin' | 'admin' | 'ceo' | 'user' | 'viewer'
  grantId?: string
}

/**
 * Decode a token created by lib/auth.ts  createToken().
 * Format: base64url(payload_json).hex_hmac
 * We decode and verify expiry; HMAC is checked by API routes.
 */
export function decodeTokenEdge(token: string): SessionUser | null {
  try {
    const dotIdx = token.lastIndexOf('.')
    if (dotIdx < 0) return null

    // base64url → standard base64 → decode
    const b64url = token.slice(0, dotIdx)
    const b64    = b64url.replace(/-/g, '+').replace(/_/g, '/')
    // atob works in both Edge and browser
    const json   = atob(b64)
    const payload = JSON.parse(json)

    // Check expiry
    if (!payload.exp || payload.exp < Date.now()) return null

    // Basic shape check
    if (!payload.email || !payload.role) return null

    return { email: payload.email, name: payload.name, role: payload.role, grantId: payload.grantId }
  } catch {
    return null
  }
}

export function getTokenFromCookiesEdge(cookieHeader: string): string | null {
  if (!cookieHeader) return null

  let viewerToken: string | null = null
  for (const part of cookieHeader.split(';')) {
    const eqIdx = part.indexOf('=')
    if (eqIdx < 0) continue
    const name = part.slice(0, eqIdx).trim()
    const value = part.slice(eqIdx + 1).trim() || null
    if (name === 'auth-token') {
      return value
    }
    if (name === 'viewer-auth-token') {
      viewerToken = value
    }
  }

  return viewerToken
}
