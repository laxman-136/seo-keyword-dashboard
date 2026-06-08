// app/api/analytics/overview/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { resolveDateRange } from '@/lib/dateRange'
import { fetchGA4Overview, fetchGA4DailyTrend, fetchGA4Geography, fetchGA4Devices } from '@/lib/ga4-api'

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

    const [overview, trendData, geoData, deviceData] = await Promise.all([
      fetchGA4Overview(dateRange, bypassCache),
      fetchGA4DailyTrend(dateRange, bypassCache),
      fetchGA4Geography(dateRange, bypassCache),
      fetchGA4Devices(dateRange, bypassCache)
    ])

    return NextResponse.json({
      overview,
      trendData,
      geoData,
      deviceData
    })
  } catch (error: any) {
    console.error('GA4 Overview API error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
