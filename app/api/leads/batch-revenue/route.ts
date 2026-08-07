import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { getAllLeads, getCourseGroup } from '@/lib/telecrm-api'

export const dynamic = 'force-dynamic'

function parseAmount(val: any): number {
  if (!val) return 0
  const cleaned = String(val).replace(/,/g, '').trim()
  return parseFloat(cleaned) || 0
}

function getBatchName(num: number | string): string {
  const parsed = parseInt(String(num), 10)
  if (isNaN(parsed)) return String(num)
  const s = ['th', 'st', 'nd', 'rd']
  const v = parsed % 100
  const suffix = s[(v - 20) % 10] || s[v] || s[0]
  return `${parsed}${suffix} Batch`
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
      if (!activeGrant) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      activeLabel = activeGrant.label
    }

    const isAllowed = isSectionAllowed('revenue', user.role, activeLabel)
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const bypassCache = searchParams.get('refresh') === 'true'
    const selectedYearStr = searchParams.get('year') || 'all'
    const customToken = request.headers.get('x-telecrm-api-token') || searchParams.get('telecrmApiToken') || undefined
    const customEnterpriseId = request.headers.get('x-telecrm-enterprise-id') || searchParams.get('telecrmEnterpriseId') || undefined

    const leads = await getAllLeads(
      { status: 'Enrolled' },
      customToken,
      customEnterpriseId,
      bypassCache
    )

    const batchMap: Record<string, {
      courseName: string
      batchNo: string
      conversions: number
      revenue: number
    }> = {}

    leads.forEach(lead => {
      const isEnrolled = lead.status === 'Enrolled'
      if (!isEnrolled) return

      // --- Course 1 ---
      const batchNum1 = lead.fields?.batch_number
      if (batchNum1) {
        const enrollDateVal = lead.fields?.course_enrollment_date
        let enrollYear1 = null
        if (enrollDateVal) {
          enrollYear1 = new Date(enrollDateVal).getFullYear()
        } else {
          const fallbackDate = lead.fields?.lead_date || lead.fields?.created_on
          if (fallbackDate) enrollYear1 = new Date(fallbackDate).getFullYear()
        }

        if (selectedYearStr !== 'all') {
          const targetYear = parseInt(selectedYearStr, 10)
          if (enrollYear1 && enrollYear1 !== targetYear) {
            // Return from callback to skip Course 1
            return
          }
        }

        const batchName = getBatchName(batchNum1)
        const courseName = getCourseGroup(lead.fields?.course || '')
        const mapKey = `${courseName}|${batchName}`
        
        if (!batchMap[mapKey]) {
          batchMap[mapKey] = {
            courseName,
            batchNo: batchName,
            conversions: 0,
            revenue: 0
          }
        }
        
        batchMap[mapKey].conversions += 1
        const cash = parseAmount(lead.fields?.amount_paid) + parseAmount(lead.fields?.amount_paid_emi_2)
        batchMap[mapKey].revenue += cash
      }

      // --- Course 2 ---
      const batchName2 = lead.fields?.course_2_batch_name
      if (batchName2) {
        const enroll2DateVal = lead.fields?.course_2_enrollment_date || lead.fields?.course_2_enroll_date || lead.fields?.course2_enrollment_date
        let enroll2Ms = 0
        if (enroll2DateVal) {
          if (typeof enroll2DateVal === 'number') {
            enroll2Ms = enroll2DateVal
          } else if (typeof enroll2DateVal === 'string') {
            const parts = enroll2DateVal.split(/[-/]/)
            if (parts.length === 3) {
              const day = parseInt(parts[0], 10)
              const month = parseInt(parts[1], 10) - 1
              const year = parseInt(parts[2], 10)
              enroll2Ms = new Date(year, month, day).getTime()
            }
          }
        }

        let enrollYear2 = null
        if (enroll2Ms) {
          enrollYear2 = new Date(enroll2Ms).getFullYear()
        } else {
          const fallbackDate = lead.fields?.created_on
          if (fallbackDate) enrollYear2 = new Date(fallbackDate).getFullYear()
        }

        if (selectedYearStr !== 'all') {
          const targetYear = parseInt(selectedYearStr, 10)
          if (enrollYear2 && enrollYear2 !== targetYear) {
            // Return from callback to skip Course 2
            return
          }
        }

        const formattedBatchName = getBatchName(batchName2)
        const courseName2 = getCourseGroup(lead.fields?.course_name_2 || lead.fields?.course_2_name || lead.fields?.course2_name || '')
        const mapKey2 = `${courseName2}|${formattedBatchName}`
        
        if (!batchMap[mapKey2]) {
          batchMap[mapKey2] = {
            courseName: courseName2,
            batchNo: formattedBatchName,
            conversions: 0,
            revenue: 0
          }
        }
        
        batchMap[mapKey2].conversions += 1
        const cash2 = parseAmount(lead.fields?.amount_paid_emi_1_course_2) + parseAmount(lead.fields?.amount_paid_emi_2_course_2)
        batchMap[mapKey2].revenue += cash2
      }
    })

    const aggregated = Object.values(batchMap).map(b => ({
      courseName: b.courseName,
      batchNo: b.batchNo,
      conversions: b.conversions,
      revenue: b.revenue,
      avgFee: b.conversions > 0 ? Math.round(b.revenue / b.conversions) : 0
    }))

    // Sort by Course Name first, then by Batch number
    aggregated.sort((a, b) => {
      const courseComp = a.courseName.localeCompare(b.courseName)
      if (courseComp !== 0) return courseComp
      return a.batchNo.localeCompare(b.batchNo, undefined, { numeric: true, sensitivity: 'base' })
    })

    return NextResponse.json({
      batches: aggregated,
      isMock: leads.some(l => l.id.startsWith('mock-lead')),
      lastUpdated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': bypassCache 
          ? 'no-store, max-age=0' 
          : 'public, s-maxage=900, stale-while-revalidate=300'
      }
    })
  } catch (error: any) {
    console.error('Leads Batch Revenue GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
