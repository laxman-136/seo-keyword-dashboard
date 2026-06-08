// lib/attribution.ts
import { TeleCRMLead, LeadCategory, LeadChannel } from './types'
import { getCourseFeeAndName } from './course-mapping'
import { getAllLeads } from './telecrm-api'

export interface AttributedLead {
  leadId: string
  status: string
  category: LeadCategory
  courseName: string
  createdOn: number // Unix ms timestamp
  channel: 'meta' | 'google' | 'organic' | 'direct' | 'referral' | 'unknown'
  campaignName: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmContent: string | null
  fbclid: string | null
  gclid: string | null
  isEnrolled: boolean
  isPaid: boolean
  feeValue: number
}

export interface Touchpoint {
  channel: 'meta' | 'google' | 'organic' | 'direct' | 'referral' | 'unknown'
  campaignName: string | null
  touchDate: number | null
  touchType: 'first' | 'middle' | 'last'
}

export interface CustomerJourney {
  leadId: string
  touchpoints: Touchpoint[]
  totalTouchpoints: number
  firstTouchChannel: 'meta' | 'google' | 'organic' | 'direct' | 'referral' | 'unknown'
  lastTouchChannel: 'meta' | 'google' | 'organic' | 'direct' | 'referral' | 'unknown'
  daysToConvert: number
  isEnrolled: boolean
  courseName: string
}

export interface CampaignAttributionResult {
  campaignName: string
  platform: 'meta' | 'google' | 'organic' | 'direct' | 'referral' | 'other'
  status: 'ACTIVE' | 'PAUSED'
  totalLeads: number
  adLeads: number
  enrolledLeads: number
  highPotentialLeads: number
  conversionRate: number
  attributedRevenue: number
  spend: number
  costPerLead: number
  costPerEnrolled: number
  costPerHighPotential: number
  trueROAS: number
}

/**
 * Normalizes a campaign name for fuzzy comparison by converting to lowercase,
 * stripping non-alphanumeric characters, and removing common platform prefixes.
 */
export function normalizeCampaignName(name: string): string {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/^(google|meta|facebook|instagram|gads|adset)\b/g, '') // remove prefix keywords
    .replace(/[^a-z0-9]/g, '') // strip symbols and spaces
}

/**
 * Checks if two campaign names are a fuzzy match (either equal when normalized, or one contains the other)
 */
export function isFuzzyCampaignMatch(nameA: string, nameB: string): boolean {
  if (!nameA || !nameB) return false
  const normA = normalizeCampaignName(nameA)
  const normB = normalizeCampaignName(nameB)
  if (!normA || !normB) return false
  return normA === normB || normA.includes(normB) || normB.includes(normA)
}

// Order of priority channel matching logic
export function attributeLead(lead: TeleCRMLead): AttributedLead {
  const fields = lead.fields || {}
  const status = lead.status || 'Fresh'
  
  // Enforce Lead Category
  let category: LeadCategory = 'Fresh/Unqualified'
  if (status === 'Enrolled') category = 'Enrolled'
  else if ([
    'Interested to join the Demo',
    'Potential Lead 100',
    'Demo Attended',
    '60-80 Potential'
  ].includes(status)) {
    category = 'High Potential'
  } else if ([
    'Looking for Next batch',
    '50 % Potential',
    'below 50 % Potential'
  ].includes(status)) {
    category = 'Medium Potential'
  } else if ([
    'Not Interested',
    'Junk Lead',
    'Different Course',
    'Wrong Number &Number Not working',
    'Lost'
  ].includes(status)) {
    category = 'Low/Cold'
  }

  // Normalise Course Name and Fees
  const { name: courseName, fee } = getCourseFeeAndName(fields.course || '')
  
  // Lead detection
  let channel: AttributedLead['channel'] = 'unknown'
  let isPaid = false

  const utmSource = fields.utmsource?.toLowerCase() || null
  const utmMedium = fields.utmmedium?.toLowerCase() || null
  const utmCampaign = fields.utmcampaign || null
  const utmContent = fields.utmcontent || null
  
  const fbclid = fields.fbclid || null
  const gclid = fields.google_gcl_id || null
  const leadSource = fields.lead_source_1?.toLowerCase() || ''

  if (fbclid) {
    channel = 'meta'
    isPaid = true
  } else if (gclid) {
    channel = 'google'
    isPaid = true
  } else if (utmSource === 'an' || utmSource?.includes('facebook') || utmSource?.includes('instagram') || utmSource?.includes('meta')) {
    channel = 'meta'
    isPaid = true
  } else if (utmSource === 'google' || utmSource === 'gads' || utmMedium === 'cpc' || utmMedium === 'ppc') {
    channel = 'google'
    isPaid = true
  } else if (utmSource === 'organic' || leadSource.includes('organic')) {
    channel = 'organic'
  } else if (utmSource === 'referral' || leadSource.includes('referral')) {
    channel = 'referral'
  } else if (leadSource.includes('website')) {
    channel = 'direct'
  }

  const isEnrolled = category === 'Enrolled'

  return {
    leadId: lead.id,
    status,
    category,
    courseName,
    createdOn: fields.created_on || Date.now(),
    channel,
    campaignName: utmCampaign || (channel === 'meta' ? 'Meta Paid Campaign' : channel === 'google' ? 'Google Paid Campaign' : 'Organic Traffic'),
    utmSource: fields.utmsource || null,
    utmMedium: fields.utmmedium || null,
    utmCampaign,
    utmContent,
    fbclid,
    gclid,
    isEnrolled,
    isPaid,
    feeValue: isEnrolled ? fee : 0
  }
}

