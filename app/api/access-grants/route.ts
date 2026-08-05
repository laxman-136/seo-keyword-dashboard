// app/api/access-grants/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import {
  getValidAccessGrantsForRecipient,
  getAccessGrantsByOwner,
  createAccessGrant,
  revokeAccessGrant
} from '@/lib/access-store'

export const dynamic = 'force-dynamic'

function requireUser(request: Request) {
  const user = getCurrentUser(request)
  if (!user) return { error: 'Unauthorized', status: 401, user: null }
  return { error: null, status: 200, user }
}

function isValidEmail(value: string) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export async function GET(request: Request) {
  const { error, status, user } = requireUser(request)
  if (error || !user) return NextResponse.json({ error }, { status })

  // Quick server-side sanity check: ensure Supabase env vars exist
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server not configured for database access (SUPABASE_URL / KEY missing).' }, { status: 500 })
  }

  const url = new URL(request.url)
  const owned = url.searchParams.get('owned') === 'true'
  const sheetId = url.searchParams.get('sheetId') || undefined

  if (owned) {
    const grants = await getAccessGrantsByOwner(user.email, sheetId)
    return NextResponse.json({ grants })
  }

  const grants = await getValidAccessGrantsForRecipient(user.email)
  return NextResponse.json({ grants })
}

export async function POST(request: Request) {
  const { error, status, user } = requireUser(request)
  if (error || !user) return NextResponse.json({ error }, { status })

  // Quick server-side sanity check: ensure Supabase env vars exist
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server not configured for database access (SUPABASE_URL / KEY missing).' }, { status: 500 })
  }

  const body = await request.json()
  const action = body?.action

  if (action === 'grant') {
    const recipientEmail = String(body.recipientEmail || '').trim().toLowerCase()
    const seoSheetId = String(body.seoSheetId || '').trim()
    const leadsSheetId = String(body.leadsSheetId || '').trim()
    const revenueSheetId = String(body.revenueSheetId || '').trim()
    const apiKey = String(body.apiKey || '').trim()
    const label = String(body.label || '').trim()
    const durationDays = Number(body.durationDays || 0)
    const allowedSections: string[] = Array.isArray(body.allowedSections) ? body.allowedSections : []

    if (user.role === 'viewer') {
      return NextResponse.json({ error: 'Viewer role is not allowed to share access.' }, { status: 403 })
    }

    const finalAllowedSections = user.role === 'user'
      ? (allowedSections.length > 0 ? allowedSections.filter(s => ['keywords', 'traffic'].includes(s)) : ['keywords', 'traffic'])
      : allowedSections

    const finalSeoSheetId = seoSheetId
    const finalLeadsSheetId = user.role === 'user' ? '' : leadsSheetId
    const finalRevenueSheetId = user.role === 'user' ? '' : revenueSheetId

    if (!isValidEmail(recipientEmail)) {
      return NextResponse.json({ error: 'A valid recipient email is required.' }, { status: 400 })
    }
    if ((!finalSeoSheetId && !finalLeadsSheetId && !finalRevenueSheetId) || !apiKey || !label) {
      return NextResponse.json({ error: 'At least one active sheet configuration and an API key are required.' }, { status: 400 })
    }
    if (![15, 30, 90, 36500].includes(durationDays)) {
      return NextResponse.json({ error: 'Duration must be 15, 30, 90 days, or Infinite.' }, { status: 400 })
    }

    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
    
    const encodedLabel = finalAllowedSections.length > 0
      ? `${label} | allowed:${finalAllowedSections.join(',')}`
      : label

    try {
      const grant = await createAccessGrant({
        recipientEmail,
        ownerEmail: user.email,
        label: encodedLabel,
        seoSheetId: finalSeoSheetId || undefined,
        leadsSheetId: finalLeadsSheetId || undefined,
        revenueSheetId: finalRevenueSheetId || undefined,
        sheetId: finalSeoSheetId || '', // keep for legacy compatibility
        apiKey,
        expiresAt
      })

      return NextResponse.json({ success: true, grant })
    } catch (rawErr: any) {
      const msg = String(rawErr?.message || '')
      const lower = msg.toLowerCase()
      let clientMsg = 'Unable to create access grant. Check server logs.'

      if (lower.includes('permission denied') || lower.includes('forbidden')) {
        clientMsg = 'Database permission error. Ensure server-side Supabase key and table policies allow inserts.'
      } else if (lower.includes('no relation') || lower.includes('does not exist')) {
        clientMsg = 'Database table missing. Ensure `access_grants` table exists in Supabase.'
      } else if (lower.includes('duplicate') || lower.includes('unique')) {
        clientMsg = 'A similar grant already exists.'
      } else if (lower.includes('invalid input') || lower.includes('invalid')) {
        clientMsg = 'Invalid grant data supplied.'
      } else if (lower.includes('no grant data returned')) {
        clientMsg = 'Unexpected database response. See server logs for details.'
      }

      return NextResponse.json({ error: clientMsg }, { status: 500 })
    }
  }

  if (action === 'revoke') {
    const id = String(body.id || '').trim()
    if (!id) {
      return NextResponse.json({ error: 'Grant ID is required.' }, { status: 400 })
    }

    try {
      const revoked = await revokeAccessGrant(id)
      if (!revoked) {
        return NextResponse.json({ error: 'Unable to revoke grant.' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    } catch (rawErr: any) {
      const msg = String(rawErr?.message || '')
      const lower = msg.toLowerCase()
      const clientMsg = lower.includes('permission')
        ? 'Database permission error when revoking. Check server key and policies.'
        : 'Unable to revoke grant. See server logs.'
      return NextResponse.json({ error: clientMsg }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}
