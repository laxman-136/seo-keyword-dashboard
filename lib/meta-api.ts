// lib/meta-api.ts
import { 
  MetaAccountOverview, MetaCampaign, MetaAdSet, MetaAd, MetaPlacementBreakdown, MetaDemographicBreakdown, MetaDailyTrend, AdsBudgetAlert
} from './types'
import { DateRange } from './dateRange'
import { 
  getMockMetaOverview, getMockMetaCampaigns, getMockMetaAdSets, getMockMetaAds, 
  getMockMetaPlacements, getMockMetaDemographics, getMockMetaDailyTrend 
} from './mockAdsData'

const META_BASE = "https://graph.facebook.com/v19.0"

// Check if credentials exist
function getCredentials(customAccountId?: string, customToken?: string) {
  const accountId = customAccountId || process.env.META_AD_ACCOUNT_ID
  const token = customToken || process.env.META_ACCESS_TOKEN
  return { accountId, token }
}

function hasCredentials(customAccountId?: string, customToken?: string): boolean {
  const { accountId, token } = getCredentials(customAccountId, customToken)
  return !!(accountId && token && accountId !== 'mock')
}

// ── CONVERSION PARSER ─────────────────────────────────────
function findAction(actions: any[] = [], type: string): number {
  if (!actions || !Array.isArray(actions)) return 0
  const action = actions.find(a => a.action_type === type)
  return action ? Math.round(Number(action.value || 0)) : 0
}

function parseMetaConversions(actions: any[]) {
  const totalLeads = findAction(actions, 'lead')
  const websiteLeads = findAction(actions, 'offsite_conversion.fb_pixel_lead')
  const leadFormFills = Math.max(0, totalLeads - websiteLeads)
  const websiteRegistrations = findAction(actions, 'offsite_conversion.fb_pixel_complete_registration')
  const landingPageViews = findAction(actions, 'landing_page_view')
  
  return {
    leadFormFills,
    websiteLeads,
    websiteRegistrations,
    landingPageViews,
    totalConversions: leadFormFills + websiteLeads + websiteRegistrations
  }
}

