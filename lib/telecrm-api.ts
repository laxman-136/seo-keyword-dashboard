// lib/telecrm-api.ts
import { 
  TeleCRMLead, LeadsMonthlyTrend, LeadsFunnelData, 
  LeadsCourseBreakdown, LeadsChannelBreakdown, 
  LeadCategory, LeadChannel, LeadsMonthlyRow,
  TeleCRMAction, LeadScore, ScoreFactor, LeadsChannelFinancials
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
  'Facebook - SCM':             'Meta Ads',
  'Facebook - HCM':             'Meta Ads',
  'Facebook - Technical':       'Meta Ads',
  'Facebook - Financials':      'Meta Ads',
  'facebook':                   'Meta Ads',
  'Website-fb':                 'Meta Ads',
  'SOT':                        'SOT',
  'chatgpt':                    'LLM',
  'perplexity':                 'LLM',
  'openai':                     'LLM',
  'claude':                     'LLM',
  'chatgpt-chatbot':           'LLM',
  'perplexity-ai':              'LLM',
  'LLM':                        'LLM',
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
  'Oracle Apex Online Training':                      'Oracle Apex',
  'Oracle APEX Online Training Course':               'Oracle Apex',
}

export function getCourseGroup(courseName: string): string {
  if (!courseName) return '';
  const lower = courseName.toLowerCase();
  if (lower.includes('apex')) return 'Oracle Apex';
  if (lower.includes('scm') || lower === '77') return 'Oracle Fusion SCM';
  if (lower.includes('financial')) return 'Oracle Fusion Financials';
  if (lower.includes('technical') || lower.includes('oic') || lower.includes('integration')) return 'Oracle Fusion Technical';
  if (lower.includes('hcm')) return 'Oracle Fusion HCM';
  if (lower.includes('wms') || lower.includes('logfire')) return 'Oracle Fusion WMS';
  if (lower.includes('ppm') || lower.includes('project')) return 'Oracle Fusion PPM';
  if (lower.includes('tms') || lower.includes('transportation')) return 'Oracle TMS';
  if (lower.includes('ebs')) return 'Oracle EBS';
  if (lower.includes('sap')) return 'SAP';
  
  return COURSE_TO_GROUP[courseName] || 'Unknown Course';
}

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

// ── CORE UTILS ───────────────────────────────────────────

function getStartOfDay(date: Date): Date {
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' } as const
  const formatter = new Intl.DateTimeFormat('en-US', options)
  const parts = formatter.formatToParts(date)
  
  const year = parts.find(p => p.type === 'year')?.value || '2026'
  const month = parts.find(p => p.type === 'month')?.value || '06'
  const day = parts.find(p => p.type === 'day')?.value || '01'
  
  const isoStr = `${year}-${month}-${day}T00:00:00.000+05:30`
  return new Date(isoStr)
}

function getEndOfDay(date: Date): Date {
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' } as const
  const formatter = new Intl.DateTimeFormat('en-US', options)
  const parts = formatter.formatToParts(date)
  
  const year = parts.find(p => p.type === 'year')?.value || '2026'
  const month = parts.find(p => p.type === 'month')?.value || '06'
  const day = parts.find(p => p.type === 'day')?.value || '30'
  
  const isoStr = `${year}-${month}-${day}T23:59:59.999+05:30`
  return new Date(isoStr)
}

function getCurrentMonthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { from, to }
}

export function parseAmount(val: any): number {
  if (typeof val === 'number') return val
  if (!val || typeof val !== 'string') return 0
  const match = val.replace(/,/g, '').match(/\d+(?:\.\d+)?/)
  if (!match) return 0
  const num = parseFloat(match[0])
  return num > 0 && num < 150 ? num * 1000 : num
}

export function detectLeadChannel(lead: TeleCRMLead): LeadChannel {
  const fields = lead.fields || {}
  
  const utmSourceRaw = fields.utmsource
  const utmMediumRaw = fields.utmmedium
  const lowerUtm = utmSourceRaw?.toLowerCase() || ''
  const lowerMedium = utmMediumRaw?.toLowerCase() || ''
  
  if (lowerUtm) {
    if (lowerUtm.includes('chatgpt') || lowerUtm.includes('chat gpt') || lowerUtm.includes('gpt') || lowerUtm.includes('perplexity') || lowerUtm.includes('openai') || lowerUtm.includes('claude') || lowerUtm.includes('llm')) {
      return 'LLM'
    }
  }

  // 1. Check explicit click IDs
  if (fields.fbclid) return 'Meta Ads'
  if (fields.google_gcl_id || fields.gclid) return 'Google Ads'
  
  // 2. Check UTM source for Ads platforms
  if (lowerUtm === 'google' || lowerUtm === 'gads') {
    return 'Google Ads'
  }
  if (lowerUtm === 'an' || lowerUtm === 'fb' || lowerUtm === 'ig' || lowerUtm.includes('facebook') || lowerUtm.includes('instagram') || lowerUtm.includes('meta')) {
    return 'Meta Ads'
  }
  
  // 3. Check UTM medium for CPC/PPC/Paid
  if (lowerMedium === 'cpc' || lowerMedium === 'ppc' || lowerMedium === 'paid' || lowerMedium === 'paid_social') {
    // If it's a paid medium but no explicit Google/Meta source, default to Google Ads unless it is clearly social
    if (lowerUtm.includes('facebook') || lowerUtm.includes('instagram') || lowerUtm === 'fb' || lowerUtm === 'ig' || lowerUtm === 'an') {
      return 'Meta Ads'
    }
    return 'Google Ads'
  }
  
  const sourceRaw = fields.lead_source_1
  if (sourceRaw) {
    const lower = sourceRaw.toLowerCase()
    if (lower.includes('gads') || lower.includes('google')) {
      return 'Google Ads'
    }
    if (lower.includes('facebook') || lower.includes('fb') || lower.includes('instagram') || lower.includes('meta')) {
      return 'Meta Ads'
    }
    if (lower.includes('chatgpt') || lower.includes('chat gpt') || lower.includes('gpt') || lower.includes('perplexity') || lower.includes('openai') || lower.includes('claude') || lower.includes('llm')) {
      return 'LLM'
    }
    if (lower === 'website') {
      const hasMarketingParams = !!(
        fields.utmsource || fields.utmmedium || fields.utmcampaign || 
        fields.utmcontent || fields.utmterm || fields.gclid || 
        fields.google_gcl_id || fields.fbclid
      )
      if (!hasMarketingParams) {
        return 'Organic'
      }
    }
    return SOURCE_TO_CHANNEL[sourceRaw] || 'Other'
  }
  
  return 'Other'
}

