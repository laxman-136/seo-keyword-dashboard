// app/api/analytics/traffic-sources/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { resolveDateRange } from '@/lib/dateRange'
import { fetchGA4TrafficSources, fetchGA4Conversions } from '@/lib/ga4-api'

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
      if (!activeGrant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      activeLabel = activeGrant.label
    }

    const isAllowed = isSectionAllowed('traffic', user.role, activeLabel)
    if (!isAllowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const fromStr = searchParams.get('from')
    const toStr = searchParams.get('to')
    const preset = (searchParams.get('preset') as any) || 'last_7_days'
    const bypassCache = searchParams.get('refresh') === 'true'
    const dateRange = resolveDateRange(preset, fromStr || undefined, toStr || undefined)

    const [trafficSources, conversions] = await Promise.all([
      fetchGA4TrafficSources(dateRange, bypassCache),
      fetchGA4Conversions(dateRange, bypassCache)
    ])

    return NextResponse.json({
      trafficSources,
      conversions
    })
  } catch (error: any) {
    console.error('GA4 Traffic Sources API error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
