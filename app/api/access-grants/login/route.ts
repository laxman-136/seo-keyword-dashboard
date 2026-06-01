// app/api/access-grants/login/route.ts
import { NextResponse } from 'next/server'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { createToken, makeViewerAuthCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function isValidEmail(value: any) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body?.email || '').trim().toLowerCase()

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
    }

    const grants = await getValidAccessGrantsForRecipient(email)
    if (!Array.isArray(grants) || grants.length === 0) {
      return NextResponse.json({ error: 'No active viewer grants found for this email.' }, { status: 401 })
    }

    // Create a viewer session (role: viewer)
    const token = createToken({ email, name: grants[0].recipientEmail || email, role: 'viewer' })
    const cookie = makeViewerAuthCookie(token)

    return NextResponse.json({ success: true }, { headers: { 'Set-Cookie': cookie } })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