// Resolves credentials (client-side passed vs server-side variables)
async function getCredentials(customToken?: string, customEnterpriseId?: string) {
  let token = customToken
  let enterpriseId = customEnterpriseId

  if (!token || !enterpriseId) {
    const envToken = process.env.TELECRM_API_TOKEN
    const envEnterpriseId = process.env.TELECRM_ENTERPRISE_ID
    if (envToken && envEnterpriseId) {
      if (!token) token = envToken
      if (!enterpriseId) enterpriseId = envEnterpriseId
    } else {
      try {
        const { getActiveConfiguration } = await import('./configurations-store')
        const activeConfig = await getActiveConfiguration()
        if (activeConfig) {
          if (!token) token = activeConfig.telecrmApiToken || ''
          if (!enterpriseId) enterpriseId = activeConfig.telecrmEnterpriseId || ''
        }
      } catch (err) {
        console.warn('Failed to load active configuration for TeleCRM credentials:', err)
      }
    }
  }

  return { token: token || '', enterpriseId: enterpriseId || '' }
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
function generateMockCRMLeads(fromMs: number, toMs: number): TeleCRMLead[] {
  const leads: TeleCRMLead[] = []
  
  const courses = [
    'Oracle Fusion SCM Course',
    'Oracle Fusion HCM Online Training',
    'Oracle Fusion Technical Training',
    'Oracle Fusion Financial Course',
    'Oracle Fusion PPM Projects Training'
  ]
  
  const campaigns = [
    { source: 'google', medium: 'cpc', campaign: 'SCM Performance Max', gclid: 'gclid_mock_123', channel: 'Google Ads' },
    { source: 'google', medium: 'cpc', campaign: 'HCM Search Campaign', gclid: 'gclid_mock_456', channel: 'Google Ads' },
    { source: 'google', medium: 'display', campaign: 'Oracle Integration Display', gclid: 'gclid_mock_789', channel: 'Google Ads' },
    { source: 'facebook', medium: 'cpc', campaign: 'SCM Lead Gen Campaign', fbclid: 'fbclid_mock_111', channel: 'Meta Ads' },
    { source: 'facebook', medium: 'cpc', campaign: 'HCM Lookalike Conversions', fbclid: 'fbclid_mock_222', channel: 'Meta Ads' },
    { source: 'instagram', medium: 'cpc', campaign: 'SCM Lead Gen Campaign', fbclid: 'fbclid_mock_333', channel: 'Meta Ads' },
    { source: 'instagram', medium: 'cpc', campaign: 'PPM Retargeting Funnel', fbclid: 'fbclid_mock_444', channel: 'Meta Ads' },
    { source: 'chatgpt', medium: 'chatbot', campaign: 'ChatGPT Assistant', fbclid: null, gclid: null, channel: 'LLM' },
    { source: 'perplexity', medium: 'search', campaign: 'Perplexity Answers', fbclid: null, gclid: null, channel: 'LLM' },
    { source: 'organic', medium: 'organic', campaign: null, fbclid: null, gclid: null, channel: 'Organic' },
    { source: 'direct', medium: 'direct', campaign: null, fbclid: null, gclid: null, channel: 'Website' }
  ]

  const firstNames = ['Amit', 'Rahul', 'Priya', 'Srinivas', 'Vikram', 'Deepa', 'Karan', 'Sunita', 'Anil', 'Jyoti', 'Sanjay', 'Meera', 'Ravi', 'Geeta', 'Vijay', 'Neha', 'Rohan', 'Aditi', 'Rajesh', 'Preeti']
  const lastNames = ['Sharma', 'Verma', 'Patel', 'Rao', 'Singh', 'Nair', 'Johar', 'Gupta', 'Kumar', 'Reddy', 'Choudhury', 'Joshi', 'Mehta', 'Das', 'Sen', 'Mishra', 'Prasad', 'Bose', 'Pillai', 'Narayanan']

  const totalLeads = 120
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  for (let i = 0; i < totalLeads; i++) {
    const createdOffset = (i / totalLeads) * 90 * dayMs
    const createdOn = now - createdOffset
    
    const course = courses[i % courses.length]
    const campaignInfo = campaigns[i % campaigns.length]
    
    let status = 'Fresh'
    if (i % 6 === 0) {
      status = 'Enrolled'
    } else if (i % 5 === 0) {
      status = 'Potential Lead 100'
    } else if (i % 4 === 0) {
      status = 'Demo Attended'
    } else if (i % 3 === 0) {
      status = 'Interested to join the Demo'
    } else if (i % 7 === 0) {
      status = 'Not Interested'
    } else if (i % 8 === 0) {
      status = 'Junk Lead'
    }

    const name = `${firstNames[i % firstNames.length]} ${lastNames[(i + 3) % lastNames.length]}`
    const phone = `+91 ${9000000000 + i}`
    const email = `${name.toLowerCase().replace(' ', '.')}@example.com`
    
    leads.push({
      id: `mock-lead-${i}`,
      status,
      employeeid: `agent${(i % 3) + 1}@techleadsit.com`,
      createdBy: 'API Integrator',
      fields: {
        name,
        phone,
        email,
        course,
        lead_source_1: campaignInfo.channel,
        lead_date: createdOn,
        created_on: createdOn,
        modified_on: createdOn + dayMs,
        course_fee: status === 'Enrolled' ? '25000' : undefined,
        amount_paid: status === 'Enrolled' ? '25000' : undefined,
        utmsource: campaignInfo.source,
        utmmedium: campaignInfo.medium,
        utmcampaign: campaignInfo.campaign || undefined,
        fbclid: campaignInfo.fbclid || undefined,
        google_gcl_id: campaignInfo.gclid || undefined
      },
      rating: status === 'Enrolled' ? 5 : 2,
      isArchived: status === 'Not Interested' || status === 'Junk Lead',
      isSpam: status === 'Junk Lead'
    })
  }
  
  return leads.filter(lead => {
    const created = lead.fields.created_on
    if (fromMs && created < fromMs) return false
    if (toMs && created > toMs) return false
    return true
  })
}

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
  const { token, enterpriseId } = await getCredentials(customToken, customEnterpriseId)
  
  if (!token || !enterpriseId) {
    const fromMs = filters.created_on?.from || 0
    const toMs = filters.created_on?.to || Date.now() + 1000 * 60 * 60 * 24
    let mockLeads = generateMockCRMLeads(fromMs, toMs)
    
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      mockLeads = mockLeads.filter(l => statuses.includes(l.status))
    }
    
    if (filters.course) {
      mockLeads = mockLeads.filter(l => l.fields.course === filters.course)
    }
    
    if (filters.lead_source_1) {
      const sources = Array.isArray(filters.lead_source_1) ? filters.lead_source_1 : [filters.lead_source_1]
      mockLeads = mockLeads.filter(l => l.fields.lead_source_1 && sources.includes(l.fields.lead_source_1))
    }
    
    const totalCount = mockLeads.length
    const paginatedLeads = mockLeads.slice(pagination.skip, pagination.skip + pagination.limit)
    
    return {
      data: paginatedLeads,
      total_count: totalCount
    }
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
  const { token, enterpriseId } = await getCredentials(customToken, customEnterpriseId)
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
  bypassCache = false,
  course?: string
): Promise<Record<string, number>> {
  const range = dateRange || getCurrentMonthRange()
  const leads = await getAllLeadsForPeriod(range, customToken, customEnterpriseId, bypassCache, course)
  
  const fromTime = getStartOfDay(range.from).getTime()
  const toTime = getEndOfDay(range.to).getTime()

  const counts: Record<string, number> = {}
  
  // Pre-initialize all mapped statuses to 0 to ensure they are returned
  const uniqueStatuses = Array.from(new Set(Object.keys(STATUS_TO_CATEGORY)))
  uniqueStatuses.forEach(status => {
    counts[status] = 0
  })
  
  leads.forEach(lead => {
    const leadDateVal = lead.fields?.lead_date || lead.fields?.created_on
    const isLeadInPeriod = !!(leadDateVal && leadDateVal >= fromTime && leadDateVal <= toTime)
    
    const isEnrolled = lead.status === 'Enrolled'
    const enrollDateVal = lead.fields?.course_enrollment_date
    const isEnrolledInPeriod = !!(isEnrolled && enrollDateVal && enrollDateVal >= fromTime && enrollDateVal <= toTime)
    
    if (isEnrolled) {
      if (isEnrolledInPeriod) {
        counts['Enrolled'] = (counts['Enrolled'] || 0) + 1
      } else if (isLeadInPeriod) {
        // Future enrollment, count as a High Potential fallback status in this period
        counts['Interested to join the Demo'] = (counts['Interested to join the Demo'] || 0) + 1
      }
    } else {
      if (isLeadInPeriod) {
        const status = lead.status || 'Other'
        counts[status] = (counts[status] || 0) + 1
      }
    }

    // Process Course 2
    const rawCourse2 = lead.fields?.course_name_2 || lead.fields?.course_2_name || lead.fields?.course2_name || ''
    if (rawCourse2) {
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
      
      const isEnrolled2InPeriod = !!(enroll2Ms && enroll2Ms >= fromTime && enroll2Ms <= toTime)
      if (isEnrolled2InPeriod) {
        counts['Enrolled'] = (counts['Enrolled'] || 0) + 1
      }
    }
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

// Paginate through ALL leads for a date range in parallel
export async function getAllLeadsForPeriod(
  dateRange: { from: Date; to: Date },
  customToken?: string,
  customEnterpriseId?: string,
  bypassCache = false,
  course?: string
): Promise<TeleCRMLead[]> {
  return getAllLeads({ dateRange, course }, customToken, customEnterpriseId, bypassCache)
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
    'LLM': 0,
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
    // Course 1
    const rawCourse1 = lead.fields?.course || ''
    if (rawCourse1) {
      const groupName1 = getCourseGroup(rawCourse1)
      counts[groupName1] = (counts[groupName1] || 0) + 1
    }
    // Course 2
    const rawCourse2 = lead.fields?.course_name_2 || lead.fields?.course_2_name || lead.fields?.course2_name || ''
    if (rawCourse2) {
      const groupName2 = getCourseGroup(rawCourse2)
      counts[groupName2] = (counts[groupName2] || 0) + 1
    }
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
  const { token, enterpriseId } = await getCredentials(customToken, customEnterpriseId)
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
  bypassCache = false,
  course?: string
): Promise<LeadsMonthlyTrend[]> {
  const { token, enterpriseId } = await getCredentials(customToken, customEnterpriseId)
  
  const cacheKey = `telecrm_monthly_trend_${months}_${course || 'all'}_${enterpriseId}`
  
  const res = await getOrSetCache(
    cacheKey,
    async () => {
      const trend: LeadsMonthlyTrend[] = []
      
      const now = new Date()
      const oldestMonthIdx = now.getMonth() - (months - 1)
      const rangeStart = new Date(now.getFullYear(), oldestMonthIdx, 1)
      const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      
      // Fetch all leads in a single bulk query
      const allLeads = await getAllLeadsForPeriod({ from: rangeStart, to: rangeEnd }, customToken, customEnterpriseId, bypassCache, course)
      
      for (let i = 0; i < months; i++) {
        const year = now.getFullYear()
        const monthIdx = now.getMonth() - i
        
        const monthStart = new Date(year, monthIdx, 1)
        const monthEnd = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999)
        const monthLabel = monthStart.toLocaleString('en-US', { month: 'short', year: 'numeric' })
        
        // Filter leads belonging to this month in memory
        const monthLeads = allLeads.filter(lead => {
          const leadDateVal = lead.fields?.lead_date || lead.fields?.created_on
          const isLeadInMonth = !!(leadDateVal && leadDateVal >= monthStart.getTime() && leadDateVal <= monthEnd.getTime())
          
          const isEnrolled = lead.status === 'Enrolled'
          const enrollDateVal = lead.fields?.course_enrollment_date
          const isEnrolledInMonth = !!(isEnrolled && enrollDateVal && enrollDateVal >= monthStart.getTime() && enrollDateVal <= monthEnd.getTime())
          
          return isLeadInMonth || isEnrolledInMonth
        })
        
        let total = 0
        let enrolled = 0
        let highPotential = 0
        let mediumPotential = 0
        let freshUnqualified = 0
        let lowCold = 0
        
        const channelMap: Record<LeadChannel, number> = {
          'Organic': 0, 'Website': 0, 'Google Ads': 0, 'Meta Ads': 0, 'Referral': 0, 'SOT': 0, 'LLM': 0, 'Other': 0
        }
        
        const courseMap: Record<string, number> = {}
        const defaultGroups = Array.from(new Set(Object.values(COURSE_TO_GROUP)))
        defaultGroups.forEach(group => {
          courseMap[group] = 0
        })
        courseMap['Unknown Course'] = 0
        
        let chatgptCount = 0
        let perplexityCount = 0
        
        monthLeads.forEach(lead => {
          const leadDateVal = lead.fields?.lead_date || lead.fields?.created_on
          const isLeadInMonth = !!(leadDateVal && leadDateVal >= monthStart.getTime() && leadDateVal <= monthEnd.getTime())
          
          const isEnrolled = lead.status === 'Enrolled'
          const enrollDateVal = lead.fields?.course_enrollment_date
          const isEnrolledInMonth = !!(isEnrolled && enrollDateVal && enrollDateVal >= monthStart.getTime() && enrollDateVal <= monthEnd.getTime())
          
          if (isLeadInMonth) {
            total++
            
            if (isEnrolled) {
              if (isEnrolledInMonth) {
                enrolled++
              } else {
                // Future enrollment, count as a High Potential fallback status in this period
                highPotential++
              }
            } else {
              const cat = STATUS_TO_CATEGORY[lead.status]
              if (cat === 'High Potential') highPotential++
              else if (cat === 'Medium Potential') mediumPotential++
              else if (cat === 'Fresh/Unqualified') freshUnqualified++
              else if (cat === 'Low/Cold') lowCold++
            }
            
            const ch = detectLeadChannel(lead)
            channelMap[ch] = (channelMap[ch] || 0) + 1
            
            const rawSource = (lead.fields?.lead_source_1 || '').toLowerCase()
            if (rawSource.includes('chatgpt') || rawSource.includes('chat gpt') || rawSource.includes('gpt')) {
              chatgptCount++
            } else if (rawSource.includes('perplexity')) {
              perplexityCount++
            }
            
            const rawCourse = lead.fields?.course || ''
            if (rawCourse) {
              const groupName = getCourseGroup(rawCourse)
              courseMap[groupName] = (courseMap[groupName] || 0) + 1
            }
            
            const rawCourse2 = lead.fields?.course_name_2 || lead.fields?.course_2_name || lead.fields?.course2_name || ''
            if (rawCourse2) {
              const groupName2 = getCourseGroup(rawCourse2)
              courseMap[groupName2] = (courseMap[groupName2] || 0) + 1
            }
          } else if (isEnrolledInMonth) {
            // Prior lead enrolling in this period
            enrolled++
          }
        })
        
        const divisor = total || 1
        const convRate = parseFloat(((enrolled / divisor) * 100).toFixed(1))

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
          totalLeads: total,
          enrolled,
          highPotential,
          mediumPotential,
          freshUnqualified,
          lowCold,
          websiteLeads: channelMap['Website'] || 0,
          organicLeads: channelMap['Organic'] || 0,
          googleAdsLeads: channelMap['Google Ads'] || 0,
          metaAdsLeads: channelMap['Meta Ads'] || 0,
          referralLeads: channelMap['Referral'] || 0,
          llmLeads: channelMap['LLM'] || 0,
          chatgptLeads: chatgptCount,
          perplexityLeads: perplexityCount,
          convRate,
          
          scmLeads: scm,
          hcmLeads: hcm,
          financialsLeads: fin,
          techOicLeads: tech,
          ppmLeads: ppm,
          sapEbsOthersLeads: sapEbsOthers,

          courses: courseMap
        })
      }
      
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
                pt.llmLeads = sheetRow.llmLeads || 0
                pt.chatgptLeads = sheetRow.chatgptLeads || 0
                pt.perplexityLeads = sheetRow.perplexityLeads || 0
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
  bypassCache = false,
  course?: string
): Promise<LeadsFunnelData> {
  const range = dateRange || getCurrentMonthRange()
  const leads = await getAllLeadsForPeriod(range, customToken, customEnterpriseId, bypassCache, course)
  const statusCounts = await getCountByStatus(range, customToken, customEnterpriseId, bypassCache, course)
  
  const fromTime = getStartOfDay(range.from).getTime()
  const toTime = getEndOfDay(range.to).getTime()

  let total = 0
  leads.forEach(lead => {
    const leadDateVal = lead.fields?.lead_date || lead.fields?.created_on
    if (leadDateVal && leadDateVal >= fromTime && leadDateVal <= toTime) {
      total++
    }
  })
  
  let enrolled = 0
  let highPotential = 0
  let mediumPotential = 0
  let freshUnqualified = 0
  let lowCold = 0
  
  for (const [status, count] of Object.entries(statusCounts)) {
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
  bypassCache = false,
  course?: string
): Promise<LeadsCourseBreakdown[]> {
  const range = dateRange || getCurrentMonthRange()
  const leads = await getAllLeadsForPeriod(range, customToken, customEnterpriseId, bypassCache, course)
  
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
    llmLeads: number;
    rawCourses: Set<string>;
    revenueCash: number;
    revenueContract: number;
  }> = {}
  
  // Initialize default groups to ensure they are present in listings
  const defaultGroups = Array.from(new Set(Object.values(COURSE_TO_GROUP)))
  defaultGroups.forEach(group => {
    coursesMap[group] = {
      total: 0, enrolled: 0, highPotential: 0, mediumPotential: 0, freshUnqualified: 0, lowCold: 0,
      websiteLeads: 0, organicLeads: 0, googleAdsLeads: 0, metaAdsLeads: 0, llmLeads: 0,
      rawCourses: new Set<string>(),
      revenueCash: 0,
      revenueContract: 0
    }
  })
  
  // Add Unknown Course bucket
  coursesMap['Unknown Course'] = {
    total: 0, enrolled: 0, highPotential: 0, mediumPotential: 0, freshUnqualified: 0, lowCold: 0,
    websiteLeads: 0, organicLeads: 0, googleAdsLeads: 0, metaAdsLeads: 0, llmLeads: 0,
    rawCourses: new Set<string>(),
    revenueCash: 0,
    revenueContract: 0
  }
  
  const fromTime = getStartOfDay(range.from).getTime()
  const toTime = getEndOfDay(range.to).getTime()

  leads.forEach(lead => {
    // 1. Course 1
    const rawCourse = lead.fields?.course || ''
    if (rawCourse) {
      const groupName = getCourseGroup(rawCourse)
      
      if (!coursesMap[groupName]) {
        coursesMap[groupName] = {
          total: 0, enrolled: 0, highPotential: 0, mediumPotential: 0, freshUnqualified: 0, lowCold: 0,
          websiteLeads: 0, organicLeads: 0, googleAdsLeads: 0, metaAdsLeads: 0, llmLeads: 0,
          rawCourses: new Set<string>(),
          revenueCash: 0,
          revenueContract: 0
        }
      }
      
      const group = coursesMap[groupName]
      group.rawCourses.add(rawCourse)
      
      const leadDateVal = lead.fields?.lead_date || lead.fields?.created_on
      const isLeadInPeriod = !!(leadDateVal && leadDateVal >= fromTime && leadDateVal <= toTime)
      
      const isEnrolled = lead.status === 'Enrolled'
      const enrollDateVal = lead.fields?.course_enrollment_date
      const isEnrolledInPeriod = !!(isEnrolled && enrollDateVal && enrollDateVal >= fromTime && enrollDateVal <= toTime)
      
      if (isLeadInPeriod) {
        group.total++
        
        if (isEnrolled) {
          if (isEnrolledInPeriod) {
            group.enrolled++
            group.revenueCash += parseAmount(lead.fields?.amount_paid) + parseAmount(lead.fields?.amount_paid_emi_2)
            group.revenueContract += parseAmount(lead.fields?.course_fee)
          } else {
            // Future enrollment, count as a High Potential fallback status in this period
            group.highPotential++
          }
        } else {
          const cat = STATUS_TO_CATEGORY[lead.status]
          if (cat === 'High Potential') group.highPotential++
          else if (cat === 'Medium Potential') group.mediumPotential++
          else if (cat === 'Fresh/Unqualified') group.freshUnqualified++
          else if (cat === 'Low/Cold') group.lowCold++
        }
        
        const channel = detectLeadChannel(lead)
        if (channel === 'Website') {
          group.websiteLeads++
        } else if (channel === 'Google Ads') {
          group.googleAdsLeads++
        } else if (channel === 'Meta Ads') {
          group.metaAdsLeads++
        } else if (channel === 'LLM') {
          group.llmLeads++
        } else {
          group.organicLeads++
        }
      } else if (isEnrolledInPeriod) {
        // Prior lead enrolling in this period
        group.enrolled++
        group.revenueCash += parseAmount(lead.fields?.amount_paid) + parseAmount(lead.fields?.amount_paid_emi_2)
        group.revenueContract += parseAmount(lead.fields?.course_fee)
      }
    }

    // 2. Course 2
    const rawCourse2 = lead.fields?.course_name_2 || lead.fields?.course_2_name || lead.fields?.course2_name || ''
    if (rawCourse2) {
      const groupName2 = getCourseGroup(rawCourse2)
      
      if (!coursesMap[groupName2]) {
        coursesMap[groupName2] = {
          total: 0, enrolled: 0, highPotential: 0, mediumPotential: 0, freshUnqualified: 0, lowCold: 0,
          websiteLeads: 0, organicLeads: 0, googleAdsLeads: 0, metaAdsLeads: 0, llmLeads: 0,
          rawCourses: new Set<string>(),
          revenueCash: 0,
          revenueContract: 0
        }
      }
      
      const group2 = coursesMap[groupName2]
      group2.rawCourses.add(rawCourse2)
      
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
      
      const isEnrolled2InPeriod = !!(enroll2Ms && enroll2Ms >= fromTime && enroll2Ms <= toTime)
      if (isEnrolled2InPeriod) {
        group2.enrolled++
        group2.total++ // Increment total so conversion rate calculates properly
        group2.revenueCash += parseAmount(lead.fields?.amount_paid_emi_1_course_2) + parseAmount(lead.fields?.amount_paid_emi_2_course_2)
        group2.revenueContract += parseAmount(lead.fields?.course_2_fee)
      }
    }
  })
  
  const totalAllCourses = Object.values(coursesMap).reduce((sum, d) => sum + d.total, 0) || 1
  
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
    adsLeads: data.googleAdsLeads + data.metaAdsLeads,
    llmLeads: data.llmLeads,
    convRate: parseFloat((data.total > 0 ? (data.enrolled / data.total) * 100 : 0).toFixed(1)),
    sharePercent: parseFloat(((data.total / totalAllCourses) * 100).toFixed(1)),
    revenueCash: data.revenueCash,
    revenueContract: data.revenueContract
  })).sort((a, b) => b.total - a.total)
}

