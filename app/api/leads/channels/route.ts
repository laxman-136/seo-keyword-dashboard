// app/api/leads/channels/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { getChannelBreakdown, TeleCRMApiError } from '@/lib/telecrm-api'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const bypassCache = searchParams.get('refresh') === 'true'
    const customToken = request.headers.get('x-telecrm-api-token') || searchParams.get('telecrmApiToken') || undefined
    const customEnterpriseId = request.headers.get('x-telecrm-enterprise-id') || searchParams.get('telecrmEnterpriseId') || undefined
    const selectedCourse = searchParams.get('course') || undefined

    const fromStr = searchParams.get('from')
    const toStr = searchParams.get('to')

    if (!fromStr || !toStr) {
      return NextResponse.json({ error: 'Missing from or to date parameter' }, { status: 400 })
    }

    const fromDate = new Date(fromStr)
    const toDate = new Date(toStr)

    const channels = await getChannelBreakdown({ from: fromDate, to: toDate }, customToken, customEnterpriseId, bypassCache, selectedCourse)

    return NextResponse.json(channels, {
      headers: {
        'Cache-Control': bypassCache 
          ? 'no-store, max-age=0' 
          : 'public, s-maxage=900, stale-while-revalidate=300'
      }
    })
  } catch (error: any) {
    console.error('Leads Channels API Route error:', error)
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
