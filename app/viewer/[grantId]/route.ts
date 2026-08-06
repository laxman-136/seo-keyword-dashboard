import { NextResponse } from 'next/server'
import { getValidAccessGrantById } from '@/lib/access-store'
import { createToken, makeViewerAuthCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, context: { params: Promise<{ grantId: string }> }) {
  try {
    const { grantId } = await context.params
    if (!grantId) {
      return NextResponse.json({ error: 'Grant ID is required.' }, { status: 400 })
    }

    const grant = await getValidAccessGrantById(grantId)
    if (!grant) {
      return NextResponse.json({ error: 'Invalid or expired access link.' }, { status: 404 })
    }

    const token = createToken({
      email: grant.recipientEmail,
      name: grant.recipientEmail,
      role: 'viewer',
      grantId: grantId
    })
    const cookie = makeViewerAuthCookie(token)

    const url = new URL(request.url)
    const redirectTo = url.searchParams.get('from') || '/'
    const redirectUrl = new URL(redirectTo, request.url)

    return NextResponse.redirect(redirectUrl, {
      headers: { 'Set-Cookie': cookie }
    })
  } catch (err) {
    return NextResponse.json({ error: 'Unable to sign in via access link.' }, { status: 500 })
  }
}
