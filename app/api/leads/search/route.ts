// app/api/leads/search/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { searchLeads, TeleCRMApiError } from '@/lib/telecrm-api'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const user = getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let activeLabel = null
    if (user.role === 'viewer') {
      const grants = await getValidAccessGrantsForRecipient(user.email)
      const activeGrant = grants[0]
      if (!activeGrant) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      activeLabel = activeGrant.label
    }

    const isAllowed = isSectionAllowed('leads', user.role, activeLabel)
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const customToken = request.headers.get('x-telecrm-api-token') || undefined
    const customEnterpriseId = request.headers.get('x-telecrm-enterprise-id') || undefined

    const body = await request.json()
    const { filters, pagination } = body

    const result = await searchLeads(filters || {}, pagination || { limit: 100, skip: 0 }, customToken, customEnterpriseId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Leads Search API Route error:', error)
    if (error instanceof TeleCRMApiError || (error && error.name === 'TeleCRMApiError')) {
      const status = error.status === 401 || error.status === 403 || error.status === 404 ? 401 : 500
      return NextResponse.json(
        { error: `TeleCRM Live API: ${error.message}. Please verify your credentials in Settings.` },
        { status }
      )
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
