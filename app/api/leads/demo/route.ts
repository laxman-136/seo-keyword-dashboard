// app/api/leads/demo/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { getAllLeads, COURSE_TO_GROUP } from '@/lib/telecrm-api'

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

    const isAllowed = isSectionAllowed('leads', user.role, activeLabel)
    if (!isAllowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const bypassCache = searchParams.get('refresh') === 'true'
    const customToken = request.headers.get('x-telecrm-api-token') || searchParams.get('telecrmApiToken') || undefined
    const customEnterpriseId = request.headers.get('x-telecrm-enterprise-id') || searchParams.get('telecrmEnterpriseId') || undefined
    const selectedCourse = searchParams.get('course') || undefined

    // Load past 6 months to get a good volume of demo events
    const now = new Date()
    const fromDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const toDate = now

    const leads = await getAllLeads(
      { dateRange: { from: fromDate, to: toDate }, course: selectedCourse },
      customToken,
      customEnterpriseId,
      bypassCache
    )

    // Stage counts
    const totalLeads = leads.length
    let interested = 0
    let attended = 0
    let postDemoHighPot = 0
    let enrolled = 0

    // Course level stats
    const courseStats: Record<string, { total: number; interested: number; attended: number; enrolled: number }> = {}

    leads.forEach(lead => {
      const status = lead.status
      const rawCourse = lead.fields?.course || ''
      const courseGroup = COURSE_TO_GROUP[rawCourse] || 'Unknown Course'

      if (!courseStats[courseGroup]) {
        courseStats[courseGroup] = { total: 0, interested: 0, attended: 0, enrolled: 0 }
      }
      const cs = courseStats[courseGroup]
      cs.total++

      if (status === 'Interested to join the Demo') {
        interested++
        cs.interested++
      } else if (status === 'Demo Attended') {
        attended++
        cs.attended++
      } else if (['Potential Lead 100', '60-80 Potential'].includes(status)) {
        postDemoHighPot++
      } else if (status === 'Enrolled') {
        enrolled++
        cs.enrolled++
      }
    })

    // To make demo conversion funnel realistic, we include demo attended leads in conversion pools
    // Since some leads attend demos directly without marking "interested", we adjust funnel stages:
    const interestedCount = interested + attended + enrolled
    const attendedCount = attended + enrolled
    const enrolledCount = enrolled

    const divisor = totalLeads || 1
    const stages = [
      { stage: 'Total Leads', count: totalLeads, percent: 100, label: 'Lead Entered' },
      { stage: 'Interested in Demo', count: interestedCount, percent: parseFloat(((interestedCount / divisor) * 100).toFixed(1)), label: 'Expressed interest' },
      { stage: 'Demo Attended', count: attendedCount, percent: parseFloat(((attendedCount / divisor) * 100).toFixed(1)), label: 'Attended live training batch' },
      { stage: 'Post-Demo Lead', count: attendedCount + postDemoHighPot, percent: parseFloat((((attendedCount + postDemoHighPot) / divisor) * 100).toFixed(1)), label: 'Highly qualified after demo' },
      { stage: 'Enrolled', count: enrolledCount, percent: parseFloat(((enrolledCount / divisor) * 100).toFixed(1)), label: 'Paid & registered' }
    ]

    // Stage Conversion Cards Rates
    const convLeadToInterest = totalLeads > 0 ? parseFloat(((interestedCount / totalLeads) * 100).toFixed(1)) : 0
    const convInterestToAttend = interestedCount > 0 ? parseFloat(((attendedCount / interestedCount) * 100).toFixed(1)) : 0
    const convAttendToEnroll = attendedCount > 0 ? parseFloat(((enrolledCount / attendedCount) * 100).toFixed(1)) : 0
    const convOverall = totalLeads > 0 ? parseFloat(((enrolledCount / totalLeads) * 100).toFixed(1)) : 0

    // Course table data mapping
    const courseDemoData = Object.entries(courseStats).map(([course, stats]) => {
      const total = stats.total || 1
      const countAttended = stats.attended + stats.enrolled
      const attendRate = parseFloat(((countAttended / total) * 100).toFixed(1))
      const demoToEnroll = countAttended > 0 ? parseFloat(((stats.enrolled / countAttended) * 100).toFixed(1)) : 0

      let qualityScore: '🟢 Excellent' | '🟢 Strong' | '🟡 Good' | '⚫ No data' = '⚫ No data'
      if (stats.enrolled > 5 && demoToEnroll > 50) qualityScore = '🟢 Excellent'
      else if (demoToEnroll > 40) qualityScore = '🟢 Strong'
      else if (countAttended > 0) qualityScore = '🟡 Good'

      return {
        course,
        totalLeads: stats.total,
        demoAttended: countAttended,
        enrolled: stats.enrolled,
        attendRate,
        demoToEnroll,
        qualityScore
      }
    }).sort((a, b) => b.totalLeads - a.totalLeads)

    // Monthly demo attend vs enrolled trend chart (last 6 months)
    const monthlyTrend: Record<string, { month: string; monthStart: Date; attended: number; enrolled: number }> = {}
    leads.forEach(lead => {
      const createdOn = lead.fields?.created_on || Date.now()
      const date = new Date(createdOn)
      const monthLabel = date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)

      if (!monthlyTrend[monthLabel]) {
        monthlyTrend[monthLabel] = { month: monthLabel, monthStart, attended: 0, enrolled: 0 }
      }
      const trend = monthlyTrend[monthLabel]
      if (lead.status === 'Demo Attended') trend.attended++
      if (lead.status === 'Enrolled') {
        trend.enrolled++
        trend.attended++ // assume enrolled leads attended demo too
      }
    })

    const trendData = Object.values(monthlyTrend)
      .sort((a, b) => a.monthStart.getTime() - b.monthStart.getTime())
      .map(t => ({
        month: t.month,
        demoAttended: t.attended,
        enrolled: t.enrolled
      }))

    return NextResponse.json({
      stages,
      kpis: {
        convLeadToInterest,
        convInterestToAttend,
        convAttendToEnroll,
        convOverall
      },
      courseDemoData,
      trendData
    }, {
      headers: {
        'Cache-Control': bypassCache 
          ? 'no-store, max-age=0' 
          : 'public, s-maxage=900, stale-while-revalidate=300'
      }
    })
  } catch (error: any) {
    console.error('Demo API error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
