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
