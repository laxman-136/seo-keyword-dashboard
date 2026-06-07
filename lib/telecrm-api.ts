// lib/telecrm-api.ts
import { 
  TeleCRMLead, LeadsMonthlyTrend, LeadsFunnelData, 
  LeadsCourseBreakdown, LeadsChannelBreakdown, 
  LeadCategory, LeadChannel, LeadsMonthlyRow
} from './types'
import { getOrSetCache } from './cache'
import { fetchLeadsMonthly } from './sheets'

const BASE = 'https://next.telecrm.in/autoupdate/v2'

// ── STATUS TO CATEGORY MAPPING ────────────────────────────
export const STATUS_TO_CATEGORY: Record<string, LeadCategory> = {
  'Enrolled':                                    'Enrolled',
  'Interested to join the Demo':                 'High Potential',
  'Potential Lead 100':                          'High Potential',
  'Demo Attended':                               'High Potential',
  '60-80 Potential':                             'High Potential',
  'Looking for Next batch':                      'Medium Potential',
  '50 % Potential':                              'Medium Potential',
  'below 50 % Potential':                        'Medium Potential',
  'Fresh':                                       'Fresh/Unqualified',
  'Call not answered and Shared the Data':       'Fresh/Unqualified',
  'Number is not working and sent an email':     'Fresh/Unqualified',
  'Not Interested':                              'Low/Cold',
  'Junk Lead':                                   'Low/Cold',
  'Different Course':                            'Low/Cold',
  'Wrong Number &Number Not working':            'Low/Cold',
  'Lost':                                        'Low/Cold',
}

// ── SOURCE TO CHANNEL MAPPING ─────────────────────────────
export const SOURCE_TO_CHANNEL: Record<string, LeadChannel> = {
  'Organic':                    'Organic',
  'Organic- Chatbot':           'Organic',
  'Website':                    'Website',
  'Referral':                   'Referral',
  'Gads-Lead Form-SCM':         'Google Ads',
  'Gads-Lead Form-HCM':         'Google Ads',
  'Gads-Lead Form-Technical':   'Google Ads',
  'googletech':                 'Google Ads',
  'googlescm':                  'Google Ads',
  'SOT':                        'SOT',
}

// ── COURSE TO GROUP MAPPING ───────────────────────────────
export const COURSE_TO_GROUP: Record<string, string> = {
  'Oracle Fusion Financial Course':                   'Oracle Fusion Financials',
  'Oracle Fusion SCM Course':                         'Oracle Fusion SCM',
  'Oracle Fusion Technical OIC Training':             'Oracle Fusion Technical',
  'Oracle Fusion Technical + OIC Training':           'Oracle Fusion Technical',
  'Oracle Fusion HCM':                                'Oracle Fusion HCM',
  'Oracle Fusion HCM Online Training':                'Oracle Fusion HCM',
  'Oracle Fusion WMS Cloud Logfire Training Course':  'Oracle Fusion WMS',
  'Oracle Fusion PPM Projects Training':              'Oracle Fusion PPM',
  'Oracle Transportation Management Cloud online training Course': 'Oracle TMS',
  'Oracle EBS R12 Financials':                        'Oracle EBS',
  'Master SAP ABAP Training':                         'SAP',
  'Oracle Fusion Technical Training':                 'Oracle Fusion Technical',
  'Oracle Integration Cloud Online Training Course':  'Oracle Integration',
}

// ── CORE UTILS ───────────────────────────────────────────

function getStartOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function getEndOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function getCurrentMonthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { from, to }
}

// Channel detection helper
export function detectLeadChannel(lead: TeleCRMLead): LeadChannel {
  const fields = lead.fields || {}
  
  if (fields.fbclid) return 'Meta Ads'
  if (fields.google_gcl_id) return 'Google Ads'
  if (fields.utmsource === 'google') return 'Google Ads'
  if (fields.utmsource === 'an') return 'Meta Ads'
  
  const sourceRaw = fields.lead_source_1
  if (sourceRaw) {
    const lower = sourceRaw.toLowerCase()
    if (lower.includes('gads') || lower.includes('google')) {
      return 'Google Ads'
    }
    return SOURCE_TO_CHANNEL[sourceRaw] || 'Other'
  }
  
  return 'Other'
}