/**
 * Builds a clean attributed dataset by pulling TeleCRM leads
 */
export async function buildAttributionDataset(
  dateRange: { from: Date; to: Date },
  customToken?: string,
  customEnterpriseId?: string,
  bypassCache = false
): Promise<AttributedLead[]> {
  const leads = await getAllLeads(
    { dateRange },
    customToken,
    customEnterpriseId,
    bypassCache
  )
  return leads.map(attributeLead)
}

/**
 * Reconstructs customer journeys for multi-touch attribution
 */
export function reconstructJourneys(leads: AttributedLead[]): CustomerJourney[] {
  return leads.map(lead => {
    const touchpoints: Touchpoint[] = []

    // If both fbclid and gclid are present, lead saw both platforms
    if (lead.fbclid && lead.gclid) {
      touchpoints.push({
        channel: 'meta',
        campaignName: lead.utmCampaign || 'Meta campaign',
        touchDate: lead.createdOn - (24 * 60 * 60 * 1000), // mock prior touch
        touchType: 'first'
      })
      touchpoints.push({
        channel: 'google',
        campaignName: lead.utmCampaign || 'Google campaign',
        touchDate: lead.createdOn,
        touchType: 'last'
      })
    } else {
      // Single channel
      touchpoints.push({
        channel: lead.channel,
        campaignName: lead.campaignName,
        touchDate: lead.createdOn,
        touchType: 'first'
      })
    }

    const firstTouch = touchpoints[0]?.channel || 'unknown'
    const lastTouch = touchpoints[touchpoints.length - 1]?.channel || 'unknown'

    return {
      leadId: lead.leadId,
      touchpoints,
      totalTouchpoints: touchpoints.length,
      firstTouchChannel: firstTouch,
      lastTouchChannel: lastTouch,
      daysToConvert: 1 + (lead.leadId.charCodeAt(0) % 7), // mock days to close
      isEnrolled: lead.isEnrolled,
      courseName: lead.courseName
    }
  })
}

/**
 * Aggregates campaign revenue/leads and returns details
 */
export function calculateCampaignAttribution(
  leads: AttributedLead[],
  campaignName: string,
  campaignSpend: number,
  platform: CampaignAttributionResult['platform'] = 'other',
  status: CampaignAttributionResult['status'] = 'ACTIVE',
  adLeads: number = 0
): CampaignAttributionResult {
  const campaignLeads = leads.filter(l => isFuzzyCampaignMatch(l.campaignName || '', campaignName))
  const enrolled = campaignLeads.filter(l => l.isEnrolled)
  const hp = campaignLeads.filter(l => l.category === 'High Potential')

  const totalLeads = campaignLeads.length
  const enrolledLeads = enrolled.length
  const highPotentialLeads = hp.length

  const attributedRevenue = enrolled.reduce((sum, l) => sum + l.feeValue, 0)
  
  const costPerLead = totalLeads > 0 ? campaignSpend / totalLeads : 0
  const costPerEnrolled = enrolledLeads > 0 ? campaignSpend / enrolledLeads : 0
  const costPerHighPotential = highPotentialLeads > 0 ? campaignSpend / highPotentialLeads : 0
  const trueROAS = campaignSpend > 0 ? attributedRevenue / campaignSpend : 0

  return {
    campaignName,
    platform,
    status,
    totalLeads,
    adLeads,
    enrolledLeads,
    highPotentialLeads,
    conversionRate: totalLeads > 0 ? parseFloat(((enrolledLeads / totalLeads) * 100).toFixed(2)) : 0,
    attributedRevenue,
    spend: campaignSpend,
    costPerLead: parseFloat(costPerLead.toFixed(1)),
    costPerEnrolled: parseFloat(costPerEnrolled.toFixed(1)),
    costPerHighPotential: parseFloat(costPerHighPotential.toFixed(1)),
    trueROAS: parseFloat(trueROAS.toFixed(2))
  }
}
