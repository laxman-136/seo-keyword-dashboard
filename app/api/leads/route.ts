// app/api/leads/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { getFunnelData, getChannelBreakdown, TeleCRMApiError } from '@/lib/telecrm-api'
import { fetchLeadsMonthly, fetchLeadsDetail } from '@/lib/sheets'

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
    
    // Check if Google Sheets is explicitly requested via sheetId
    const sheetId = searchParams.get('sheetId') || undefined
    const apiKey = searchParams.get('apiKey') || undefined

    if (sheetId) {
      const monthlyData = await fetchLeadsMonthly(bypassCache, sheetId === 'mock' ? undefined : sheetId, apiKey)
      const detailData = await fetchLeadsDetail(bypassCache, sheetId === 'mock' ? undefined : sheetId, apiKey)

      return NextResponse.json({
        monthly: monthlyData.rows,
        detail: detailData.rows,
        isMock: monthlyData.isMock || detailData.isMock,
        lastUpdated: monthlyData.lastUpdated,
        fallbackReason: monthlyData.fallbackReason
      }, {
        headers: {
          'Cache-Control': bypassCache 
            ? 'no-store, max-age=0' 
            : 'public, s-maxage=900, stale-while-revalidate=300'
        }
      })
    }

    const customToken = request.headers.get('x-telecrm-api-token') || searchParams.get('telecrmApiToken') || undefined
    const customEnterpriseId = request.headers.get('x-telecrm-enterprise-id') || searchParams.get('telecrmEnterpriseId') || undefined
    const selectedCourse = searchParams.get('course') || undefined

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
      getFunnelData({ from: fromDate, to: toDate }, customToken, customEnterpriseId, bypassCache, selectedCourse),
      getChannelBreakdown({ from: fromDate, to: toDate }, customToken, customEnterpriseId, bypassCache, selectedCourse),
      getFunnelData({ from: prevFromDate, to: prevToDate }, customToken, customEnterpriseId, bypassCache, selectedCourse),
      getChannelBreakdown({ from: prevFromDate, to: prevToDate }, customToken, customEnterpriseId, bypassCache, selectedCourse)
    ])

    // Calculate ads vs website vs organic vs llm
    const getAdsCount = (channels: any[]) => {
      const gads = channels.find((c: any) => c.channel === 'Google Ads')?.total || 0
      const fb = channels.find((c: any) => c.channel === 'Meta Ads')?.total || 0
      return gads + fb
    }

    const currentAds = getAdsCount(currentChannels)
    const currentWebsite = currentChannels.find((c: any) => c.channel === 'Website')?.total || 0
    const currentLLM = currentChannels.find((c: any) => c.channel === 'LLM')?.total || 0
    const currentOrganic = currentFunnel.total - currentAds - currentWebsite - currentLLM

    const prevAds = getAdsCount(prevChannels)
    const prevWebsite = prevChannels.find((c: any) => c.channel === 'Website')?.total || 0
    const prevLLM = prevChannels.find((c: any) => c.channel === 'LLM')?.total || 0
    const prevOrganic = prevFunnel.total - prevAds - prevWebsite - prevLLM

    return NextResponse.json({
      kpi: {
        totalLeads: currentFunnel.total,
        adsLeads: currentAds,
        websiteLeads: currentWebsite,
        organicLeads: currentOrganic,
        llmLeads: currentLLM,
        enrolled: currentFunnel.enrolled,
        highPotential: currentFunnel.highPotential,
        mediumPotential: currentFunnel.mediumPotential,
        freshUnqualified: currentFunnel.freshUnqualified,
        lowCold: currentFunnel.lowCold,
        convRate: currentFunnel.convRate,
        
        prevTotalLeads: prevFunnel.total,
        prevAdsLeads: prevAds,
        prevWebsiteLeads: prevWebsite,
        prevOrganicLeads: prevOrganic,
        prevLLMLeads: prevLLM,
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