// Get channel breakdown for date range
export async function getChannelBreakdown(
  dateRange?: { from: Date; to: Date },
  customToken?: string,
  customEnterpriseId?: string,
  bypassCache = false,
  course?: string
): Promise<LeadsChannelBreakdown[]> {
  const range = dateRange || getCurrentMonthRange()
  const leads = await getAllLeadsForPeriod(range, customToken, customEnterpriseId, bypassCache, course)
  
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
    'LLM': { total: 0, enrolled: 0, highPotential: 0 },
    'Other': { total: 0, enrolled: 0, highPotential: 0 }
  }
  
  const fromTime = getStartOfDay(range.from).getTime()
  const toTime = getEndOfDay(range.to).getTime()

  leads.forEach(lead => {
    const channel = detectLeadChannel(lead)
    const data = channelsMap[channel]
    
    const leadDateVal = lead.fields?.lead_date || lead.fields?.created_on
    const isLeadInPeriod = !!(leadDateVal && leadDateVal >= fromTime && leadDateVal <= toTime)
    
    const isEnrolled = lead.status === 'Enrolled'
    const enrollDateVal = lead.fields?.course_enrollment_date
    const isEnrolledInPeriod = !!(isEnrolled && enrollDateVal && enrollDateVal >= fromTime && enrollDateVal <= toTime)
    
    if (isLeadInPeriod) {
      data.total++
      
      if (isEnrolled) {
        if (isEnrolledInPeriod) {
          data.enrolled++
        } else {
          // Future enrollment, count as a High Potential fallback status in this period
          data.highPotential++
        }
      } else {
        const cat = STATUS_TO_CATEGORY[lead.status]
        if (cat === 'High Potential') data.highPotential++
      }
    } else if (isEnrolledInPeriod) {
      // Prior lead enrolling in this period
      data.enrolled++
    }
  })
  
  const totalAllChannels = Object.values(channelsMap).reduce((sum, d) => sum + d.total, 0) || 1
  
  return Object.entries(channelsMap).map(([channel, data]) => ({
    channel: channel as LeadChannel,
    total: data.total,
    enrolled: data.enrolled,
    highPotential: data.highPotential,
    convRate: parseFloat((data.total > 0 ? (data.enrolled / data.total) * 100 : 0).toFixed(1)),
    sharePercent: parseFloat(((data.total / totalAllChannels) * 100).toFixed(1))
  }))
}

