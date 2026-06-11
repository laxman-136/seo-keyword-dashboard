// app/api/leads/prediction/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { getAllLeads, scoreLead, getLeadAgeInDays, detectLeadChannel, COURSE_TO_GROUP } from '@/lib/telecrm-api'

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

    // Load past 90 days leads to score them
    const now = new Date()
    const fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90)
    const toDate = now

    const leads = await getAllLeads(
      { dateRange: { from: fromDate, to: toDate }, course: selectedCourse },
      customToken,
      customEnterpriseId,
      bypassCache
    )

    // Score all leads
    const scoredLeads = leads.map(lead => {
      const scoreObj = scoreLead(lead)
      const ageDays = getLeadAgeInDays(lead)
      const channel = detectLeadChannel(lead)
      const course = lead.fields?.course ? (COURSE_TO_GROUP[lead.fields.course] || lead.fields.course) : 'Unknown Course'
      
      // Mask last name for data privacy
      const nameParts = (lead.fields?.name || 'Inquiry').split(' ')
      const obfuscatedName = nameParts.length > 1 
        ? `${nameParts[0]} ${nameParts[1].charAt(0)}.` 
        : nameParts[0]

      return {
        leadId: lead.id,
        name: obfuscatedName,
        course,
        status: lead.status || 'Fresh',
        ageDays: Math.round(ageDays),
        source: channel,
        score: scoreObj.score,
        category: scoreObj.category,
        factors: scoreObj.factors
      }
    })

    // Aggregations
    const distribution = [
      { id: 'high', label: '🔥 High (80-100)', count: scoredLeads.filter(l => l.category === 'high').length, action: 'Call Today', color: '#ef4444' },
      { id: 'medium', label: '⚡ Med (50-79)', count: scoredLeads.filter(l => l.category === 'medium').length, action: 'This week', color: '#3b82f6' },
      { id: 'low', label: '🟡 Low (20-49)', count: scoredLeads.filter(l => l.category === 'low').length, action: 'Monitor only', color: '#eab308' },
      { id: 'very_low', label: '⚫ Very Low (< 20)', count: scoredLeads.filter(l => l.category === 'very_low').length, action: 'Archive', color: '#6b7280' }
    ]

    // Sort scored leads to get leaderboard
    const highProbLeads = [...scoredLeads]
      .filter(l => !['Enrolled', 'Not Interested', 'Junk Lead', 'Wrong Number &Number Not working'].includes(l.status))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)

    return NextResponse.json({
      distribution,
      highProbLeads,
      totalScored: scoredLeads.length
    }, {
      headers: {
        'Cache-Control': bypassCache 
          ? 'no-store, max-age=0' 
          : 'public, s-maxage=900, stale-while-revalidate=300'
      }
    })
  } catch (error: any) {
    console.error('Prediction API error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
