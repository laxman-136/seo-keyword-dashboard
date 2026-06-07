// app/api/leads/course-demand/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { getAllLeads, COURSE_TO_GROUP, STATUS_TO_CATEGORY } from '@/lib/telecrm-api'

export const dynamic = 'force-dynamic'

const COURSE_DETAILS: Record<string, { batch: string; faculty: string }> = {
  'Oracle Fusion SCM':        { batch: '74th', faculty: 'Krishna' },
  'Oracle Fusion HCM':        { batch: '69th', faculty: 'Sumesh Raj' },
  'Oracle Fusion Financials':  { batch: '79th', faculty: 'Venkatesh' },
  'Oracle Fusion Technical':   { batch: '54th', faculty: 'Ravi Kumar' },
  'Oracle Fusion PPM':         { batch: '12th', faculty: 'Srinivas' },
  'Oracle Fusion WMS':         { batch: '8th',  faculty: 'Krishna' },
  'Oracle Integration':        { batch: '24th', faculty: 'Siva' },
  'SAP':                       { batch: '14th', faculty: 'Ramesh' },
  'Unknown Course':            { batch: '—',    faculty: '—' }
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

    // Load past 6 months to evaluate active batch pipeline
    const now = new Date()
    const fromDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const toDate = now

    const leads = await getAllLeads(
      { dateRange: { from: fromDate, to: toDate } },
      customToken,
      customEnterpriseId,
      bypassCache
    )

    const demandStats: Record<string, {
      total: number
      highPotential: number
      mediumPotential: number
    }> = {}

    // Initialize course groups
    Object.keys(COURSE_DETAILS).forEach(course => {
      demandStats[course] = { total: 0, highPotential: 0, mediumPotential: 0 }
    })

    leads.forEach(lead => {
      const rawCourse = lead.fields?.course || ''
      const courseGroup = COURSE_TO_GROUP[rawCourse] || 'Unknown Course'
      const cat = STATUS_TO_CATEGORY[lead.status] || 'Fresh/Unqualified'

      if (!demandStats[courseGroup]) {
        demandStats[courseGroup] = { total: 0, highPotential: 0, mediumPotential: 0 }
      }

      const stats = demandStats[courseGroup]
      stats.total++
      if (cat === 'High Potential') stats.highPotential++
      if (cat === 'Medium Potential') stats.mediumPotential++
    })

    // Batch size threshold (15 students)
    const minBatchSize = 15

    const batchReadiness = Object.entries(demandStats).map(([course, stats]) => {
      const details = COURSE_DETAILS[course] || { batch: '—', faculty: '—' }
      
      // Enrolment prediction: High potential converts at 17.3%, Medium at 8.5%
      const expectedEnrollments = Math.round((stats.highPotential * 0.173) + (stats.mediumPotential * 0.085))
      
      let status: '✅ BATCH READY' | '🟡 BUILDING' | '🔴 INSUFFICIENT' | '⚫ No data' = '🔴 INSUFFICIENT'
      let estStart = 'Unknown'
      
      if (stats.total === 0) {
        status = '⚫ No data'
      } else if (expectedEnrollments >= minBatchSize) {
        status = '✅ BATCH READY'
        estStart = '2-3 weeks'
      } else if (expectedEnrollments >= 5) {
        status = '🟡 BUILDING'
        const needed = minBatchSize - expectedEnrollments
        estStart = `${needed} more leads needed (${Math.ceil(needed / 2)} weeks)`
      } else {
        status = '🔴 INSUFFICIENT'
        estStart = '4-6 weeks'
      }

      return {
        course,
        currentBatch: details.batch,
        faculty: details.faculty,
        highPotential: stats.highPotential,
        mediumPotential: stats.mediumPotential,
        totalPipeline: stats.total,
        status,
        estStart,
        expectedEnrollments,
        minBatchSize
      }
    }).filter(x => x.totalPipeline > 0 || x.course !== 'Unknown Course')
      .sort((a, b) => b.expectedEnrollments - a.expectedEnrollments)

    return NextResponse.json({
      batchReadiness
    }, {
      headers: {
        'Cache-Control': bypassCache 
          ? 'no-store, max-age=0' 
          : 'public, s-maxage=900, stale-while-revalidate=300'
      }
    })
  } catch (error: any) {
    console.error('Course Demand API error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