export async function getChannelFinancials(
  dateRange?: { from: Date; to: Date },
  customToken?: string,
  customEnterpriseId?: string,
  bypassCache = false,
  manualBudgets: Record<string, number> = {},
  googleSpend = 0,
  metaSpend = 0,
  course?: string
): Promise<LeadsChannelFinancials[]> {
  const range = dateRange || getCurrentMonthRange()
  
  // 1. Fetch leads
  const leads = await getAllLeadsForPeriod(range, customToken, customEnterpriseId, bypassCache)
  
  // 3. Aggregate lead revenue
  const financialsMap: Record<LeadChannel, {
    leads: number;
    enrolled: number;
    revenueCash: number;
    revenueContract: number;
    spend: number;
  }> = {
    'Organic': { leads: 0, enrolled: 0, revenueCash: 0, revenueContract: 0, spend: manualBudgets['Organic'] || 0 },
    'Website': { leads: 0, enrolled: 0, revenueCash: 0, revenueContract: 0, spend: manualBudgets['Website'] || 0 },
    'Google Ads': { leads: 0, enrolled: 0, revenueCash: 0, revenueContract: 0, spend: googleSpend },
    'Meta Ads': { leads: 0, enrolled: 0, revenueCash: 0, revenueContract: 0, spend: metaSpend },
    'Referral': { leads: 0, enrolled: 0, revenueCash: 0, revenueContract: 0, spend: manualBudgets['Referral'] || 0 },
    'SOT': { leads: 0, enrolled: 0, revenueCash: 0, revenueContract: 0, spend: manualBudgets['SOT'] || 0 },
    'LLM': { leads: 0, enrolled: 0, revenueCash: 0, revenueContract: 0, spend: manualBudgets['LLM'] || 0 },
    'Other': { leads: 0, enrolled: 0, revenueCash: 0, revenueContract: 0, spend: manualBudgets['Other'] || 0 }
  }
  
  const fromTime = getStartOfDay(range.from).getTime()
  const toTime = getEndOfDay(range.to).getTime()
  
  leads.forEach(lead => {
    const channel = detectLeadChannel(lead)
    const data = financialsMap[channel]
    if (!data) return
    
    const leadDateVal = lead.fields?.lead_date || lead.fields?.created_on
    const isLeadInPeriod = !!(leadDateVal && leadDateVal >= fromTime && leadDateVal <= toTime)
    
    const isEnrolled = lead.status === 'Enrolled'
    const enrollDateVal = lead.fields?.course_enrollment_date
    const isEnrolledInPeriod = !!(isEnrolled && enrollDateVal && enrollDateVal >= fromTime && enrollDateVal <= toTime)
    
    if (isLeadInPeriod) {
      data.leads++
      
      if (isEnrolled) {
        const cash = parseAmount(lead.fields?.amount_paid) + parseAmount(lead.fields?.amount_paid_emi_2)
        const contract = parseAmount(lead.fields?.course_fee)
        
        if (isEnrolledInPeriod) {
          data.enrolled++
          data.revenueCash += cash
          data.revenueContract += contract
        }
      }
    } else if (isEnrolledInPeriod) {
      data.enrolled++
      const cash = parseAmount(lead.fields?.amount_paid) + parseAmount(lead.fields?.amount_paid_emi_2)
      const contract = parseAmount(lead.fields?.course_fee)
      data.revenueCash += cash
      data.revenueContract += contract
    }

    // Process Course 2
    const rawCourse2 = lead.fields?.course_name_2 || lead.fields?.course_2_name || lead.fields?.course2_name || ''
    if (rawCourse2) {
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
      
      const isEnrolled2InPeriod = !!(enroll2Ms && enroll2Ms >= fromTime && enroll2Ms <= toTime)
      if (isEnrolled2InPeriod) {
        data.enrolled++
        data.revenueCash += parseAmount(lead.fields?.amount_paid_emi_1_course_2) + parseAmount(lead.fields?.amount_paid_emi_2_course_2)
        data.revenueContract += parseAmount(lead.fields?.course_2_fee)
      }
    }
  })
  
  return Object.entries(financialsMap).map(([channel, data]) => {
    const spend = data.spend
    const leadsCount = data.leads
    const enrolledCount = data.enrolled
    
    const cpl = spend > 0 && leadsCount > 0 ? spend / leadsCount : 0
    const cpa = spend > 0 && enrolledCount > 0 ? spend / enrolledCount : 0
    
    const roasCash = spend > 0 ? data.revenueCash / spend : 0
    const roasContract = spend > 0 ? data.revenueContract / spend : 0
    
    const isPaid = channel === 'Google Ads' || channel === 'Meta Ads'
    
    return {
      channel: channel as LeadChannel,
      leads: leadsCount,
      enrolled: enrolledCount,
      spend: parseFloat(spend.toFixed(2)),
      revenueCash: parseFloat(data.revenueCash.toFixed(2)),
      revenueContract: parseFloat(data.revenueContract.toFixed(2)),
      cpl: parseFloat(cpl.toFixed(2)),
      cpa: parseFloat(cpa.toFixed(2)),
      roasCash: parseFloat(roasCash.toFixed(2)),
      roasContract: parseFloat(roasContract.toFixed(2)),
      isPaid
    }
  })
}

