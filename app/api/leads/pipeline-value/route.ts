// app/api/leads/pipeline-value/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { getAllLeads, STATUS_TO_CATEGORY, COURSE_TO_GROUP } from '@/lib/telecrm-api'

export const dynamic = 'force-dynamic'

export const COURSE_AVG_FEES: Record<string, number> = {
  'Oracle Fusion SCM':        27169,
  'Oracle Fusion HCM':        19929,
  'Oracle Fusion Financials':  21950,
  'Oracle Fusion Technical':   22350,
  'Oracle Fusion PPM':         27857,
  'Oracle Fusion WMS':         25000,
  'Oracle Integration':        22000,
  'SAP':                       18000,
  'default':                   23290,
}

export const CATEGORY_CONV_RATES = {
  'Enrolled': 1.0,
  'High Potential': 0.173,
  'Medium Potential': 0.085,
  'Fresh/Unqualified': 0.012,
  'Low/Cold': 0.002
}

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

    const isAllowed = isSectionAllowed('leads', user.role, activeLabel)
    if (!isAllowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const bypassCache = searchParams.get('refresh') === 'true'
    const customToken = request.headers.get('x-telecrm-api-token') || searchParams.get('telecrmApiToken') || undefined
    const customEnterpriseId = request.headers.get('x-telecrm-enterprise-id') || searchParams.get('telecrmEnterpriseId') || undefined

    // Query past 6 months pipeline
    const now = new Date()
    const fromDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const toDate = now

    const leads = await getAllLeads(
      { dateRange: { from: fromDate, to: toDate } },
      customToken,
      customEnterpriseId,
      bypassCache
    )

    // Filter out already lost/archived leads
    const activePipelineLeads = leads.filter(l => !l.isArchived)

    // Aggr counts and values
    const categoryStats: Record<string, { count: number; totalValue: number; expectedValue: number }> = {
      'Enrolled': { count: 0, totalValue: 0, expectedValue: 0 },
      'High Potential': { count: 0, totalValue: 0, expectedValue: 0 },
      'Medium Potential': { count: 0, totalValue: 0, expectedValue: 0 },
      'Fresh/Unqualified': { count: 0, totalValue: 0, expectedValue: 0 },
      'Low/Cold': { count: 0, totalValue: 0, expectedValue: 0 }
    }

    const courseStats: Record<string, { count: number; totalValue: number; expectedValue: number }> = {}

    activePipelineLeads.forEach(lead => {
      const cat = STATUS_TO_CATEGORY[lead.status] || 'Fresh/Unqualified'
      const rawCourse = lead.fields?.course || ''
      const courseGroup = COURSE_TO_GROUP[rawCourse] || 'Unknown Course'
      const fee = COURSE_AVG_FEES[courseGroup] || COURSE_AVG_FEES['default']
      const convRate = CATEGORY_CONV_RATES[cat] || 0.012

      // Category update
      if (categoryStats[cat]) {
        categoryStats[cat].count++
        categoryStats[cat].totalValue += fee
        categoryStats[cat].expectedValue += fee * convRate
      }

      // Course update
      if (!courseStats[courseGroup]) {
        courseStats[courseGroup] = { count: 0, totalValue: 0, expectedValue: 0 }
      }
      courseStats[courseGroup].count++
      courseStats[courseGroup].totalValue += fee
      courseStats[courseGroup].expectedValue += fee * convRate
    })

    // Calculate aggregated totals
    let totalPipelineValue = 0
    let realisticExpectedValue = 0
    let highPotValue = 0

    Object.entries(categoryStats).forEach(([cat, stats]) => {
      totalPipelineValue += stats.totalValue
      realisticExpectedValue += stats.expectedValue
      if (cat === 'High Potential') {
        highPotValue = stats.expectedValue
      }
    })

    const categoriesTable = Object.entries(categoryStats).map(([category, stats]) => {
      const count = stats.count
      const totalValue = stats.totalValue
      const expectedValue = stats.expectedValue
      const convRate = CATEGORY_CONV_RATES[category as keyof typeof CATEGORY_CONV_RATES] * 100

      return {
        category,
        count,
        avgFee: count > 0 ? Math.round(totalValue / count) : COURSE_AVG_FEES['default'],
        totalValue,
        convRate: parseFloat(convRate.toFixed(1)),
        expectedValue: Math.round(expectedValue)
      }
    })

    const coursesTable = Object.entries(courseStats).map(([course, stats]) => {
      return {
        course,
        count: stats.count,
        totalValue: stats.totalValue,
        expectedValue: Math.round(stats.expectedValue),
        convRate: stats.totalValue > 0 ? parseFloat(((stats.expectedValue / stats.totalValue) * 100).toFixed(1)) : 0
      }
    }).sort((a, b) => b.totalValue - a.totalValue)

    // Pipeline trend chart
    const monthlyTrend: Record<string, { month: string; monthStart: Date; createdValue: number; realizedValue: number }> = {}
    activePipelineLeads.forEach(lead => {
      const createdOn = lead.fields?.created_on || Date.now()
      const date = new Date(createdOn)
      const monthLabel = date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)

      const rawCourse = lead.fields?.course || ''
      const courseGroup = COURSE_TO_GROUP[rawCourse] || 'Unknown Course'
      const fee = COURSE_AVG_FEES[courseGroup] || COURSE_AVG_FEES['default']

      if (!monthlyTrend[monthLabel]) {
        monthlyTrend[monthLabel] = { month: monthLabel, monthStart, createdValue: 0, realizedValue: 0 }
      }
      
      const trend = monthlyTrend[monthLabel]
      trend.createdValue += fee
      if (lead.status === 'Enrolled') {
        trend.realizedValue += fee
      }
    })

    const trendData = Object.values(monthlyTrend)
      .sort((a, b) => a.monthStart.getTime() - b.monthStart.getTime())
      .map(t => ({
        month: t.month,
        createdValue: Math.round(t.createdValue),
        realizedValue: Math.round(t.realizedValue)
      }))

    return NextResponse.json({
      kpis: {
        totalPipelineValue,
        realisticExpectedValue: Math.round(realisticExpectedValue),
        highPotValue: Math.round(highPotValue),
        avgFee: COURSE_AVG_FEES['default']
      },
      categoriesTable,
      coursesTable,
      trendData
    }, {
      headers: {
        'Cache-Control': bypassCache 
          ? 'no-store, max-age=0' 
          : 'public, s-maxage=900, stale-while-revalidate=300'
      }
    })
  } catch (error: any) {
    console.error('Pipeline Value API error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
