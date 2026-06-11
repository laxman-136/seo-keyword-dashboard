// app/api/leads/best-time/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { getAllLeads, detectLeadChannel } from '@/lib/telecrm-api'

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

    // Load past 6 months to get a solid volume for day/hour profiling
    const now = new Date()
    const fromDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const toDate = now

    const leads = await getAllLeads(
      { dateRange: { from: fromDate, to: toDate }, course: selectedCourse },
      customToken,
      customEnterpriseId,
      bypassCache
    )

    // Day mapping (0-6) and Hour mapping (0-23)
    const dayStats: Record<number, { count: number; enrolled: number }> = {}
    const hourStats: Record<number, { count: number; enrolled: number }> = {}
    
    // Grid maps day-hour combined (7 days × 24 hours)
    const grid: Record<string, number> = {}

    // Initialize structures
    for (let d = 0; d < 7; d++) {
      dayStats[d] = { count: 0, enrolled: 0 }
      for (let h = 0; h < 24; h++) {
        grid[`${d}-${h}`] = 0
      }
    }
    for (let h = 0; h < 24; h++) {
      hourStats[h] = { count: 0, enrolled: 0 }
    }

    leads.forEach(lead => {
      const createdOn = lead.fields?.created_on || Date.now()
      const isEnrolled = lead.status === 'Enrolled'

      // Convert UTC timestamp to IST Date
      const istDate = new Date(createdOn + 19800000)
      const day = istDate.getUTCDay()
      const hour = istDate.getUTCHours()

      dayStats[day].count++
      if (isEnrolled) dayStats[day].enrolled++

      hourStats[hour].count++
      if (isEnrolled) hourStats[hour].enrolled++

      grid[`${day}-${hour}`]++
    })

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const dayOfWeekData = Object.entries(dayStats).map(([dStr, stats]) => {
      const dayIdx = parseInt(dStr, 10)
      return {
        day: dayLabels[dayIdx],
        count: stats.count,
        convRate: stats.count > 0 ? parseFloat(((stats.enrolled / stats.count) * 100).toFixed(1)) : 0,
        enrolled: stats.enrolled
      }
    })

    const hourlyData = Object.entries(hourStats).map(([hStr, stats]) => {
      const hr = parseInt(hStr, 10)
      const label = hr === 0 ? '12 AM' : hr === 12 ? '12 PM' : hr > 12 ? `${hr - 12} PM` : `${hr} AM`
      return {
        hour: label,
        hourVal: hr,
        count: stats.count,
        convRate: stats.count > 0 ? parseFloat(((stats.enrolled / stats.count) * 100).toFixed(1)) : 0,
        enrolled: stats.enrolled
      }
    }).sort((a, b) => a.hourVal - b.hourVal)

    // Flat list for India heatmap representation
    const heatmapGrid = Object.entries(grid).map(([key, count]) => {
      const [day, hour] = key.split('-').map(x => parseInt(x, 10))
      return {
        day: dayLabels[day],
        dayVal: day,
        hour,
        count
      }
    })

    // Find highlights
    const bestDayLeadsObj = [...dayOfWeekData].sort((a, b) => b.count - a.count)[0]
    const bestDayConvObj = [...dayOfWeekData].sort((a, b) => b.convRate - a.convRate)[0]
    const bestHourObj = [...hourlyData].sort((a, b) => b.count - a.count)[0]

    return NextResponse.json({
      highlights: {
        bestDayLeads: bestDayLeadsObj?.day || 'Mon',
        bestDayConv: bestDayConvObj?.day || 'Mon',
        bestHour: bestHourObj?.hour || '6 PM',
        avoidTime: '1 AM - 6 AM'
      },
      dayOfWeekData,
      hourlyData,
      heatmapGrid
    }, {
      headers: {
        'Cache-Control': bypassCache 
          ? 'no-store, max-age=0' 
          : 'public, s-maxage=3600, stale-while-revalidate=600'
      }
    })
  } catch (error: any) {
    console.error('Best Time API error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
