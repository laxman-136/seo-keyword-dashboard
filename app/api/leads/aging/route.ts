// app/api/leads/aging/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { getAllLeads, getLeadAgeInDays, STATUS_TO_CATEGORY, COURSE_TO_GROUP } from '@/lib/telecrm-api'

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

    // Load leads from the past 6 months to check for aging
    const now = new Date()
    const fromDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    const toDate = now

    const leads = await getAllLeads(
      { dateRange: { from: fromDate, to: toDate }, course: selectedCourse },
      customToken,
      customEnterpriseId,
      bypassCache
    )

    // Filter to active pending leads for decay calculations (exclude Enrolled and Low/Cold, but include Junk Lead)
    const pendingLeads = leads.filter(lead => {
      if (lead.status === 'Junk Lead') return true
      const cat = STATUS_TO_CATEGORY[lead.status] || 'Fresh/Unqualified'
      return cat !== 'Enrolled' && cat !== 'Low/Cold'
    })

    const totalPending = pendingLeads.length || 1

    const buckets = [
      { bucketLabel: '🔥 Hot (< 7 days)', count: 0, percent: 0, min: 0, max: 7, actionLabel: 'Call immediately' },
      { bucketLabel: '⚡ Warm (7-30 days)', count: 0, percent: 0, min: 7, max: 30, actionLabel: 'Follow up today' },
      { bucketLabel: '🟡 Cooling (30-90 days)', count: 0, percent: 0, min: 30, max: 90, actionLabel: 'Re-engagement call needed' },
      { bucketLabel: '🔴 Cold (90-180 days)', count: 0, percent: 0, min: 90, max: 180, actionLabel: 'WhatsApp blast + last attempt' },
      { bucketLabel: '⚫ Dead (> 180 days)', count: 0, percent: 0, min: 180, max: 9999, actionLabel: 'Archive or bulk campaign' }
    ]

    pendingLeads.forEach(lead => {
      if (lead.status === 'Junk Lead') {
        // Force junk leads directly to the Dead bucket (index 4)
        buckets[4].count++
        return
      }
      const age = getLeadAgeInDays(lead)
      for (const bucket of buckets) {
        if (age >= bucket.min && age < bucket.max) {
          bucket.count++
          break
        }
      }
    })

    buckets.forEach(b => {
      b.percent = parseFloat(((b.count / totalPending) * 100).toFixed(1))
    })

    // Pie chart representation: proportion of unresolved leads by age bracket
    const pieData = buckets.map(b => {
      const cleanName = b.bucketLabel
        .replace('🔥 ', '')
        .replace('⚡ ', '')
        .replace('🟡 ', '')
        .replace('🔴 ', '')
        .replace('⚫ ', '')
      return {
        name: cleanName,
        value: b.count
      }
    })

    // Group leads by status and age bracket for stacked bar chart
    const statusAgeStats: Record<string, { Hot: number; Warm: number; Cooling: number; Cold: number; Dead: number }> = {}
    pendingLeads.forEach(lead => {
      const status = lead.status || 'Fresh'
      if (!statusAgeStats[status]) {
        statusAgeStats[status] = { Hot: 0, Warm: 0, Cooling: 0, Cold: 0, Dead: 0 }
      }
      const stats = statusAgeStats[status]
      if (lead.status === 'Junk Lead') {
        stats.Dead++
      } else {
        const age = getLeadAgeInDays(lead)
        if (age < 7) stats.Hot++
        else if (age < 30) stats.Warm++
        else if (age < 90) stats.Cooling++
        else if (age < 180) stats.Cold++
        else stats.Dead++
      }
    })

    const chartData = Object.entries(statusAgeStats).map(([name, stats]) => ({
      name,
      ...stats
    })).sort((a, b) => {
      const totalA = a.Hot + a.Warm + a.Cooling + a.Cold + a.Dead
      const totalB = b.Hot + b.Warm + b.Cooling + b.Cold + b.Dead
      return totalB - totalA
    })

    // Course pending aging metrics
    const courseStats: Record<string, { totalPending: number; totalAge: number; hotCount: number; warmCount: number; coolingOrOlderCount: number }> = {}
    pendingLeads.forEach(lead => {
      const rawCourse = lead.fields?.course || ''
      const groupName = COURSE_TO_GROUP[rawCourse] || 'Unknown Course'
      const age = getLeadAgeInDays(lead)

      if (!courseStats[groupName]) {
        courseStats[groupName] = { totalPending: 0, totalAge: 0, hotCount: 0, warmCount: 0, coolingOrOlderCount: 0 }
      }

      const stats = courseStats[groupName]
      stats.totalPending++
      stats.totalAge += age

      if (lead.status === 'Junk Lead') {
        stats.coolingOrOlderCount++
      } else {
        if (age < 7) stats.hotCount++
        else if (age < 30) stats.warmCount++
        else stats.coolingOrOlderCount++
      }
    })

    const coursesAging = Object.entries(courseStats).map(([course, stats]) => {
      const avgAge = parseFloat((stats.totalPending > 0 ? stats.totalAge / stats.totalPending : 0).toFixed(1))
      let urgency: 'High' | 'Medium' | 'Low' = 'Low'
      if (avgAge > 60 || stats.coolingOrOlderCount > stats.hotCount * 2) urgency = 'High'
      else if (avgAge > 30) urgency = 'Medium'

      return {
        course,
        totalPending: stats.totalPending,
        avgAge,
        hotCount: stats.hotCount,
        warmCount: stats.warmCount,
        coolingOrOlderCount: stats.coolingOrOlderCount,
        urgency
      }
    }).sort((a, b) => b.avgAge - a.avgAge)

    // Summary KPIs
    const hotCount = buckets[0].count
    const warmCount = buckets[1].count
    const coolingCount = buckets[2].count
    const coldCount = buckets[3].count
    const deadCount = buckets[4].count
    const totalAge = pendingLeads.reduce((sum, l) => sum + getLeadAgeInDays(l), 0)
    const avgAgeDays = pendingLeads.length > 0 ? totalAge / pendingLeads.length : 0

    const summary = {
      totalPending: pendingLeads.length,
      hotCount,
      warmCount,
      coolingCount,
      coldCount,
      deadCount,
      avgAgeDays
    }

    return NextResponse.json({
      buckets,
      chartData,
      pieData,
      coursesAging,
      summary
    }, {
      headers: {
        'Cache-Control': bypassCache 
          ? 'no-store, max-age=0' 
          : 'public, s-maxage=900, stale-while-revalidate=300'
      }
    })
  } catch (error: any) {
    console.error('Aging API error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
