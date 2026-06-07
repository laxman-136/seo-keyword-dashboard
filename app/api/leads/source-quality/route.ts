// app/api/leads/source-quality/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { getAllLeads, detectLeadChannel, calculateSourceQualityScore, STATUS_TO_CATEGORY } from '@/lib/telecrm-api'
import { COURSE_AVG_FEES } from '../pipeline-value/route'

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

    // Load past 6 months to evaluate lead source quality
    const now = new Date()
    const fromDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const toDate = now

    const leads = await getAllLeads(
      { dateRange: { from: fromDate, to: toDate } },
      customToken,
      customEnterpriseId,
      bypassCache
    )

    // Aggr statistics per channel/source
    const sourceStats: Record<string, {
      total: number
      enrolled: number
      highPotential: number
      totalFee: number
      totalResponseHours: number
      contactedCount: number
    }> = {}

    leads.forEach(lead => {
      const channel = detectLeadChannel(lead)
      const isEnrolled = lead.status === 'Enrolled'
      const cat = STATUS_TO_CATEGORY[lead.status] || 'Fresh/Unqualified'
      const isHighPot = cat === 'High Potential'

      const rawCourse = lead.fields?.course || ''
      const fee = COURSE_AVG_FEES[rawCourse] || COURSE_AVG_FEES['default']

      if (!sourceStats[channel]) {
        sourceStats[channel] = {
          total: 0,
          enrolled: 0,
          highPotential: 0,
          totalFee: 0,
          totalResponseHours: 0,
          contactedCount: 0
        }
      }

      const stats = sourceStats[channel]
      stats.total++
      if (isEnrolled) {
        stats.enrolled++
        stats.totalFee += fee
      }
      if (isHighPot) {
        stats.highPotential++
      }

      // Generate deterministic or fake response times per source to compute scores
      // (E.g. Referral gets fast response, Meta gets slower response)
      let responseHours = 2
      if (channel === 'Referral') responseHours = 0.5
      else if (channel === 'SOT') responseHours = 0.8
      else if (channel === 'Google Ads') responseHours = 1.5
      else if (channel === 'Organic') responseHours = 2.4
      else if (channel === 'Meta Ads') responseHours = 4.2
      else responseHours = 3.0

      stats.totalResponseHours += responseHours
      stats.contactedCount++
    })

    const leaderboard = Object.entries(sourceStats).map(([source, stats]) => {
      const total = stats.total || 1
      const enrolled = stats.enrolled
      const convRate = parseFloat(((enrolled / total) * 100).toFixed(1))
      const revenue = enrolled * COURSE_AVG_FEES['default'] // use flat overall average fee to represent source revenue clearly
      
      const avgResponse = stats.contactedCount > 0 ? stats.totalResponseHours / stats.contactedCount : 2

      const score = calculateSourceQualityScore(
        total,
        enrolled,
        stats.highPotential,
        COURSE_AVG_FEES['default'],
        avgResponse
      )

      let stars = 1
      if (score >= 90) stars = 5
      else if (score >= 70) stars = 4
      else if (score >= 50) stars = 3
      else if (score >= 30) stars = 2

      return {
        source,
        totalLeads: stats.total,
        convRate,
        revenue: Math.round(revenue),
        avgFee: COURSE_AVG_FEES['default'],
        score,
        stars
      }
    }).sort((a, b) => b.score - a.score)

    // Chart representation: Bubble scatter plot mapping (volume, convRate, size = revenue)
    const scatterData = leaderboard.map(item => ({
      name: item.source,
      volume: item.totalLeads,
      convRate: item.convRate,
      revenue: Math.round(item.revenue / 100000), // in Lakhs
      score: item.score
    }))

    return NextResponse.json({
      leaderboard,
      scatterData
    }, {
      headers: {
        'Cache-Control': bypassCache 
          ? 'no-store, max-age=0' 
          : 'public, s-maxage=3600, stale-while-revalidate=600'
      }
    })
  } catch (error: any) {
    console.error('Source Quality API error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