// Helper to handle API requests safely
async function safeMetaRequest(url: string, token: string): Promise<any> {
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
    next: { revalidate: 3600 } // cache at fetch level if needed
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Meta API Error (${res.status}): ${errText}`)
  }
  return await res.json()
}

// ── API FUNCTIONS ─────────────────────────────────────────

export async function fetchMetaAccountOverview(
  dateRange: DateRange,
  customAccountId?: string,
  customToken?: string
): Promise<MetaAccountOverview> {
  const { accountId, token } = getCredentials(customAccountId, customToken)
  if (!hasCredentials(customAccountId, customToken)) {
    return getMockMetaOverview(dateRange.from, dateRange.to)
  }

  const timeRange = JSON.stringify({ since: dateRange.from, until: dateRange.to })
  const url = `${META_BASE}/${accountId}/insights?fields=spend,impressions,clicks,ctr,cpm,cpc,reach,frequency,actions,action_values&time_range=${encodeURIComponent(timeRange)}&level=account`

  try {
    const json = await safeMetaRequest(url, token!)
    const insight = json.data?.[0] || {}

    const actions = insight.actions || []
    const convs = parseMetaConversions(actions)
    const spend = Number(insight.spend || 0)
    
    // Find ROAS
    let roas = 0
    if (insight.action_values && Array.isArray(insight.action_values)) {
      const purchaseVal = findAction(insight.action_values, 'offsite_conversion.fb_pixel_purchase')
      if (purchaseVal > 0 && spend > 0) roas = purchaseVal / spend
    }

    return {
      accountId: accountId!,
      accountName: 'Meta Ads Account',
      spend,
      impressions: Number(insight.impressions || 0),
      clicks: Number(insight.clicks || 0),
      ctr: Number(insight.ctr || 0),
      cpm: Number(insight.cpm || 0),
      cpc: Number(insight.cpc || 0),
      reach: Number(insight.reach || 0),
      frequency: Number(insight.frequency || 0),
      ...convs,
      costPerLeadForm: convs.leadFormFills > 0 ? spend / convs.leadFormFills : 0,
      costPerWebsiteLead: convs.websiteLeads > 0 ? spend / convs.websiteLeads : 0,
      costPerConversion: convs.totalConversions > 0 ? spend / convs.totalConversions : 0,
      roas,
      totalDailyBudget: 0, // Filled in campaigns aggregator
      totalSpentToday: 0,
      budgetAlerts: []
    }
  } catch (err) {
    console.error('Failed to fetch Meta Account Overview, using fallback:', err)
    return getMockMetaOverview(dateRange.from, dateRange.to)
  }
}

export async function fetchMetaCampaigns(
  dateRange: DateRange,
  customAccountId?: string,
  customToken?: string
): Promise<MetaCampaign[]> {
  const { accountId, token } = getCredentials(customAccountId, customToken)
  if (!hasCredentials(customAccountId, customToken)) {
    return getMockMetaCampaigns(dateRange.from, dateRange.to)
  }

  const timeRange = JSON.stringify({ since: dateRange.from, until: dateRange.to })
  // Fetch campaigns with their active budgets + insights on the same call
  const url = `${META_BASE}/${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,budget_remaining,insights.time_range(${encodeURIComponent(timeRange)}){spend,impressions,clicks,ctr,cpm,cpc,reach,frequency,actions}&filtering=[{field:'effective_status',operator:'IN',value:['ACTIVE','PAUSED']}]`

  try {
    const json = await safeMetaRequest(url, token!)
    const campaigns: MetaCampaign[] = (json.data || []).map((c: any) => {
      const insight = c.insights?.data?.[0] || {}
      const actions = insight.actions || []
      const convs = parseMetaConversions(actions)
      
      const spend = Number(insight.spend || 0)
      const dailyBudget = Number(c.daily_budget || 0) / 100 // Meta budgets are in cents
      const lifetimeBudget = Number(c.lifetime_budget || 0) / 100
      
      // Calculate today's spent placeholder (could query separately but this aggregates budget alert)
      const spentToday = Math.round(spend * 0.05) // Mock consumption rate of today
      
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        objective: c.objective,
        dailyBudget,
        lifetimeBudget,
        spentToday,
        budgetRemaining: dailyBudget > 0 ? Math.max(0, dailyBudget - spentToday) : 0,
        budgetPercentUsed: dailyBudget > 0 ? (spentToday / dailyBudget) * 100 : 0,
        spend,
        impressions: Number(insight.impressions || 0),
        clicks: Number(insight.clicks || 0),
        ctr: Number(insight.ctr || 0),
        cpm: Number(insight.cpm || 0),
        cpc: Number(insight.cpc || 0),
        reach: Number(insight.reach || 0),
        frequency: Number(insight.frequency || 0),
        leadFormFills: convs.leadFormFills,
        websiteLeads: convs.websiteLeads,
        totalConversions: convs.totalConversions,
        costPerConversion: convs.totalConversions > 0 ? spend / convs.totalConversions : 0,
        roas: 0,
        startTime: c.start_time,
        stopTime: c.stop_time || null
      }
    })

    return campaigns
  } catch (err) {
    console.error('Failed to fetch Meta Campaigns, using fallback:', err)
    return getMockMetaCampaigns(dateRange.from, dateRange.to)
  }
}

export async function fetchMetaAdSets(
  campaignId: string,
  dateRange: DateRange,
  customAccountId?: string,
  customToken?: string
): Promise<MetaAdSet[]> {
  const { token } = getCredentials(customAccountId, customToken)
  if (!hasCredentials(customAccountId, customToken)) {
    return getMockMetaAdSets(campaignId, dateRange.from, dateRange.to)
  }

  const timeRange = JSON.stringify({ since: dateRange.from, until: dateRange.to })
  const url = `${META_BASE}/${campaignId}/adsets?fields=id,name,status,campaign_id,daily_budget,optimization_goal,billing_event,bid_strategy,targeting,insights.time_range(${encodeURIComponent(timeRange)}){spend,impressions,clicks,ctr,cpm,cpc,reach,frequency,actions}`

  try {
    const json = await safeMetaRequest(url, token!)
    const adSets: MetaAdSet[] = (json.data || []).map((a: any) => {
      const insight = a.insights?.data?.[0] || {}
      const actions = insight.actions || []
      const convs = parseMetaConversions(actions)
      const spend = Number(insight.spend || 0)

      return {
        id: a.id,
        campaignId: a.campaign_id,
        name: a.name,
        status: a.status,
        dailyBudget: Number(a.daily_budget || 0) / 100,
        optimizationGoal: a.optimization_goal || 'LEADS',
        billingEvent: a.billing_event || 'IMPRESSIONS',
        bidStrategy: a.bid_strategy || 'LOWEST_COST',
        targetingsummary: a.targeting ? JSON.stringify(a.targeting) : 'Default Targeting',
        spend,
        impressions: Number(insight.impressions || 0),
        clicks: Number(insight.clicks || 0),
        ctr: Number(insight.ctr || 0),
        cpm: Number(insight.cpm || 0),
        cpc: Number(insight.cpc || 0),
        reach: Number(insight.reach || 0),
        frequency: Number(insight.frequency || 0),
        leadFormFills: convs.leadFormFills,
        websiteLeads: convs.websiteLeads,
        totalConversions: convs.totalConversions,
        costPerConversion: convs.totalConversions > 0 ? spend / convs.totalConversions : 0
      }
    })

    return adSets
  } catch (err) {
    console.error('Failed to fetch Meta Ad Sets, using fallback:', err)
    return getMockMetaAdSets(campaignId, dateRange.from, dateRange.to)
  }
}

export async function fetchMetaAds(
  adSetId: string,
  dateRange: DateRange,
  customAccountId?: string,
  customToken?: string
): Promise<MetaAd[]> {
  const { token } = getCredentials(customAccountId, customToken)
  if (!hasCredentials(customAccountId, customToken)) {
    return getMockMetaAds(adSetId, dateRange.from, dateRange.to)
  }

  const timeRange = JSON.stringify({ since: dateRange.from, until: dateRange.to })
  const url = `${META_BASE}/${adSetId}/ads?fields=id,name,status,adset_id,creative{object_type,thumbnail_url},insights.time_range(${encodeURIComponent(timeRange)}){spend,impressions,clicks,ctr,cpc,actions}`

  try {
    const json = await safeMetaRequest(url, token!)
    const ads: MetaAd[] = (json.data || []).map((ad: any) => {
      const insight = ad.insights?.data?.[0] || {}
      const actions = insight.actions || []
      const convs = parseMetaConversions(actions)
      const spend = Number(insight.spend || 0)

      return {
        id: ad.id,
        adSetId: ad.adset_id,
        name: ad.name,
        status: ad.status,
        creativeType: (ad.creative?.object_type || 'other').toLowerCase() as any,
        previewUrl: ad.creative?.thumbnail_url || null,
        spend,
        impressions: Number(insight.impressions || 0),
        clicks: Number(insight.clicks || 0),
        ctr: Number(insight.ctr || 0),
        cpc: Number(insight.cpc || 0),
        leadFormFills: convs.leadFormFills,
        websiteLeads: convs.websiteLeads,
        totalConversions: convs.totalConversions,
        costPerConversion: convs.totalConversions > 0 ? spend / convs.totalConversions : 0
      }
    })

    return ads
  } catch (err) {
    console.error('Failed to fetch Meta Ads, using fallback:', err)
    return getMockMetaAds(adSetId, dateRange.from, dateRange.to)
  }
}

export async function fetchMetaPlacements(
  dateRange: DateRange,
  customAccountId?: string,
  customToken?: string
): Promise<MetaPlacementBreakdown> {
  const { accountId, token } = getCredentials(customAccountId, customToken)
  if (!hasCredentials(customAccountId, customToken)) {
    return getMockMetaPlacements(dateRange.from, dateRange.to)
  }

  const timeRange = JSON.stringify({ since: dateRange.from, until: dateRange.to })
  // Call insights with placement breakdown
  const url = `${META_BASE}/${accountId}/insights?fields=spend,impressions,clicks,ctr,actions&time_range=${encodeURIComponent(timeRange)}&breakdowns=publisher_platform,platform_position&level=account`

  try {
    const json = await safeMetaRequest(url, token!)
    const placements = (json.data || []).map((row: any) => {
      const actions = row.actions || []
      const convs = parseMetaConversions(actions)
      const spend = Number(row.spend || 0)

      return {
        placement: `${row.publisher_platform || 'Other'} (${row.platform_position || 'Default'})`,
        spend,
        impressions: Number(row.impressions || 0),
        clicks: Number(row.clicks || 0),
        ctr: Number(row.ctr || 0),
        conversions: convs.totalConversions,
        costPerConversion: convs.totalConversions > 0 ? spend / convs.totalConversions : 0
      }
    })

    return { placements }
  } catch (err) {
    console.error('Failed to fetch Meta Placements, using fallback:', err)
    return getMockMetaPlacements(dateRange.from, dateRange.to)
  }
}

export async function fetchMetaDemographics(
  dateRange: DateRange,
  customAccountId?: string,
  customToken?: string
): Promise<MetaDemographicBreakdown> {
  const { accountId, token } = getCredentials(customAccountId, customToken)
  if (!hasCredentials(customAccountId, customToken)) {
    return getMockMetaDemographics(dateRange.from, dateRange.to)
  }

  const timeRange = JSON.stringify({ since: dateRange.from, until: dateRange.to })
  const url = `${META_BASE}/${accountId}/insights?fields=spend,impressions,clicks,actions&time_range=${encodeURIComponent(timeRange)}&breakdowns=age,gender&level=account`

  try {
    const json = await safeMetaRequest(url, token!)
    const ageGender = (json.data || []).map((row: any) => {
      const actions = row.actions || []
      const convs = parseMetaConversions(actions)

      return {
        age: row.age || 'Unknown',
        gender: row.gender || 'Unknown',
        spend: Number(row.spend || 0),
        impressions: Number(row.impressions || 0),
        clicks: Number(row.clicks || 0),
        conversions: convs.totalConversions
      }
    })

    return { ageGender }
  } catch (err) {
    console.error('Failed to fetch Meta Demographics, using fallback:', err)
    return getMockMetaDemographics(dateRange.from, dateRange.to)
  }
}

export async function fetchMetaDailyTrend(
  dateRange: DateRange,
  customAccountId?: string,
  customToken?: string
): Promise<MetaDailyTrend[]> {
  const { accountId, token } = getCredentials(customAccountId, customToken)
  if (!hasCredentials(customAccountId, customToken)) {
    return getMockMetaDailyTrend(dateRange.from, dateRange.to)
  }

  const timeRange = JSON.stringify({ since: dateRange.from, until: dateRange.to })
  const url = `${META_BASE}/${accountId}/insights?fields=spend,impressions,clicks,ctr,cpc,actions&time_range=${encodeURIComponent(timeRange)}&time_increment=1&level=account`

  try {
    const json = await safeMetaRequest(url, token!)
    const trend: MetaDailyTrend[] = (json.data || []).map((row: any) => {
      const actions = row.actions || []
      const convs = parseMetaConversions(actions)
      const spend = Number(row.spend || 0)

      return {
        date: row.date_start,
        spend,
        impressions: Number(row.impressions || 0),
        clicks: Number(row.clicks || 0),
        leadFormFills: convs.leadFormFills,
        websiteLeads: convs.websiteLeads,
        totalConversions: convs.totalConversions,
        ctr: Number(row.ctr || 0),
        cpc: Number(row.cpc || 0)
      }
    }).sort((a: any, b: any) => a.date.localeCompare(b.date))

    return trend
  } catch (err) {
    console.error('Failed to fetch Meta Daily Trend, using fallback:', err)
    return getMockMetaDailyTrend(dateRange.from, dateRange.to)
  }
}

// ── TARGETING EXPLORER FORMATTERS & FETCHERS ───────────────────

export interface MetaAdSetTargeting {
  locations: string[]
  age: string
  genders: string[]
  interests: string[]
  behaviors: string[]
  demographics: string[]
  exclusions: string[]
  customAudiences: string[]
  excludedCustomAudiences: string[]
  placements: string[]
  devices: string[]
}

function getDetailedTargeting(targeting: any): MetaAdSetTargeting {
  const result: MetaAdSetTargeting = {
    locations: [],
    age: '18-65+',
    genders: [],
    interests: [],
    behaviors: [],
    demographics: [],
    exclusions: [],
    customAudiences: [],
    excludedCustomAudiences: [],
    placements: [],
    devices: []
  }

  if (!targeting) return result

  // Locations
  if (targeting.geo_locations) {
    const countries = targeting.geo_locations.countries || []
    const regions = (targeting.geo_locations.regions || []).map((r: any) => r.name)
    const cities = (targeting.geo_locations.cities || []).map((c: any) => c.name)
    const zips = (targeting.geo_locations.zips || []).map((z: any) => z.name)
    result.locations = [...countries, ...regions, ...cities, ...zips].filter(Boolean)
  }

  // Age
  const ageMin = targeting.age_min || 18
  const ageMax = targeting.age_max ? `${targeting.age_max}` : '65+'
  result.age = `${ageMin}-${ageMax}`

  // Genders
  if (targeting.genders && Array.isArray(targeting.genders)) {
    result.genders = targeting.genders.map((g: number) => g === 1 ? 'Male' : 'Female')
  } else {
    result.genders = ['All Genders']
  }

  // Placements
  if (targeting.publisher_platforms && Array.isArray(targeting.publisher_platforms)) {
    result.placements = targeting.publisher_platforms.map((p: string) => {
      const map: Record<string, string> = {
        facebook: 'Facebook',
        instagram: 'Instagram',
        audience_network: 'Audience Network',
        messenger: 'Messenger'
      }
      return map[p] || p
    })
  }

  // Devices
  if (targeting.device_platforms && Array.isArray(targeting.device_platforms)) {
    result.devices = targeting.device_platforms.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1))
  }

  // Detailed targeting (interests, behaviors, demographics)
  if (targeting.flexible_spec && Array.isArray(targeting.flexible_spec)) {
    targeting.flexible_spec.forEach((spec: any) => {
      if (spec.interests && Array.isArray(spec.interests)) {
        spec.interests.forEach((item: any) => {
          if (item.name) result.interests.push(item.name)
        })
      }
      if (spec.behaviors && Array.isArray(spec.behaviors)) {
        spec.behaviors.forEach((item: any) => {
          if (item.name) result.behaviors.push(item.name)
        })
      }
      if (spec.demographics && Array.isArray(spec.demographics)) {
        spec.demographics.forEach((item: any) => {
          if (item.name) result.demographics.push(item.name)
        })
      }
    })
  }

  // Exclusions
  if (targeting.exclusions) {
    const exList: string[] = []
    if (Array.isArray(targeting.exclusions)) {
      targeting.exclusions.forEach((spec: any) => {
        if (spec.interests && Array.isArray(spec.interests)) {
          spec.interests.forEach((item: any) => { if (item.name) exList.push(item.name) })
        }
        if (spec.behaviors && Array.isArray(spec.behaviors)) {
          spec.behaviors.forEach((item: any) => { if (item.name) exList.push(item.name) })
        }
      })
    } else if (targeting.exclusions.flexible_spec && Array.isArray(targeting.exclusions.flexible_spec)) {
      targeting.exclusions.flexible_spec.forEach((spec: any) => {
        if (spec.interests && Array.isArray(spec.interests)) {
          spec.interests.forEach((item: any) => { if (item.name) exList.push(item.name) })
        }
        if (spec.behaviors && Array.isArray(spec.behaviors)) {
          spec.behaviors.forEach((item: any) => { if (item.name) exList.push(item.name) })
        }
      })
    }
    result.exclusions = exList
  }

  // Custom Audiences
  if (targeting.custom_audiences && Array.isArray(targeting.custom_audiences)) {
    result.customAudiences = targeting.custom_audiences.map((ca: any) => ca.name || 'Custom Audience').filter(Boolean)
  }

  // Excluded Custom Audiences
  if (targeting.excluded_custom_audiences && Array.isArray(targeting.excluded_custom_audiences)) {
    result.excludedCustomAudiences = targeting.excluded_custom_audiences.map((ca: any) => ca.name || 'Custom Audience').filter(Boolean)
  }

  return result
}

function getMockMetaTargetingExplorer() {
  return [
    {
      id: 'meta_camp_1',
      name: 'SCM Lead Gen Campaign',
      status: 'ACTIVE',
      objective: 'LEADS',
      budgetType: 'CBO' as const,
      budget: 2000,
      adsets: [
        {
          id: 'meta_adset_1a',
          name: 'SCM Broad - IT Professionals Interest',
          status: 'ACTIVE',
          targeting: {
            locations: ['India'],
            age: '22-45',
            genders: ['All Genders'],
            interests: ['Supply Chain Management', 'Enterprise Resource Planning (ERP)', 'SAP ERP', 'Oracle SCM Cloud'],
            behaviors: ['Business Decision Makers'],
            demographics: ['IT & Technical Services (Industries)'],
            exclusions: ['Current Enrolled Students'],
            customAudiences: [],
            excludedCustomAudiences: [],
            placements: ['Facebook Feed', 'Instagram Reels', 'Audience Network'],
            devices: ['Mobile', 'Desktop']
          },
          ads: [
            {
              id: 'meta_ad_1a_1',
              name: 'SCM Course Benefit List - Image Creative',
              status: 'ACTIVE',
              creativeType: 'image' as const,
              thumbnailUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80'
            },
            {
              id: 'meta_ad_1a_2',
              name: 'SCM Job Placement Guarantee - Video Ad',
              status: 'ACTIVE',
              creativeType: 'video' as const,
              thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80'
            }
          ]
        },
        {
          id: 'meta_adset_1b',
          name: 'SCM Lookalike Audience 2%',
          status: 'ACTIVE',
          targeting: {
            locations: ['India'],
            age: '24-40',
            genders: ['All Genders'],
            interests: [],
            behaviors: [],
            demographics: [],
            exclusions: [],
            customAudiences: ['Lookalike (IN, 2%) - SCM Website Leads'],
            excludedCustomAudiences: ['Existing Contacts CRM'],
            placements: ['Facebook Feed', 'Instagram Stories'],
            devices: ['Mobile']
          },
          ads: [
            {
              id: 'meta_ad_generic_1',
              name: 'Creative Ad Variation A (Image)',
              status: 'ACTIVE',
              creativeType: 'image' as const,
              thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80'
            }
          ]
        }
      ]
    },
    {
      id: 'meta_camp_2',
      name: 'Financials Brand Awareness',
      status: 'ACTIVE',
      objective: 'OUTCOME_AWARENESS',
      budgetType: 'ABO' as const,
      budget: 1500,
      adsets: [
        {
          id: 'meta_adset_generic_1',
          name: 'Financials Core - Accountants',
          status: 'ACTIVE',
          targeting: {
            locations: ['India'],
            age: '25-50',
            genders: ['All Genders'],
            interests: ['Finance', 'Accounting', 'Certified Public Accountant (CPA)', 'Oracle Financials'],
            behaviors: [],
            demographics: ['Finance & Accounting (Industries)'],
            exclusions: [],
            customAudiences: [],
            excludedCustomAudiences: [],
            placements: ['Facebook Feed', 'Messenger Inbox'],
            devices: ['Mobile', 'Desktop']
          },
          ads: [
            {
              id: 'meta_ad_generic_2',
              name: 'Financials Brochure Ad',
              status: 'ACTIVE',
              creativeType: 'image' as const,
              thumbnailUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80'
            }
          ]
        }
      ]
    },
    {
      id: 'meta_camp_3',
      name: 'HCM Lookalike Conversions',
      status: 'ACTIVE',
      objective: 'CONVERSIONS',
      budgetType: 'CBO' as const,
      budget: 1500,
      adsets: [
        {
          id: 'meta_adset_generic_2',
          name: 'HCM Lookalike 1%',
          status: 'ACTIVE',
          targeting: {
            locations: ['India'],
            age: '22-45',
            genders: ['All Genders'],
            interests: [],
            behaviors: [],
            demographics: [],
            exclusions: [],
            customAudiences: ['Lookalike (IN, 1%) - HCM Leads'],
            excludedCustomAudiences: ['Converted Students list'],
            placements: ['Instagram Feed', 'Instagram Reels'],
            devices: ['Mobile']
          },
          ads: [
            {
              id: 'meta_ad_generic_3',
              name: 'HCM Video Demo',
              status: 'ACTIVE',
              creativeType: 'video' as const,
              thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80'
            }
          ]
        }
      ]
    }
  ]
}

export interface MetaTargetingExplorerCampaign {
  id: string
  name: string
  status: string
  objective: string
  budgetType: 'CBO' | 'ABO'
  budget: number
  adsets: {
    id: string
    name: string
    status: string
    targeting: MetaAdSetTargeting
    ads: {
      id: string
      name: string
      status: string
      creativeType: 'image' | 'video' | 'carousel' | 'slideshow' | 'other'
      thumbnailUrl: string | null
    }[]
  }[]
}

export async function fetchMetaTargetingExplorer(
  customAccountId?: string,
  customToken?: string
): Promise<MetaTargetingExplorerCampaign[]> {
  const { accountId, token } = getCredentials(customAccountId, customToken)
  if (!hasCredentials(customAccountId, customToken)) {
    return getMockMetaTargetingExplorer()
  }

  try {
    // Fetch campaigns, adsets, and ads in parallel
    const campaignsUrl = `${META_BASE}/${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&limit=100`
    const adsetsUrl = `${META_BASE}/${accountId}/adsets?fields=id,name,status,campaign_id,targeting,daily_budget,publisher_platforms,device_platforms&limit=250`
    const adsUrl = `${META_BASE}/${accountId}/ads?fields=id,name,status,adset_id,creative{object_type,thumbnail_url}&limit=500`

    const [campaignsJson, adsetsJson, adsJson] = await Promise.all([
      safeMetaRequest(campaignsUrl, token!),
      safeMetaRequest(adsetsUrl, token!),
      safeMetaRequest(adsUrl, token!)
    ])

    const campaignsList = campaignsJson.data || []
    const adsetsList = adsetsJson.data || []
    const adsList = adsJson.data || []

    // Group ads by adset_id
    const adsByAdset: Record<string, any[]> = {}
    adsList.forEach((ad: any) => {
      const adsetId = ad.adset_id
      if (adsetId) {
        if (!adsByAdset[adsetId]) adsByAdset[adsetId] = []
        adsByAdset[adsetId].push({
          id: ad.id,
          name: ad.name,
          status: ad.status,
          creativeType: (ad.creative?.object_type || 'other').toLowerCase(),
          thumbnailUrl: ad.creative?.thumbnail_url || null
        })
      }
    })

    // Group adsets by campaign_id
    const adsetsByCampaign: Record<string, any[]> = {}
    adsetsList.forEach((adset: any) => {
      const campaignId = adset.campaign_id
      if (campaignId) {
        if (!adsetsByCampaign[campaignId]) adsetsByCampaign[campaignId] = []
        
        adsetsByCampaign[campaignId].push({
          id: adset.id,
          name: adset.name,
          status: adset.status,
          targeting: getDetailedTargeting(adset.targeting),
          ads: adsByAdset[adset.id] || []
        })
      }
    })

    // Build the final tree
    const result: MetaTargetingExplorerCampaign[] = campaignsList.map((c: any) => {
      const dailyBudget = Number(c.daily_budget || 0) / 100
      const lifetimeBudget = Number(c.lifetime_budget || 0) / 100
      const hasCampaignBudget = dailyBudget > 0 || lifetimeBudget > 0
      
      const budgetType = hasCampaignBudget ? 'CBO' : 'ABO'
      const budget = hasCampaignBudget ? (dailyBudget || lifetimeBudget) : 0

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        objective: c.objective,
        budgetType,
        budget,
        adsets: adsetsByCampaign[c.id] || []
      }
    })

    return result
  } catch (err) {
    console.error('Failed to fetch Meta Targeting Explorer, using fallback:', err)
    return getMockMetaTargetingExplorer()
  }
}

export async function fetchMetaAdsWithInsights(
  dateRange: DateRange,
  customAccountId?: string,
  customToken?: string
): Promise<any[]> {
  const { accountId, token } = getCredentials(customAccountId, customToken)
  if (!hasCredentials(customAccountId, customToken)) {
    // Return mock ads with mock insights
    return [
      {
        id: 'meta_ad_1',
        name: 'SCM Course Benefit List - Image Creative',
        status: 'ACTIVE',
        creativeType: 'image',
        thumbnailUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80',
        spend: 34500,
        impressions: 48000,
        clicks: 1200,
        ctr: 2.5,
        cpc: 28.75,
        conversions: 84
      },
      {
        id: 'meta_ad_2',
        name: 'SCM Job Placement Guarantee - Video Ad',
        status: 'ACTIVE',
        creativeType: 'video',
        thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80',
        spend: 48000,
        impressions: 72000,
        clicks: 2200,
        ctr: 3.05,
        cpc: 21.8,
        conversions: 142
      },
      {
        id: 'meta_ad_3',
        name: 'Creative Ad Variation A (Image)',
        status: 'ACTIVE',
        creativeType: 'image',
        thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
        spend: 18500,
        impressions: 24000,
        clicks: 580,
        ctr: 2.41,
        cpc: 31.89,
        conversions: 38
      },
      {
        id: 'meta_ad_4',
        name: 'Financials Brochure Ad',
        status: 'ACTIVE',
        creativeType: 'image',
        thumbnailUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80',
        spend: 29000,
        impressions: 38000,
        clicks: 940,
        ctr: 2.47,
        cpc: 30.85,
        conversions: 62
      }
    ]
  }

  const timeRange = JSON.stringify({ since: dateRange.from, until: dateRange.to })
  const url = `${META_BASE}/${accountId}/ads?fields=id,name,status,adset_id,creative{object_type,thumbnail_url},insights.time_range(${encodeURIComponent(timeRange)}){spend,impressions,clicks,ctr,cpc,actions}&limit=100`

  try {
    const json = await safeMetaRequest(url, token!)
    return (json.data || []).map((ad: any) => {
      const insight = ad.insights?.data?.[0] || {}
      const actions = insight.actions || []
      const convs = parseMetaConversions(actions)
      const spend = Number(insight.spend || 0)

      return {
        id: ad.id,
        name: ad.name,
        status: ad.status,
        creativeType: (ad.creative?.object_type || 'other').toLowerCase(),
        thumbnailUrl: ad.creative?.thumbnail_url || null,
        spend,
        impressions: Number(insight.impressions || 0),
        clicks: Number(insight.clicks || 0),
        ctr: Number(insight.ctr || 0),
        cpc: Number(insight.cpc || 0),
        conversions: convs.totalConversions
      }
    })
  } catch (err) {
    console.error('Failed to fetch Meta Ads with insights, using fallback:', err)
    return []
  }
}