// Resolves credentials (client-side passed vs server-side variables)
function getCredentials(customToken?: string, customEnterpriseId?: string) {
  const token = customToken || process.env.TELECRM_API_TOKEN || ''
  const enterpriseId = customEnterpriseId || process.env.TELECRM_ENTERPRISE_ID || ''
  return { token, enterpriseId }
}

export class TeleCRMApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'TeleCRMApiError';
    this.status = status;
  }
}

// ── CORE SEARCH FUNCTION ──────────────────────────────────
export async function searchLeads(
  filters: {
    status?: string | string[]
    lead_source_1?: string | string[]
    course?: string
    created_on?: { from: number; to: number }
    lead_date?: { from: number; to: number }
  },
  pagination = { limit: 100, skip: 0 },
  customToken?: string,
  customEnterpriseId?: string
): Promise<{ data: TeleCRMLead[]; total_count: number }> {
  const { token, enterpriseId } = getCredentials(customToken, customEnterpriseId)
  
  if (!token || !enterpriseId) {
    // If no credentials are set, return mock empty data structure
    return { data: [], total_count: 0 }
  }

  const url = `${BASE}/enterprise/${enterpriseId}/lead/search?limit=${pagination.limit}&skip=${pagination.skip}`
  const body = {
    fields: filters
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new TeleCRMApiError(response.status, `TeleCRM Search API responded with status ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// ── HIGH LEVEL FUNCTIONS ──────────────────────────────────

// Get total count for a date range
export async function getLeadCount(
  dateRange?: { from: Date; to: Date },
  customToken?: string,
  customEnterpriseId?: string,
  bypassCache = false
): Promise<number> {
  const { token, enterpriseId } = getCredentials(customToken, customEnterpriseId)
  const fromStr = dateRange ? getStartOfDay(dateRange.from).getTime() : 0
  const toStr = dateRange ? getEndOfDay(dateRange.to).getTime() : 0
  
  const cacheKey = `telecrm_count_${fromStr}_${toStr}_${enterpriseId}`
  
  const res = await getOrSetCache(
    cacheKey,
    async () => {
      const filters: any = {}
      if (dateRange) {
        filters.created_on = { from: fromStr, to: toStr }
      }
      const apiRes = await searchLeads(filters, { limit: 1, skip: 0 }, customToken, customEnterpriseId)
      return apiRes.total_count
    },
    bypassCache,
    900 * 1000 // 15 mins
  )
  
  return res.data
}

// Get count by status (all stages)
export async function getCountByStatus(
  dateRange?: { from: Date; to: Date },
  customToken?: string,
  customEnterpriseId?: string,
  bypassCache = false
): Promise<Record<string, number>> {
  const range = dateRange || getCurrentMonthRange()
  const leads = await getAllLeadsForPeriod(range, customToken, customEnterpriseId, bypassCache)
  
  const counts: Record<string, number> = {}
  
  // Pre-initialize all mapped statuses to 0 to ensure they are returned
  const uniqueStatuses = Array.from(new Set(Object.keys(STATUS_TO_CATEGORY)))
  uniqueStatuses.forEach(status => {
    counts[status] = 0
  })
  
  leads.forEach(lead => {
    const status = lead.status || 'Other'
    counts[status] = (counts[status] || 0) + 1
  })
  
  return counts
}

// Get count by category (mapped)
export async function getCountByCategory(
  dateRange?: { from: Date; to: Date },
  customToken?: string,
  customEnterpriseId?: string,
  bypassCache = false
): Promise<Record<LeadCategory, number>> {
  const statusCounts = await getCountByStatus(dateRange, customToken, customEnterpriseId, bypassCache)
  
  const categoryCounts: Record<LeadCategory, number> = {
    'Enrolled': 0,
    'High Potential': 0,
    'Medium Potential': 0,
    'Fresh/Unqualified': 0,
    'Low/Cold': 0
  }
  
  for (const [status, count] of Object.entries(statusCounts)) {
    const cat = STATUS_TO_CATEGORY[status] || 'Low/Cold'
    categoryCounts[cat] += count
  }
  
  return categoryCounts
}

// Paginate through ALL leads for a date range
export async function getAllLeadsForPeriod(
  dateRange: { from: Date; to: Date },
  customToken?: string,
  customEnterpriseId?: string,
  bypassCache = false
): Promise<TeleCRMLead[]> {
  const { token, enterpriseId } = getCredentials(customToken, customEnterpriseId)
  const fromMs = getStartOfDay(dateRange.from).getTime()
  const toMs = getEndOfDay(dateRange.to).getTime()
  
  const cacheKey = `telecrm_all_leads_${fromMs}_${toMs}_${enterpriseId}`
  
  const res = await getOrSetCache(
    cacheKey,
    async () => {
      const leads: TeleCRMLead[] = []
      let skip = 0
      const limit = 100
      const filters = {
        created_on: { from: fromMs, to: toMs }
      }
      
      while (true) {
        const apiRes = await searchLeads(filters, { limit, skip }, customToken, customEnterpriseId)
        leads.push(...apiRes.data)
        if (leads.length >= apiRes.total_count || apiRes.data.length < limit) {
          break
        }
        skip += limit
      }
      return leads
    },
    bypassCache,
    900 * 1000
  )
  
  return res.data
}

// Get count by channel
export async function getCountByChannel(
  dateRange?: { from: Date; to: Date },
  customToken?: string,
  customEnterpriseId?: string,
  bypassCache = false
): Promise<Record<LeadChannel, number>> {
  const range = dateRange || getCurrentMonthRange()
  const leads = await getAllLeadsForPeriod(range, customToken, customEnterpriseId, bypassCache)
  
  const counts: Record<LeadChannel, number> = {
    'Organic': 0,
    'Website': 0,
    'Google Ads': 0,
    'Meta Ads': 0,
    'Referral': 0,
    'SOT': 0,
    'Other': 0
  }
  
  leads.forEach(lead => {
    const ch = detectLeadChannel(lead)
    counts[ch] = (counts[ch] || 0) + 1
  })
  
  return counts
}

// Get count by course group
export async function getCountByCourse(
  dateRange?: { from: Date; to: Date },
  customToken?: string,
  customEnterpriseId?: string,
  bypassCache = false
): Promise<Record<string, number>> {
  const range = dateRange || getCurrentMonthRange()
  const leads = await getAllLeadsForPeriod(range, customToken, customEnterpriseId, bypassCache)
  
  const counts: Record<string, number> = {}
  leads.forEach(lead => {
    const rawCourse = lead.fields?.course || ''
    const groupName = COURSE_TO_GROUP[rawCourse] || 'Unknown Course'
    counts[groupName] = (counts[groupName] || 0) + 1
  })
  
  return counts
}

// Get enrolled count (= conversions)
export async function getEnrolledCount(
  dateRange?: { from: Date; to: Date },
  customToken?: string,
  customEnterpriseId?: string,
  bypassCache = false
): Promise<number> {
  const { token, enterpriseId } = getCredentials(customToken, customEnterpriseId)
  const fromMs = dateRange ? getStartOfDay(dateRange.from).getTime() : 0
  const toMs = dateRange ? getEndOfDay(dateRange.to).getTime() : 0
  
  const cacheKey = `telecrm_enrolled_count_${fromMs}_${toMs}_${enterpriseId}`
  
  const res = await getOrSetCache(
    cacheKey,
    async () => {
      const filters: any = { status: 'Enrolled' }
      if (dateRange) {
        filters.created_on = { from: fromMs, to: toMs }
      }
      const apiRes = await searchLeads(filters, { limit: 1, skip: 0 }, customToken, customEnterpriseId)
      return apiRes.total_count
    },
    bypassCache,
    900 * 1000
  )
  
  return res.data
}

// Get monthly trend — group by month
export async function getMonthlyTrend(
  months: number = 6,
  customToken?: string,
  customEnterpriseId?: string,
  bypassCache = false
): Promise<LeadsMonthlyTrend[]> {
  const { token, enterpriseId } = getCredentials(customToken, customEnterpriseId)
  
  const cacheKey = `telecrm_monthly_trend_${months}_${enterpriseId}`
  
  const res = await getOrSetCache(
    cacheKey,
    async () => {
      const trend: LeadsMonthlyTrend[] = []
      const promises: Promise<void>[] = []
      
      const now = new Date()
      for (let i = 0; i < months; i++) {
        const year = now.getFullYear()
        const monthIdx = now.getMonth() - i
        
        const monthStart = new Date(year, monthIdx, 1)
        const monthEnd = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999)
        const monthLabel = monthStart.toLocaleString('en-US', { month: 'short', year: 'numeric' }) // e.g. "May 2026"
        
        promises.push(
          (async () => {
            const range = { from: monthStart, to: monthEnd }
            
            // Fetch funnel, channel and course breakdowns for this month
            const [funnel, channels, courses] = await Promise.all([
              getFunnelData(range, customToken, customEnterpriseId, false),
              getChannelBreakdown(range, customToken, customEnterpriseId, false),
              getCourseBreakdown(range, customToken, customEnterpriseId, false)
            ])
            
            const channelMap: Record<LeadChannel, number> = {
              'Organic': 0, 'Website': 0, 'Google Ads': 0, 'Meta Ads': 0, 'Referral': 0, 'SOT': 0, 'Other': 0
            }
            channels.forEach(ch => {
              channelMap[ch.channel] = ch.total
            })

            const courseMap: Record<string, number> = {}
            courses.forEach(c => {
              courseMap[c.courseName] = c.total
            })
            
            const scm = courseMap['Oracle Fusion SCM'] || 0
            const hcm = courseMap['Oracle Fusion HCM'] || 0
            const fin = courseMap['Oracle Fusion Financials'] || 0
            const tech = courseMap['Oracle Fusion Technical'] || 0
            const ppm = courseMap['Oracle Fusion PPM'] || 0
            const totalCourses = Object.values(courseMap).reduce((sum, val) => sum + val, 0)
            const sapEbsOthers = Math.max(0, totalCourses - (scm + hcm + fin + tech + ppm))

            trend.push({
              month: monthLabel,
              monthStart,
              totalLeads: funnel.total,
              enrolled: funnel.enrolled,
              highPotential: funnel.highPotential,
              mediumPotential: funnel.mediumPotential,
              freshUnqualified: funnel.freshUnqualified,
              lowCold: funnel.lowCold,
              websiteLeads: channelMap['Website'] || 0,
              organicLeads: channelMap['Organic'] || 0,
              googleAdsLeads: channelMap['Google Ads'] || 0,
              metaAdsLeads: channelMap['Meta Ads'] || 0,
              referralLeads: channelMap['Referral'] || 0,
              convRate: funnel.convRate,
              
              // Course root fields for compatibility with LeadsMonthlyRow
              scmLeads: scm,
              hcmLeads: hcm,
              financialsLeads: fin,
              techOicLeads: tech,
              ppmLeads: ppm,
              sapEbsOthersLeads: sapEbsOthers,

              courses: courseMap
            })
          })()
        )
      }
      
      await Promise.all(promises)
      
      // Sort chronologically
      const sortedTrend = trend.sort((a, b) => a.monthStart.getTime() - b.monthStart.getTime())
      
      // Historical Fallback blending check
      try {
        const sheetRes = await fetchLeadsMonthly(bypassCache)
        if (sheetRes && sheetRes.rows.length > 0) {
          for (const pt of sortedTrend) {
            // If TeleCRM has 0 leads for this month, check Sheets fallback
            if (pt.totalLeads === 0) {
              const sheetRow = sheetRes.rows.find(r => r.month.toLowerCase() === pt.month.toLowerCase())
              if (sheetRow) {
                pt.totalLeads = sheetRow.totalLeads
                pt.enrolled = sheetRow.enrolled
                pt.highPotential = sheetRow.highPotential
                pt.mediumPotential = sheetRow.mediumPotential
                pt.freshUnqualified = sheetRow.freshUnqualified
                pt.lowCold = sheetRow.lowCold
                pt.websiteLeads = sheetRow.websiteLeads
                pt.organicLeads = sheetRow.organicLeads
                pt.googleAdsLeads = Math.round(sheetRow.websiteLeads * 0.5) // Approximate GoogleAds/MetaAds split
                pt.metaAdsLeads = Math.round(sheetRow.websiteLeads * 0.5)
                pt.referralLeads = 0
                pt.convRate = sheetRow.convRate
                pt.scmLeads = sheetRow.scmLeads
                pt.hcmLeads = sheetRow.hcmLeads
                pt.financialsLeads = sheetRow.financialsLeads
                pt.techOicLeads = sheetRow.techOicLeads
                pt.ppmLeads = sheetRow.ppmLeads
                pt.sapEbsOthersLeads = sheetRow.sapEbsOthersLeads

                pt.courses = {
                  'Oracle Fusion SCM': sheetRow.scmLeads,
                  'Oracle Fusion HCM': sheetRow.hcmLeads,
                  'Oracle Fusion Financials': sheetRow.financialsLeads,
                  'Oracle Fusion Technical': sheetRow.techOicLeads,
                  'Oracle Fusion PPM': sheetRow.ppmLeads,
                  'SAP': sheetRow.sapEbsOthersLeads
                }
              }
            }
          }
        }
      } catch (sheetErr) {
        console.warn('Failed to load historical sheet leads for monthly trend blending:', sheetErr)
      }
      
      return sortedTrend
    },
    bypassCache,
    900 * 1000
  )
  
  return res.data
}

// Get full funnel for date range
export async function getFunnelData(
  dateRange?: { from: Date; to: Date },
  customToken?: string,
  customEnterpriseId?: string,
  bypassCache = false
): Promise<LeadsFunnelData> {
  const statusCounts = await getCountByStatus(dateRange, customToken, customEnterpriseId, bypassCache)
  
  let total = 0
  let enrolled = 0
  let highPotential = 0
  let mediumPotential = 0
  let freshUnqualified = 0
  let lowCold = 0
  
  for (const [status, count] of Object.entries(statusCounts)) {
    total += count
    const cat = STATUS_TO_CATEGORY[status]
    if (cat === 'Enrolled') enrolled += count
    else if (cat === 'High Potential') highPotential += count
    else if (cat === 'Medium Potential') mediumPotential += count
    else if (cat === 'Fresh/Unqualified') freshUnqualified += count
    else if (cat === 'Low/Cold') lowCold += count
  }
  
  const divisor = total || 1
  
  return {
    total,
    enrolled,
    highPotential,
    mediumPotential,
    freshUnqualified,
    lowCold,
    enrolledPct: parseFloat(((enrolled / divisor) * 100).toFixed(1)),
    highPotentialPct: parseFloat(((highPotential / divisor) * 100).toFixed(1)),
    mediumPotentialPct: parseFloat(((mediumPotential / divisor) * 100).toFixed(1)),
    freshUnqualifiedPct: parseFloat(((freshUnqualified / divisor) * 100).toFixed(1)),
    lowColdPct: parseFloat(((lowCold / divisor) * 100).toFixed(1)),
    convRate: parseFloat(((enrolled / divisor) * 100).toFixed(1)),
    stageBreakdown: statusCounts
  }
}

// Get course breakdown for date range
export async function getCourseBreakdown(
  dateRange?: { from: Date; to: Date },
  customToken?: string,
  customEnterpriseId?: string,
  bypassCache = false
): Promise<LeadsCourseBreakdown[]> {
  const range = dateRange || getCurrentMonthRange()
  const leads = await getAllLeadsForPeriod(range, customToken, customEnterpriseId, bypassCache)
  
  const coursesMap: Record<string, {
    total: number;
    enrolled: number;
    highPotential: number;
    mediumPotential: number;
    freshUnqualified: number;
    lowCold: number;
    websiteLeads: number;
    organicLeads: number;
    googleAdsLeads: number;
    metaAdsLeads: number;
    rawCourses: Set<string>;
  }> = {}
  
  // Initialize default groups to ensure they are present in listings
  const defaultGroups = Array.from(new Set(Object.values(COURSE_TO_GROUP)))
  defaultGroups.forEach(group => {
    coursesMap[group] = {
      total: 0, enrolled: 0, highPotential: 0, mediumPotential: 0, freshUnqualified: 0, lowCold: 0,
      websiteLeads: 0, organicLeads: 0, googleAdsLeads: 0, metaAdsLeads: 0,
      rawCourses: new Set<string>()
    }
  })
  
  // Add Unknown Course bucket
  coursesMap['Unknown Course'] = {
    total: 0, enrolled: 0, highPotential: 0, mediumPotential: 0, freshUnqualified: 0, lowCold: 0,
    websiteLeads: 0, organicLeads: 0, googleAdsLeads: 0, metaAdsLeads: 0,
    rawCourses: new Set<string>()
  }
  
  leads.forEach(lead => {
    const rawCourse = lead.fields?.course || ''
    const groupName = COURSE_TO_GROUP[rawCourse] || 'Unknown Course'
    
    if (!coursesMap[groupName]) {
      coursesMap[groupName] = {
        total: 0, enrolled: 0, highPotential: 0, mediumPotential: 0, freshUnqualified: 0, lowCold: 0,
        websiteLeads: 0, organicLeads: 0, googleAdsLeads: 0, metaAdsLeads: 0,
        rawCourses: new Set<string>()
      }
    }
    
    const group = coursesMap[groupName]
    if (rawCourse) {
      group.rawCourses.add(rawCourse)
    }
    
    group.total++
    
    const cat = STATUS_TO_CATEGORY[lead.status]
    if (cat === 'Enrolled') group.enrolled++
    else if (cat === 'High Potential') group.highPotential++
    else if (cat === 'Medium Potential') group.mediumPotential++
    else if (cat === 'Fresh/Unqualified') group.freshUnqualified++
    else if (cat === 'Low/Cold') group.lowCold++
    
    const channel = detectLeadChannel(lead)
    if (channel === 'Website') group.websiteLeads++
    else if (channel === 'Organic') group.organicLeads++
    else if (channel === 'Google Ads') group.googleAdsLeads++
    else if (channel === 'Meta Ads') group.metaAdsLeads++
  })
  
  const totalAllCourses = leads.length || 1
  
  return Object.entries(coursesMap).map(([courseName, data]) => ({
    courseName,
    rawCourses: Array.from(data.rawCourses),
    total: data.total,
    enrolled: data.enrolled,
    highPotential: data.highPotential,
    mediumPotential: data.mediumPotential,
    freshUnqualified: data.freshUnqualified,
    lowCold: data.lowCold,
    websiteLeads: data.websiteLeads,
    organicLeads: data.organicLeads,
    googleAdsLeads: data.googleAdsLeads,
    metaAdsLeads: data.metaAdsLeads,
    convRate: parseFloat((data.total > 0 ? (data.enrolled / data.total) * 100 : 0).toFixed(1)),
    sharePercent: parseFloat(((data.total / totalAllCourses) * 100).toFixed(1))
  })).sort((a, b) => b.total - a.total)
}

// Get channel breakdown for date range
export async function getChannelBreakdown(
  dateRange?: { from: Date; to: Date },
  customToken?: string,
  customEnterpriseId?: string,
  bypassCache = false
): Promise<LeadsChannelBreakdown[]> {
  const range = dateRange || getCurrentMonthRange()
  const leads = await getAllLeadsForPeriod(range, customToken, customEnterpriseId, bypassCache)
  
  const channelsMap: Record<LeadChannel, {
    total: number;
    enrolled: number;
    highPotential: number;
  }> = {
    'Organic': { total: 0, enrolled: 0, highPotential: 0 },
    'Website': { total: 0, enrolled: 0, highPotential: 0 },
    'Google Ads': { total: 0, enrolled: 0, highPotential: 0 },
    'Meta Ads': { total: 0, enrolled: 0, highPotential: 0 },
    'Referral': { total: 0, enrolled: 0, highPotential: 0 },
    'SOT': { total: 0, enrolled: 0, highPotential: 0 },
    'Other': { total: 0, enrolled: 0, highPotential: 0 }
  }
  
  leads.forEach(lead => {
    const channel = detectLeadChannel(lead)
    const data = channelsMap[channel]
    data.total++
    
    const cat = STATUS_TO_CATEGORY[lead.status]
    if (cat === 'Enrolled') data.enrolled++
    else if (cat === 'High Potential') data.highPotential++
  })
  
  const totalAllChannels = leads.length || 1
  
  return Object.entries(channelsMap).map(([channel, data]) => ({
    channel: channel as LeadChannel,
    total: data.total,
    enrolled: data.enrolled,
    highPotential: data.highPotential,
    convRate: parseFloat((data.total > 0 ? (data.enrolled / data.total) * 100 : 0).toFixed(1)),
    sharePercent: parseFloat(((data.total / totalAllChannels) * 100).toFixed(1))
  }))
}

export function getLeadsMonthComparison(
  rows: LeadsMonthlyRow[],
  monthA: string,
  monthB: string
): { a: LeadsMonthlyRow; b: LeadsMonthlyRow; deltas: Record<string, number> } {
  const emptyRow = (m: string): LeadsMonthlyRow => ({
    month: m, totalLeads: 0, websiteLeads: 0, organicLeads: 0, scmLeads: 0, hcmLeads: 0, financialsLeads: 0,
    techOicLeads: 0, ppmLeads: 0, sapEbsOthersLeads: 0, enrolled: 0, highPotential: 0, mediumPotential: 0,
    freshUnqualified: 0, lowCold: 0, convRate: 0
  })

  const a = rows.find(r => r.month.toLowerCase() === monthA.toLowerCase()) || emptyRow(monthA)
  const b = rows.find(r => r.month.toLowerCase() === monthB.toLowerCase()) || emptyRow(monthB)

  const deltas: Record<string, number> = {
    totalLeads: a.totalLeads - b.totalLeads,
    websiteLeads: a.websiteLeads - b.websiteLeads,
    organicLeads: a.organicLeads - b.organicLeads,
    scmLeads: a.scmLeads - b.scmLeads,
    hcmLeads: a.hcmLeads - b.hcmLeads,
    financialsLeads: a.financialsLeads - b.financialsLeads,
    techOicLeads: a.techOicLeads - b.techOicLeads,
    ppmLeads: a.ppmLeads - b.ppmLeads,
    sapEbsOthersLeads: a.sapEbsOthersLeads - b.sapEbsOthersLeads,
    enrolled: a.enrolled - b.enrolled,
    highPotential: a.highPotential - b.highPotential,
    mediumPotential: a.mediumPotential - b.mediumPotential,
    freshUnqualified: a.freshUnqualified - b.freshUnqualified,
    lowCold: a.lowCold - b.lowCold,
    convRate: parseFloat((a.convRate - b.convRate).toFixed(2)) // percentage points delta
  }

  return { a, b, deltas }
}

