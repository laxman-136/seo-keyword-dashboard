// app/api/leads/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { getFunnelData, getChannelBreakdown, TeleCRMApiError } from '@/lib/telecrm-api'

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

    const fromStr = searchParams.get('from')
    const toStr = searchParams.get('to')

    let fromDate: Date
    let toDate: Date

    if (fromStr && toStr) {
      fromDate = new Date(fromStr)
      toDate = new Date(toStr)
    } else {
      // Default to this month
      const now = new Date()
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
      toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    const durationMs = toDate.getTime() - fromDate.getTime() + 1
    const prevFromDate = new Date(fromDate.getTime() - durationMs)
    const prevToDate = new Date(toDate.getTime() - durationMs)

    const [currentFunnel, currentChannels, prevFunnel, prevChannels] = await Promise.all([
      getFunnelData({ from: fromDate, to: toDate }, customToken, customEnterpriseId, bypassCache),
      getChannelBreakdown({ from: fromDate, to: toDate }, customToken, customEnterpriseId, bypassCache),
      getFunnelData({ from: prevFromDate, to: prevToDate }, customToken, customEnterpriseId, bypassCache),
      getChannelBreakdown({ from: prevFromDate, to: prevToDate }, customToken, customEnterpriseId, bypassCache)
    ])

    // Calculate website vs organic
    const getWebsiteCount = (channels: any[]) => {
      const web = channels.find((c: any) => c.channel === 'Website')?.total || 0
      const gads = channels.find((c: any) => c.channel === 'Google Ads')?.total || 0
      const fb = channels.find((c: any) => c.channel === 'Meta Ads')?.total || 0
      return web + gads + fb
    }

    const currentWebsite = getWebsiteCount(currentChannels)
    const currentOrganic = currentFunnel.total - currentWebsite

    const prevWebsite = getWebsiteCount(prevChannels)
    const prevOrganic = prevFunnel.total - prevWebsite

    return NextResponse.json({
      kpi: {
        totalLeads: currentFunnel.total,
        websiteLeads: currentWebsite,
        organicLeads: currentOrganic,
        enrolled: currentFunnel.enrolled,
        highPotential: currentFunnel.highPotential,
        mediumPotential: currentFunnel.mediumPotential,
        freshUnqualified: currentFunnel.freshUnqualified,
        lowCold: currentFunnel.lowCold,
        convRate: currentFunnel.convRate,
        
        prevTotalLeads: prevFunnel.total,
        prevWebsiteLeads: prevWebsite,
        prevOrganicLeads: prevOrganic,
        prevEnrolled: prevFunnel.enrolled,
        prevHighPotential: prevFunnel.highPotential,
        prevConvRate: prevFunnel.convRate
      },
      funnel: currentFunnel,
      channels: currentChannels,
      dataSource: 'telecrm'
    }, {
      headers: {
        'Cache-Control': bypassCache 
          ? 'no-store, max-age=0' 
          : 'public, s-maxage=900, stale-while-revalidate=300'
      }
    })
  } catch (error: any) {
    console.error('Leads API Route error:', error)
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
