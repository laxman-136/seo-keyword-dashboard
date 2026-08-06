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

const GROUP_TO_FACULTY: Record<string, string> = {
  'Oracle Fusion SCM': 'Krishna',
  'Oracle Fusion HCM': 'Sumesh Raj',
  'Oracle Fusion Financials': 'Srinivas, Bhasha',
  'Oracle Fusion Technical': 'Vijay, Nageshwar',
  'Oracle Fusion WMS': 'Harish',
  'Oracle Fusion PPM': 'Srinivas',
  'Oracle TMS': 'Krishna',
  'Oracle EBS': 'Srinivas',
  'SAP': 'Vijay',
  'Oracle Apex': 'Nageshwar',
  'Oracle Integration': 'Vijay'
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
    const customToken = request.headers.get('x-telecrm-api-token') || searchParams.get('telecrmApiToken') || undefined
    const customEnterpriseId = request.headers.get('x-telecrm-enterprise-id') || searchParams.get('telecrmEnterpriseId') || undefined

    const leads = await getAllLeads(
      undefined,
      customToken,
      customEnterpriseId,
      bypassCache
    )

    const batchMap: Record<string, {
      batchNo: string
      faculty: Set<string>
      conversions: number
      revenue: number
      adSpend: number
      avgFee: number
      roas: number
    }> = {}

    leads.forEach(lead => {
      const isEnrolled = lead.status === 'Enrolled'
      if (!isEnrolled) return

      // --- Course 1 ---
      const batchNum1 = lead.fields?.batch_number
      if (batchNum1) {
        const batchName = getBatchName(batchNum1)
        if (!batchMap[batchName]) {
          batchMap[batchName] = {
            batchNo: batchName,
            faculty: new Set(),
            conversions: 0,
            revenue: 0,
            adSpend: 0,
            avgFee: 0,
            roas: 0
          }
        }
        batchMap[batchName].conversions += 1
        
        const cash = parseAmount(lead.fields?.amount_paid) + parseAmount(lead.fields?.amount_paid_emi_2)
        batchMap[batchName].revenue += cash
        
        const courseGroup = getCourseGroup(lead.fields?.course || '')
        const faculty = GROUP_TO_FACULTY[courseGroup] || 'Guest Faculty'
        faculty.split(',').forEach(f => {
          const trimmed = f.trim()
          if (trimmed) batchMap[batchName].faculty.add(trimmed)
        })
      }

      // --- Course 2 ---
      const batchName2 = lead.fields?.course_2_batch_name
      if (batchName2) {
        const formattedBatchName = getBatchName(batchName2)
        if (!batchMap[formattedBatchName]) {
          batchMap[formattedBatchName] = {
            batchNo: formattedBatchName,
            faculty: new Set(),
            conversions: 0,
            revenue: 0,
            adSpend: 0,
            avgFee: 0,
            roas: 0
          }
        }
        batchMap[formattedBatchName].conversions += 1
        
        const cash2 = parseAmount(lead.fields?.amount_paid_emi_1_course_2) + parseAmount(lead.fields?.amount_paid_emi_2_course_2)
        batchMap[formattedBatchName].revenue += cash2
        
        const courseName2 = lead.fields?.course_name_2 || lead.fields?.course_2_name || lead.fields?.course2_name || ''
        const courseGroup2 = getCourseGroup(courseName2)
        const faculty2 = GROUP_TO_FACULTY[courseGroup2] || 'Guest Faculty'
        faculty2.split(',').forEach(f => {
          const trimmed = f.trim()
          if (trimmed) batchMap[formattedBatchName].faculty.add(trimmed)
        })
      }
    })

    const aggregated = Object.values(batchMap).map(b => ({
      batchNo: b.batchNo,
      faculty: Array.from(b.faculty).join(', '),
      conversions: b.conversions,
      revenue: b.revenue,
      adSpend: 0,
      avgFee: b.conversions > 0 ? Math.round(b.revenue / b.conversions) : 0,
      roas: 0
    }))

    aggregated.sort((a, b) => a.batchNo.localeCompare(b.batchNo, undefined, { numeric: true, sensitivity: 'base' }))

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