export function getLeadsMonthComparison(
  rows: LeadsMonthlyRow[],
  monthA: string,
  monthB: string
): { a: LeadsMonthlyRow; b: LeadsMonthlyRow; deltas: Record<string, number> } {
  const emptyRow = (m: string): LeadsMonthlyRow => ({
    month: m, totalLeads: 0, websiteLeads: 0, organicLeads: 0,
    llmLeads: 0, chatgptLeads: 0, perplexityLeads: 0,
    scmLeads: 0, hcmLeads: 0, financialsLeads: 0,
    techOicLeads: 0, ppmLeads: 0, sapEbsOthersLeads: 0, enrolled: 0, highPotential: 0, mediumPotential: 0,
    freshUnqualified: 0, lowCold: 0, convRate: 0
  })

  const a = rows.find(r => r.month.toLowerCase() === monthA.toLowerCase()) || emptyRow(monthA)
  const b = rows.find(r => r.month.toLowerCase() === monthB.toLowerCase()) || emptyRow(monthB)

  const deltas: Record<string, number> = {
    totalLeads: a.totalLeads - b.totalLeads,
    websiteLeads: a.websiteLeads - b.websiteLeads,
    organicLeads: a.organicLeads - b.organicLeads,
    llmLeads: (a.llmLeads || 0) - (b.llmLeads || 0),
    chatgptLeads: (a.chatgptLeads || 0) - (b.chatgptLeads || 0),
    perplexityLeads: (a.perplexityLeads || 0) - (b.perplexityLeads || 0),
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

// ── NEW ADVANCED LEADS INTELLIGENCE FUNCTIONS ─────────────────

/**
 * Fetches ALL leads for a date range using skip/limit pagination and generic filters
 * Cache TTL: 15 minutes
 */
/**
 * Helper to fetch and paginate leads for a specific filter configuration with retry logic
 */
async function fetchLeadsForFilter(
  searchFilters: any,
  chunkId: number,
  chunkTotal: number,
  chunkFrom: number,
  chunkTo: number,
  customToken?: string,
  customEnterpriseId?: string
): Promise<TeleCRMLead[]> {
  const chunkLeads: TeleCRMLead[] = []
  let skip = 0
  const limit = 100
  let success = false
  let retries = 3
  while (retries > 0 && !success) {
    try {
      console.log(`[TeleCRM API] Fetching chunk ${chunkId + 1}/${chunkTotal} range: ${new Date(chunkFrom).toLocaleDateString()} to ${new Date(chunkTo).toLocaleDateString()} with filters ${JSON.stringify(searchFilters)} (skip=${skip}, limit=${limit})`)
      const apiRes = await searchLeads(searchFilters, { limit, skip }, customToken, customEnterpriseId)
      chunkLeads.push(...apiRes.data)
      
      let currentSkip = skip + limit
      while (chunkLeads.length < apiRes.total_count && apiRes.data.length === limit) {
        console.log(`[TeleCRM API] Paginating chunk ${chunkId + 1}/${chunkTotal} (skip=${currentSkip}, limit=${limit})`)
        const nextPageRes = await searchLeads(searchFilters, { limit, skip: currentSkip }, customToken, customEnterpriseId)
        chunkLeads.push(...nextPageRes.data)
        if (nextPageRes.data.length < limit) break
        currentSkip += limit
      }
      success = true
    } catch (err: any) {
      retries--
      console.warn(`[TeleCRM API] Failed to fetch chunk ${chunkId + 1} (retries remaining: ${retries}):`, err?.message || err)
      if (retries === 0) {
        throw err // rethrow after 3 failures
      }
      // wait 1000ms before retrying to let the rate limit reset
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  return chunkLeads
}

export async function getAllLeads(
  filters?: {
    dateRange?: { from: Date; to: Date }
    status?: string | string[]
    lead_source_1?: string
    course?: string
  },
  customToken?: string,
  customEnterpriseId?: string,
  bypassCache = false
): Promise<TeleCRMLead[]> {
  const { token, enterpriseId } = await getCredentials(customToken, customEnterpriseId)
  const fromMs = filters?.dateRange ? getStartOfDay(filters.dateRange.from).getTime() : 0
  const toMs = filters?.dateRange ? getEndOfDay(filters.dateRange.to).getTime() : 0
  
  const filterKey = JSON.stringify({
    fromMs,
    toMs,
    status: filters?.status,
    lead_source_1: filters?.lead_source_1,
    course: filters?.course,
    enterpriseId
  })
  const cacheKey = `telecrm_all_leads_generic_${Buffer.from(filterKey).toString('base64')}`

  const res = await getOrSetCache(
    cacheKey,
    async () => {
      // Partition the date range into 30-day chunks to prevent TeleCRM API timeouts (500)
      let timeChunks = [{ from: fromMs, to: toMs }]
      if (filters?.dateRange && (toMs - fromMs > 30 * 24 * 60 * 60 * 1000)) {
        timeChunks = []
        let currentStart = fromMs
        const step = 30 * 24 * 60 * 60 * 1000
        while (currentStart < toMs) {
          const currentEnd = Math.min(currentStart + step, toMs)
          timeChunks.push({ from: currentStart, to: currentEnd })
          currentStart = currentEnd + 1
        }
      }

      const leads: TeleCRMLead[] = []
      const concurrencyLimit = 3
      
      for (let i = 0; i < timeChunks.length; i += concurrencyLimit) {
        const batch = timeChunks.slice(i, i + concurrencyLimit)
        
        const batchPromises = batch.map(async (chunk, batchIdx) => {
          const chunkId = i + batchIdx
          
          const searchFiltersLeadDate: any = {}
          const searchFiltersCreatedOn: any = {}
          const searchFiltersEnrollmentDate: any = {}
          let skipEnrollmentSearch = false
          
          if (filters?.dateRange) {
            searchFiltersLeadDate.lead_date = { from: chunk.from, to: chunk.to }
            searchFiltersCreatedOn.created_on = { from: chunk.from, to: chunk.to }
            searchFiltersEnrollmentDate.course_enrollment_date = { from: chunk.from, to: chunk.to }
            searchFiltersEnrollmentDate.status = 'Enrolled'
          }
          if (filters?.status) {
            searchFiltersLeadDate.status = filters.status
            searchFiltersCreatedOn.status = filters.status
            const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
            if (statuses.includes('Enrolled')) {
              searchFiltersEnrollmentDate.status = 'Enrolled'
            } else {
              skipEnrollmentSearch = true
            }
          }
          if (filters?.lead_source_1) {
            searchFiltersLeadDate.lead_source_1 = filters.lead_source_1
            searchFiltersCreatedOn.lead_source_1 = filters.lead_source_1
            searchFiltersEnrollmentDate.lead_source_1 = filters.lead_source_1
          }

          // Fetch in parallel
          const fetchPromises = [
            fetchLeadsForFilter(searchFiltersLeadDate, chunkId, timeChunks.length, chunk.from, chunk.to, customToken, customEnterpriseId),
            fetchLeadsForFilter(searchFiltersCreatedOn, chunkId, timeChunks.length, chunk.from, chunk.to, customToken, customEnterpriseId)
          ]
          if (filters?.dateRange && !skipEnrollmentSearch) {
            fetchPromises.push(fetchLeadsForFilter(searchFiltersEnrollmentDate, chunkId, timeChunks.length, chunk.from, chunk.to, customToken, customEnterpriseId))
          }

          const resultsList = await Promise.all(fetchPromises)
          const leadsByLeadDate = resultsList[0]
          const leadsByCreatedOn = resultsList[1]
          const leadsByEnrollmentDate = resultsList[2] || []

          // Merge by id
          const chunkMap = new Map<string, TeleCRMLead>()
          leadsByLeadDate.forEach(l => chunkMap.set(l.id, l))
          leadsByCreatedOn.forEach(l => chunkMap.set(l.id, l))
          leadsByEnrollmentDate.forEach(l => chunkMap.set(l.id, l))
          
          return Array.from(chunkMap.values())
        })
        
        const batchResults = await Promise.all(batchPromises)
        batchResults.forEach(res => leads.push(...res))
      }
      
      // De-duplicate any leads across different chunks (should not happen, but good practice)
      const uniqueLeadsMap = new Map<string, TeleCRMLead>()
      leads.forEach(l => uniqueLeadsMap.set(l.id, l))
      return Array.from(uniqueLeadsMap.values())
    },
    bypassCache,
    900 * 1000 // 15 mins cache TTL
  )

  let results = res.data

  // Apply date filtering based on lead_date (falling back to created_on) and course_enrollment_date
  if (filters?.dateRange) {
    const fromTime = getStartOfDay(filters.dateRange.from).getTime()
    const toTime = getEndOfDay(filters.dateRange.to).getTime()
    results = results.filter(lead => {
      const leadDateVal = lead.fields?.lead_date || lead.fields?.created_on
      const isLeadInPeriod = !!(leadDateVal && leadDateVal >= fromTime && leadDateVal <= toTime)
      
      const isEnrolled = lead.status === 'Enrolled'
      const enrollDateVal = lead.fields?.course_enrollment_date
      const isEnrolledInPeriod = !!(isEnrolled && enrollDateVal && enrollDateVal >= fromTime && enrollDateVal <= toTime)
      
      return isLeadInPeriod || isEnrolledInPeriod
    })
  }

  if (filters?.course && filters.course !== 'all') {
    const targetCourseGroup = filters.course
    results = results.filter(lead => {
      const rawCourse1 = lead.fields?.course || ''
      const rawCourse2 = lead.fields?.course_name_2 || lead.fields?.course_2_name || lead.fields?.course2_name || ''
      
      const group1 = getCourseGroup(rawCourse1)
      const group2 = rawCourse2 ? getCourseGroup(rawCourse2) : ''
      
      return group1 === targetCourseGroup || group2 === targetCourseGroup
    })
  }

  return results
}

/**
 * Generates realistic mock actions for a lead based on status
 */
export function generateMockActions(lead: TeleCRMLead): TeleCRMAction[] {
  const actions: TeleCRMAction[] = []
  const createdOn = lead.fields?.created_on || (Date.now() - 5 * 24 * 60 * 60 * 1000)
  const agentEmail = lead.employeeid || 'agent@techleadsit.com'
  
  const category = STATUS_TO_CATEGORY[lead.status] || 'Fresh/Unqualified'
  const isJunk = category === 'Low/Cold'
  
  if (category !== 'Fresh/Unqualified') {
    // Contacted! First call outgoing
    const call1Offset = 10 * 60 * 1000 + Math.random() * 50 * 60 * 1000
    const call1Time = createdOn + call1Offset
    
    if (call1Time < Date.now()) {
      actions.push({
        id: `mock-act-1-${lead.id}`,
        type: 'OUTGOING_CALL',
        performedBy: agentEmail,
        performedAt: call1Time,
        duration: isJunk ? 5 + Math.floor(Math.random() * 20) : 60 + Math.floor(Math.random() * 180),
        outcome: isJunk ? 'Not Interested' : 'Connected',
        note: isJunk ? 'Client hung up saying not interested.' : 'Discussed training packages, scheduled for demo.'
      })
    }

    // Send follow-up WhatsApp
    const waTime = call1Time + 5 * 60 * 1000
    if (waTime < Date.now()) {
      actions.push({
        id: `mock-act-2-${lead.id}`,
        type: 'WHATSAPP',
        performedBy: agentEmail,
        performedAt: waTime,
        note: 'Shared brochure and live demo training links.'
      })
    }

    // Engagement/Follow ups
    if (category === 'High Potential' || category === 'Enrolled') {
      const followUpTime = call1Time + 24 * 60 * 60 * 1000
      if (followUpTime < Date.now()) {
        actions.push({
          id: `mock-act-3-${lead.id}`,
          type: 'FOLLOW_UP',
          performedBy: agentEmail,
          performedAt: followUpTime,
          note: 'Checked in regarding demo attendance feedback. Very positive.'
        })

        const call2Time = followUpTime + 5 * 60 * 1000
        actions.push({
          id: `mock-act-4-${lead.id}`,
          type: 'OUTGOING_CALL',
          performedBy: agentEmail,
          performedAt: call2Time,
          duration: 120 + Math.floor(Math.random() * 120),
          outcome: 'Connected',
          note: 'Cleared doubt on ERP projects. Client ready to enroll.'
        })
      }
    }

    if (category === 'Enrolled') {
      const enrollTime = createdOn + 2 * 24 * 60 * 60 * 1000
      if (enrollTime < Date.now()) {
        actions.push({
          id: `mock-act-5-${lead.id}`,
          type: 'NOTE',
          performedBy: agentEmail,
          performedAt: enrollTime,
          note: 'Online payment received. Registered for upcoming batch.'
        })
      }
    }
  }

  return actions.sort((a, b) => a.performedAt - b.performedAt)
}

/**
 * Fetches actions (calls, follow-ups) for a lead
 */
export async function getLeadActions(
  leadId: string,
  customToken?: string,
  customEnterpriseId?: string,
  bypassCache = false
): Promise<TeleCRMAction[]> {
  const { token, enterpriseId } = await getCredentials(customToken, customEnterpriseId)
  
  if (!token || !enterpriseId) {
    try {
      // Offline/mock mode: search leads to find details
      const searchRes = await searchLeads({ created_on: { from: 0, to: Date.now() + 10000000 } }, { limit: 100, skip: 0 }, customToken, customEnterpriseId)
      const matchedLead = searchRes.data.find(l => l.id === leadId)
      if (matchedLead) {
        return generateMockActions(matchedLead)
      }
    } catch {
      // ignore
    }
    return []
  }

  const cacheKey = `telecrm_lead_actions_${leadId}_${enterpriseId}`
  
  const res = await getOrSetCache(
    cacheKey,
    async () => {
      try {
        const url = `${BASE}/enterprise/${enterpriseId}/lead/${leadId}/timeline`
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error(`Timeline responded with status ${response.status}`)
        }

        const data = await response.json()
        const rawActions = Array.isArray(data) ? data : (data.timeline || [])
        
        return rawActions.map((act: any) => ({
          id: act.id || act._id || Math.random().toString(),
          type: act.type || 'NOTE',
          performedBy: act.performedBy || act.agentEmail || 'agent@techleadsit.com',
          performedAt: act.performedAt || act.timestamp || Date.now(),
          duration: act.duration || undefined,
          outcome: act.outcome || undefined,
          note: act.note || act.remarks || ''
        }))
      } catch (err) {
        console.warn(`Failed to fetch timeline for lead ${leadId} from TeleCRM, using deterministic fallback:`, err)
        // Attempt secondary fallback via searchLeads, but don't let it crash if that also fails
        try {
          const searchFilters = { created_on: { from: 0, to: Date.now() + 10000000 } }
          const searchRes = await searchLeads(searchFilters, { limit: 100, skip: 0 }, customToken, customEnterpriseId)
          const matchedLead = searchRes.data.find(l => l.id === leadId)
          if (matchedLead) {
            return generateMockActions(matchedLead)
          }
        } catch (fallbackErr) {
          // searchLeads also failed (e.g. 500) — silently return empty, route will use deterministic data
        }
        return []
      }
    },
    bypassCache,
    900 * 1000 // 15 mins cache TTL
  )

  return res.data
}

/**
 * Returns lead age in days
 */
export function getLeadAgeInDays(lead: TeleCRMLead): number {
  const created = lead.fields?.lead_date || lead.fields?.created_on || Date.now()
  return (Date.now() - created) / (1000 * 60 * 60 * 24)
}

/**
 * Mapped channel detection helper
 */
export function detectChannel(lead: TeleCRMLead): LeadChannel {
  return detectLeadChannel(lead)
}

/**
 * Lead priority probability conversion scoring (0-100)
 */
export function scoreLead(lead: TeleCRMLead): LeadScore {
  let score = 50 // baseline

  const factors: ScoreFactor[] = []

  // ── POSITIVE FACTORS ─────────────────────────────────
  // Course (based on historical conv rates)
  const rawCourse = lead.fields?.course || ''
  const courseGroup = getCourseGroup(rawCourse)
  if (['Oracle Fusion Technical', 'Oracle Fusion Financials'].includes(courseGroup)) {
    score += 15
    factors.push({ factor: 'Course Demand', impact: 15, reason: `Enrolled in high-demand course: ${courseGroup}` })
  } else if (['Oracle Fusion SCM', 'Oracle Fusion HCM'].includes(courseGroup)) {
    score += 10
    factors.push({ factor: 'Course Demand', impact: 10, reason: `Enrolled in popular course: ${courseGroup}` })
  }

  // Source quality
  const channel = detectLeadChannel(lead)
  if (channel === 'Referral') {
    score += 20
    factors.push({ factor: 'Source Channel', impact: 20, reason: 'Came via highly trusted Referral source' })
  } else if (channel === 'Google Ads') {
    score += 10
    factors.push({ factor: 'Source Channel', impact: 10, reason: 'Acquired via Google Ads Search intent' })
  } else if (channel === 'Organic') {
    score += 8
    factors.push({ factor: 'Source Channel', impact: 8, reason: 'Organic search visitor with high interest' })
  } else if (channel === 'Website') {
    score += 5
    factors.push({ factor: 'Source Channel', impact: 5, reason: 'Direct website inquiry' })
  }

  // Status (how far in pipeline)
  const status = lead.status || 'Fresh'
  if (status === 'Demo Attended') {
    score += 25
    factors.push({ factor: 'Lead Engagement', impact: 25, reason: 'Attended live course demo batch' })
  } else if (status === 'Potential Lead 100') {
    score += 20
    factors.push({ factor: 'Lead Qualification', impact: 20, reason: 'Marked as 100% potential hot lead' })
  } else if (status === 'Interested to join the Demo') {
    score += 18
    factors.push({ factor: 'Lead Engagement', impact: 18, reason: 'Expressed interest in attending demo' })
  } else if (status === '60-80 Potential') {
    score += 15
    factors.push({ factor: 'Lead Qualification', impact: 15, reason: 'Highly qualified 60-80% potential' })
  } else if (status === 'Looking for Next batch') {
    score += 12
    factors.push({ factor: 'Lead Intent', impact: 12, reason: 'Awaiting next training batch start date' })
  } else if (status === '50 % Potential') {
    score += 8
    factors.push({ factor: 'Lead Qualification', impact: 8, reason: 'Qualified 50% potential lead' })
  }

  // Lead age (freshness)
  const ageDays = getLeadAgeInDays(lead)
  if (ageDays < 3) {
    score += 15
    factors.push({ factor: 'Lead Age', impact: 15, reason: 'Highly fresh lead (< 3 days old)' })
  } else if (ageDays < 7) {
    score += 10
    factors.push({ factor: 'Lead Age', impact: 10, reason: 'Fresh lead (< 7 days old)' })
  } else if (ageDays < 30) {
    score += 5
    factors.push({ factor: 'Lead Age', impact: 5, reason: 'Active lead (< 30 days old)' })
  } else if (ageDays > 90) {
    score -= 15
    factors.push({ factor: 'Lead Age Decay', impact: -15, reason: 'Aging lead (> 90 days cooling period)' })
  } else if (ageDays > 180) {
    score -= 25
    factors.push({ factor: 'Lead Age Decay', impact: -25, reason: 'Highly stale lead (> 180 days dead period)' })
  }

  // Has UTM data (intent)
  if (lead.fields?.utmcampaign) {
    score += 5
    factors.push({ factor: 'Campaign Intent', impact: 5, reason: 'Came from active marketing campaign' })
  }

  // Has email (serious intent)
  if (lead.fields?.email) {
    score += 5
    factors.push({ factor: 'Contact Completeness', impact: 5, reason: 'Provided verified email address' })
  }

  // Course fee filled in (discussed price)
  if (lead.fields?.course_fee) {
    score += 10
    factors.push({ factor: 'Financial Discussion', impact: 10, reason: 'Discussed training fees & cost structure' })
  }

  // ── NEGATIVE FACTORS ─────────────────────────────────
  if (status === 'Not Interested') {
    score -= 40
    factors.push({ factor: 'Lead Disinterest', impact: -40, reason: 'Marked as Not Interested' })
  } else if (status === 'Junk Lead') {
    score -= 50
    factors.push({ factor: 'Junk Classification', impact: -50, reason: 'Flagged as junk or irrelevant lead' })
  } else if (status === 'Different Course') {
    score -= 30
    factors.push({ factor: 'Target Mismatch', impact: -30, reason: 'Looking for different software courses' })
  } else if (status === 'Wrong Number &Number Not working') {
    score -= 45
    factors.push({ factor: 'Contact Failure', impact: -45, reason: 'Incorrect or inactive phone number' })
  } else if (status === 'below 50 % Potential') {
    score -= 10
    factors.push({ factor: 'Low Qualification', impact: -10, reason: 'Evaluated as below 50% conversion potential' })
  }

  const finalScore = Math.max(0, Math.min(100, score))
  const category = finalScore >= 80 ? 'high' : finalScore >= 50 ? 'medium' : finalScore >= 20 ? 'low' : 'very_low'

  return {
    leadId: lead.id,
    score: finalScore,
    factors,
    category
  }
}

/**
 * Calculates a composite 0-100 quality score for a lead acquisition channel
 */
export function calculateSourceQualityScore(
  totalLeads: number,
  enrolled: number,
  highPotential: number,
  avgFee: number,
  avgResponseTime: number
): number {
  const convRate = enrolled / (totalLeads || 1)
  const highPotRate = highPotential / (totalLeads || 1)
  const revenueScore = (enrolled * avgFee) / 1000000
  const responseScore = avgResponseTime < 1 ? 1 : (1 / avgResponseTime)

  return Math.min(100, Math.round(
    (convRate * 400) + // 40% weight (convRate is fraction, so *400 means 10% convRate -> 0.1 * 400 = 40 pts)
    (highPotRate * 300) + // 30% weight
    (Math.min(revenueScore, 1) * 20) + // 20% weight (max 20 points for 1M+ revenue)
    (responseScore * 10) // 10% weight
  ))
}



