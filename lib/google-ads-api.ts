// lib/google-ads-api.ts
import { 
  GoogleAccountOverview, GoogleCampaign, GoogleAdGroup, GoogleKeyword, GoogleSearchTerm, GoogleAd, GoogleDeviceBreakdown, GoogleGeoBreakdown, GoogleDailyTrend
} from './types'
import { DateRange } from './dateRange'
import {
  getMockGoogleOverview, getMockGoogleCampaigns, getMockGoogleAdGroups, getMockGoogleKeywords,
  getMockGoogleSearchTerms, getMockGoogleAds, getMockGoogleDevices, getMockGoogleGeo, getMockGoogleDailyTrend
} from './mockAdsData'

// Dynamic check for credentials
function hasGoogleCredentials(
  customDevToken?: string,
  customClientId?: string,
  customClientSecret?: string,
  customRefreshToken?: string,
  customCustomerId?: string
): boolean {
  const devToken = customDevToken || process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  const clientId = customClientId || process.env.GOOGLE_ADS_CLIENT_ID
  const clientSecret = customClientSecret || process.env.GOOGLE_ADS_CLIENT_SECRET
  const refreshToken = customRefreshToken || process.env.GOOGLE_ADS_REFRESH_TOKEN
  const customerId = customCustomerId || process.env.GOOGLE_ADS_CUSTOMER_ID

  return !!(devToken && clientId && clientSecret && refreshToken && customerId && customerId !== 'mock')
}

// --- Enum Mappers to handle numeric values returned by Google Ads API ---
function mapCampaignStatus(status: any): 'ENABLED' | 'PAUSED' | 'REMOVED' {
  if (status === 2 || status === 'ENABLED') return 'ENABLED'
  if (status === 3 || status === 'PAUSED') return 'PAUSED'
  if (status === 4 || status === 'REMOVED') return 'REMOVED'
  return (String(status || 'ENABLED') as any)
}

function mapAdvertisingChannelType(type: any): 'SEARCH' | 'DISPLAY' | 'PERFORMANCE_MAX' | 'VIDEO' | 'SHOPPING' | 'SMART' {
  if (type === 2 || type === 'SEARCH') return 'SEARCH'
  if (type === 3 || type === 'DISPLAY') return 'DISPLAY'
  if (type === 4 || type === 'SHOPPING') return 'SHOPPING'
  if (type === 6 || type === 'VIDEO') return 'VIDEO'
  if (type === 7 || type === 'MULTI_CHANNEL' || type === 'PERFORMANCE_MAX') return 'PERFORMANCE_MAX'
  return (String(type || 'SEARCH') as any)
}

function mapAdGroupStatus(status: any): 'ENABLED' | 'PAUSED' | 'REMOVED' {
  if (status === 2 || status === 'ENABLED') return 'ENABLED'
  if (status === 3 || status === 'PAUSED') return 'PAUSED'
  if (status === 4 || status === 'REMOVED') return 'REMOVED'
  return (String(status || 'ENABLED') as any)
}

function mapAdGroupType(type: any): string {
  if (type === 2 || type === 'SEARCH_STANDARD') return 'SEARCH_STANDARD'
  if (type === 3 || type === 'DISPLAY_STANDARD') return 'DISPLAY_STANDARD'
  return String(type || 'SEARCH_STANDARD')
}

function mapKeywordMatchType(type: any): 'BROAD' | 'PHRASE' | 'EXACT' {
  if (type === 2 || type === 'EXACT') return 'EXACT'
  if (type === 3 || type === 'PHRASE') return 'PHRASE'
  if (type === 4 || type === 'BROAD') return 'BROAD'
  return (String(type || 'EXACT') as any)
}

function mapDeviceEnum(dev: any): 'MOBILE' | 'DESKTOP' | 'TABLET' {
  if (dev === 2 || dev === 'MOBILE') return 'MOBILE'
  if (dev === 3 || dev === 'DESKTOP') return 'DESKTOP'
  if (dev === 4 || dev === 'TABLET') return 'TABLET'
  return (String(dev || 'DESKTOP') as any)
}

const GEO_TARGETS_MAP: Record<string, { city: string; state: string }> = {
  '1007740': { city: 'Pune', state: 'Maharashtra' },
  '9061642': { city: 'Hyderabad', state: 'Telangana' },
  '20462': { city: 'State', state: 'Maharashtra' },
  '20460': { city: 'State', state: 'Karnataka' },
  '1007809': { city: 'Bangalore', state: 'Karnataka' },
  '9061658': { city: 'Mumbai', state: 'Maharashtra' },
  '9061633': { city: 'Chennai', state: 'Tamil Nadu' },
  '9062060': { city: 'Noida', state: 'Uttar Pradesh' },
  '9062043': { city: 'Delhi', state: 'Delhi' },
  '9061723': { city: 'Kolkata', state: 'West Bengal' }
}

function parseGeoTarget(geoConstantStr: string): { city: string; state: string } {
  if (!geoConstantStr) return { city: 'Unknown', state: 'Location' }
  const match = geoConstantStr.match(/geoTargetConstants\/(\d+)/)
  if (match) {
    const id = match[1]
    if (GEO_TARGETS_MAP[id]) {
      return GEO_TARGETS_MAP[id]
    }
    return { city: `City (${id})`, state: 'India' }
  }
  return { city: geoConstantStr, state: 'Location' }
}

// Convert Google Ads micros (1/1,000,000th of currency)
function microsToCurrency(micros: number | string): number {
  return Number(micros || 0) / 1000000
}

// Lazy load the API package so it doesn't throw if imports fail in build phase
async function getGoogleAdsClient(
  customDevToken?: string,
  customClientId?: string,
  customClientSecret?: string,
  customRefreshToken?: string,
  customCustomerId?: string,
  customManagerId?: string
) {
  const devToken = customDevToken || process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  const clientId = customClientId || process.env.GOOGLE_ADS_CLIENT_ID
  const clientSecret = customClientSecret || process.env.GOOGLE_ADS_CLIENT_SECRET
  const refreshToken = customRefreshToken || process.env.GOOGLE_ADS_REFRESH_TOKEN
  const customerId = customCustomerId || process.env.GOOGLE_ADS_CUSTOMER_ID
  const managerId = customManagerId || process.env.GOOGLE_ADS_MANAGER_ID

  // Dynamically import client
  const { GoogleAdsApi } = await import('google-ads-api')
  
  const client = new GoogleAdsApi({
    client_id: clientId!,
    client_secret: clientSecret!,
    developer_token: devToken!,
  })

  const customer = client.Customer({
    customer_id: customerId!.replace(/-/g, ''),
    refresh_token: refreshToken!,
    login_customer_id: managerId ? managerId.replace(/-/g, '') : undefined,
  })

  return customer
}

// ── API FUNCTIONS ─────────────────────────────────────────

export async function fetchGoogleAccountOverview(
  dateRange: DateRange,
  customDevToken?: string,
  customClientId?: string,
  customClientSecret?: string,
  customRefreshToken?: string,
  customCustomerId?: string,
  customManagerId?: string
): Promise<GoogleAccountOverview> {
  if (!hasGoogleCredentials(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId)) {
    return getMockGoogleOverview(dateRange.from, dateRange.to)
  }

  try {
    const customer = await getGoogleAdsClient(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId, customManagerId)
    
    const query = `
      SELECT
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.cost_per_conversion,
        metrics.conversions_from_interactions_rate,
        metrics.search_impression_share
      FROM customer
      WHERE segments.date BETWEEN '${dateRange.from}' AND '${dateRange.to}'
    `
    const rows = await customer.query(query)
    const summary = rows?.[0] || {}

    const spend = microsToCurrency(summary.metrics?.cost_micros || 0)
    const conversions = Number(summary.metrics?.conversions || 0)
    const clicks = Number(summary.metrics?.clicks || 0)

    // Retrieve daily budgets from campaigns
    const campaignsQuery = `
      SELECT campaign_budget.amount_micros
      FROM campaign
      WHERE campaign.status = 'ENABLED'
    `
    const campRows = await customer.query(campaignsQuery)
    const totalDailyBudget = campRows.reduce((sum, r) => sum + microsToCurrency(r.campaign_budget?.amount_micros || 0), 0)

    return {
      customerId: customCustomerId || process.env.GOOGLE_ADS_CUSTOMER_ID || '',
      accountName: 'Google Ads Account',
      spend,
      impressions: Number(summary.metrics?.impressions || 0),
      clicks,
      ctr: Number(summary.metrics?.ctr || 0) * 100, // Google CTR is ratio (0-1)
      avgCpc: microsToCurrency(summary.metrics?.average_cpc || 0),
      conversions,
      costPerConversion: summary.metrics?.cost_per_conversion ? microsToCurrency(summary.metrics.cost_per_conversion) : 0,
      conversionRate: Number(summary.metrics?.conversions_from_interactions_rate || 0) * 100,
      searchImpressionShare: summary.metrics?.search_impression_share ? Number(summary.metrics.search_impression_share) * 100 : 0,
      formSubmissions: Math.round(conversions * 0.7),
      phoneCalls: Math.round(conversions * 0.2),
      websiteConversions: Math.round(conversions * 0.1),
      costPerFormSubmission: conversions > 0 ? spend / Math.round(conversions * 0.7) : 0,
      costPerCall: conversions > 0 ? spend / Math.round(conversions * 0.2) : 0,
      totalDailyBudget,
      totalSpentToday: Math.round(spend * 0.05), // Mock today placeholder
      budgetAlerts: []
    }
  } catch (err) {
    console.error('Failed to fetch Google Account Overview, using fallback:', err)
    return getMockGoogleOverview(dateRange.from, dateRange.to)
  }
}

export async function fetchGoogleCampaigns(
  dateRange: DateRange,
  customDevToken?: string,
  customClientId?: string,
  customClientSecret?: string,
  customRefreshToken?: string,
  customCustomerId?: string,
  customManagerId?: string
): Promise<GoogleCampaign[]> {
  if (!hasGoogleCredentials(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId)) {
    return getMockGoogleCampaigns(dateRange.from, dateRange.to)
  }

  try {
    const customer = await getGoogleAdsClient(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId, customManagerId)
    
    // 1. Fetch structural campaign details (ignores date filter so campaigns with zero traffic are returned)
    const structQuery = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign.bidding_strategy_type,
        campaign.target_cpa.target_cpa_micros,
        campaign.target_roas.target_roas,
        campaign_budget.amount_micros
      FROM campaign
      WHERE campaign.status IN ('ENABLED', 'PAUSED')
    `
    const structRows = await customer.query(structQuery)

    // 2. Fetch traffic metrics for the specified date range
    const metricsQuery = `
      SELECT
        campaign.id,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.cost_per_conversion,
        metrics.conversions_from_interactions_rate,
        metrics.search_impression_share
      FROM campaign
      WHERE campaign.status IN ('ENABLED', 'PAUSED')
        AND segments.date BETWEEN '${dateRange.from}' AND '${dateRange.to}'
    `
    
    let metricsMap: Record<string, any> = {}
    try {
      const metricsRows = await customer.query(metricsQuery)
      metricsRows.forEach((row: any) => {
        if (row.campaign?.id) {
          metricsMap[String(row.campaign.id)] = row.metrics || {}
        }
      })
    } catch (mErr) {
      console.warn('Failed to fetch Google Ads metrics for campaigns, defaulting to 0:', mErr)
    }

    return structRows.map((r: any) => {
      const campaignId = String(r.campaign?.id || '')
      const m = metricsMap[campaignId] || {}
      const spend = microsToCurrency(m.cost_micros || 0)
      const dailyBudget = microsToCurrency(r.campaign_budget?.amount_micros || 0)
      const spentToday = Math.round(spend * 0.05) // Mock consumption rate

      return {
        id: campaignId,
        name: r.campaign?.name || 'Campaign',
        status: mapCampaignStatus(r.campaign?.status),
        type: mapAdvertisingChannelType(r.campaign?.advertising_channel_type),
        dailyBudget,
        spentToday,
        budgetRemaining: dailyBudget > 0 ? Math.max(0, dailyBudget - spentToday) : 0,
        budgetPercentUsed: dailyBudget > 0 ? (spentToday / dailyBudget) * 100 : 0,
        biddingStrategy: r.campaign?.bidding_strategy_type || 'MAXIMIZE_CONVERSIONS',
        targetCpa: r.campaign?.target_cpa?.target_cpa_micros ? microsToCurrency(r.campaign.target_cpa.target_cpa_micros) : null,
        targetRoas: r.campaign?.target_roas?.target_roas || null,
        spend,
        impressions: Number(m.impressions || 0),
        clicks: Number(m.clicks || 0),
        ctr: Number(m.ctr || 0) * 100,
        avgCpc: microsToCurrency(m.average_cpc || 0),
        conversions: Number(m.conversions || 0),
        costPerConversion: m.cost_per_conversion ? microsToCurrency(m.cost_per_conversion) : 0,
        conversionRate: Number(m.conversions_from_interactions_rate || 0) * 100,
        searchImpressionShare: m.search_impression_share ? Number(m.search_impression_share) * 100 : 0
      }
    })
  } catch (err) {
    console.error('Failed to fetch Google Campaigns, using fallback:', err)
    return getMockGoogleCampaigns(dateRange.from, dateRange.to)
  }
}

export async function fetchGoogleAdGroups(
  campaignId: string,
  dateRange: DateRange,
  customDevToken?: string,
  customClientId?: string,
  customClientSecret?: string,
  customRefreshToken?: string,
  customCustomerId?: string,
  customManagerId?: string
): Promise<GoogleAdGroup[]> {
  if (!hasGoogleCredentials(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId)) {
    return getMockGoogleAdGroups(campaignId, dateRange.from, dateRange.to)
  }

  try {
    const customer = await getGoogleAdsClient(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId, customManagerId)
    
    const query = `
      SELECT
        ad_group.id,
        ad_group.name,
        ad_group.status,
        ad_group.type,
        ad_group.cpc_bid_micros,
        campaign.id,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.cost_per_conversion,
        metrics.conversions_from_interactions_rate
      FROM ad_group
      WHERE campaign.id = ${campaignId}
        AND ad_group.status IN ('ENABLED', 'PAUSED')
        AND segments.date BETWEEN '${dateRange.from}' AND '${dateRange.to}'
    `
    const rows = await customer.query(query)

    return rows.map((r: any) => {
      const spend = microsToCurrency(r.metrics?.cost_micros || 0)
      return {
        id: String(r.ad_group?.id || ''),
        campaignId: String(r.campaign?.id || ''),
        name: r.ad_group?.name || 'Ad Group',
        status: mapAdGroupStatus(r.ad_group?.status),
        type: mapAdGroupType(r.ad_group?.type),
        cpcBidMicros: microsToCurrency(r.ad_group?.cpc_bid_micros || 0),
        spend,
        impressions: Number(r.metrics?.impressions || 0),
        clicks: Number(r.metrics?.clicks || 0),
        ctr: Number(r.metrics?.ctr || 0) * 100,
        avgCpc: microsToCurrency(r.metrics?.average_cpc || 0),
        conversions: Number(r.metrics?.conversions || 0),
        costPerConversion: r.metrics?.cost_per_conversion ? microsToCurrency(r.metrics.cost_per_conversion) : 0,
        conversionRate: Number(r.metrics?.conversions_from_interactions_rate || 0) * 100
      }
    })
  } catch (err) {
    console.error('Failed to fetch Google Ad Groups, using fallback:', err)
    return getMockGoogleAdGroups(campaignId, dateRange.from, dateRange.to)
  }
}

export async function fetchGoogleKeywords(
  dateRange: DateRange,
  customDevToken?: string,
  customClientId?: string,
  customClientSecret?: string,
  customRefreshToken?: string,
  customCustomerId?: string,
  customManagerId?: string
): Promise<GoogleKeyword[]> {
  if (!hasGoogleCredentials(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId)) {
    return getMockGoogleKeywords(dateRange.from, dateRange.to)
  }

  try {
    const customer = await getGoogleAdsClient(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId, customManagerId)
    
    const query = `
      SELECT
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.status,
        ad_group_criterion.quality_info.quality_score,
        ad_group_criterion.quality_info.search_predicted_ctr,
        ad_group_criterion.quality_info.creative_quality_score,
        ad_group_criterion.quality_info.post_click_quality_score,
        ad_group.id,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.cost_per_conversion,
        metrics.conversions_from_interactions_rate
      FROM keyword_view
      WHERE ad_group_criterion.status IN ('ENABLED', 'PAUSED')
        AND segments.date BETWEEN '${dateRange.from}' AND '${dateRange.to}'
      ORDER BY metrics.conversions DESC
      LIMIT 100
    `
    const rows = await customer.query(query)

    return rows.map((r: any) => {
      const spend = microsToCurrency(r.metrics?.cost_micros || 0)
      return {
        id: String(r.ad_group_criterion?.criterion_id || ''),
        adGroupId: String(r.ad_group?.id || ''),
        text: r.ad_group_criterion?.keyword?.text || 'keyword',
        matchType: mapKeywordMatchType(r.ad_group_criterion?.keyword?.match_type),
        status: mapAdGroupStatus(r.ad_group_criterion?.status),
        qualityScore: r.ad_group_criterion?.quality_info?.quality_score || null,
        expectedCtr: r.ad_group_criterion?.quality_info?.search_predicted_ctr || null,
        adRelevance: r.ad_group_criterion?.quality_info?.creative_quality_score || null,
        landingPageExp: r.ad_group_criterion?.quality_info?.post_click_quality_score || null,
        cpcBidMicros: 0,
        spend,
        impressions: Number(r.metrics?.impressions || 0),
        clicks: Number(r.metrics?.clicks || 0),
        ctr: Number(r.metrics?.ctr || 0) * 100,
        avgCpc: microsToCurrency(r.metrics?.average_cpc || 0),
        conversions: Number(r.metrics?.conversions || 0),
        costPerConversion: r.metrics?.cost_per_conversion ? microsToCurrency(r.metrics.cost_per_conversion) : 0,
        conversionRate: Number(r.metrics?.conversions_from_interactions_rate || 0) * 100
      }
    })
  } catch (err) {
    console.error('Failed to fetch Google Keywords, using fallback:', err)
    return getMockGoogleKeywords(dateRange.from, dateRange.to)
  }
}

export async function fetchGoogleSearchTerms(
  dateRange: DateRange,
  customDevToken?: string,
  customClientId?: string,
  customClientSecret?: string,
  customRefreshToken?: string,
  customCustomerId?: string,
  customManagerId?: string
): Promise<GoogleSearchTerm[]> {
  if (!hasGoogleCredentials(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId)) {
    return getMockGoogleSearchTerms(dateRange.from, dateRange.to)
  }

  try {
    const customer = await getGoogleAdsClient(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId, customManagerId)
    
    const query = `
      SELECT
        search_term_view.search_term,
        search_term_view.status,
        campaign.name,
        ad_group.name,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.cost_micros,
        metrics.conversions,
        metrics.cost_per_conversion
      FROM search_term_view
      WHERE segments.date BETWEEN '${dateRange.from}' AND '${dateRange.to}'
      ORDER BY metrics.conversions DESC
      LIMIT 100
    `
    const rows = await customer.query(query)

    return rows.map((r: any) => {
      return {
        searchTerm: r.search_term_view?.search_term || '',
        matchType: r.search_term_view?.status || 'ORGANIC',
        campaignName: r.campaign?.name || '',
        adGroupName: r.ad_group?.name || '',
        impressions: Number(r.metrics?.impressions || 0),
        clicks: Number(r.metrics?.clicks || 0),
        ctr: Number(r.metrics?.ctr || 0) * 100,
        avgCpc: microsToCurrency(r.metrics?.average_cpc || 0),
        spend: microsToCurrency(r.metrics?.cost_micros || 0),
        conversions: Number(r.metrics?.conversions || 0),
        costPerConversion: r.metrics?.cost_per_conversion ? microsToCurrency(r.metrics.cost_per_conversion) : 0
      }
    })
  } catch (err) {
    console.error('Failed to fetch Google Search Terms, using fallback:', err)
    return getMockGoogleSearchTerms(dateRange.from, dateRange.to)
  }
}

export async function fetchGoogleDeviceBreakdown(
  dateRange: DateRange,
  customDevToken?: string,
  customClientId?: string,
  customClientSecret?: string,
  customRefreshToken?: string,
  customCustomerId?: string,
  customManagerId?: string
): Promise<GoogleDeviceBreakdown> {
  if (!hasGoogleCredentials(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId)) {
    return getMockGoogleDevices(dateRange.from, dateRange.to)
  }

  try {
    const customer = await getGoogleAdsClient(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId, customManagerId)
    
    const query = `
      SELECT
        segments.device,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.conversions,
        metrics.cost_per_conversion
      FROM campaign
      WHERE segments.date BETWEEN '${dateRange.from}' AND '${dateRange.to}'
    `
    const rows = await customer.query(query)

    const devicesMap: Record<string, any> = {
      MOBILE: { spend: 0, impressions: 0, clicks: 0, conversions: 0 },
      DESKTOP: { spend: 0, impressions: 0, clicks: 0, conversions: 0 },
      TABLET: { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
    }

    rows.forEach((r: any) => {
      const dev = mapDeviceEnum(r.segments?.device)
      if (dev && devicesMap[dev]) {
        devicesMap[dev].spend += microsToCurrency(r.metrics?.cost_micros || 0)
        devicesMap[dev].impressions += Number(r.metrics?.impressions || 0)
        devicesMap[dev].clicks += Number(r.metrics?.clicks || 0)
        devicesMap[dev].conversions += Number(r.metrics?.conversions || 0)
      }
    })

    const devices = Object.keys(devicesMap).map(device => {
      const d = devicesMap[device]
      return {
        device: device as any,
        spend: d.spend,
        impressions: d.impressions,
        clicks: d.clicks,
        ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
        conversions: d.conversions,
        costPerConversion: d.conversions > 0 ? d.spend / d.conversions : 0
      }
    })

    return { devices }
  } catch (err) {
    console.error('Failed to fetch Google Device Breakdown, using fallback:', err)
    return getMockGoogleDevices(dateRange.from, dateRange.to)
  }
}

export async function fetchGooglePlacements(
  dateRange: DateRange,
  customDevToken?: string,
  customClientId?: string,
  customClientSecret?: string,
  customRefreshToken?: string,
  customCustomerId?: string,
  customManagerId?: string
): Promise<any[]> {
  if (!hasGoogleCredentials(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId)) {
    return [
      { adNetworkType: 'SEARCH', spend: 90000, impressions: 15000, clicks: 4000, conversions: 182 }
    ]
  }

  try {
    const customer = await getGoogleAdsClient(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId, customManagerId)
    
    const query = `
      SELECT
        segments.ad_network_type,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions
      FROM customer
      WHERE segments.date BETWEEN '${dateRange.from}' AND '${dateRange.to}'
    `
    const rows = await customer.query(query)
    return rows.map((r: any) => {
      const spend = microsToCurrency(r.metrics?.cost_micros || 0)
      return {
        adNetworkType: r.segments?.ad_network_type || 'UNKNOWN',
        spend,
        impressions: Number(r.metrics?.impressions || 0),
        clicks: Number(r.metrics?.clicks || 0),
        conversions: Number(r.metrics?.conversions || 0)
      }
    })
  } catch (err) {
    console.error('Failed to fetch Google Placements, using fallback:', err)
    return [
      { adNetworkType: 'SEARCH', spend: 0, impressions: 0, clicks: 0, conversions: 0 }
    ]
  }
}


export async function fetchGoogleGeoBreakdown(
  dateRange: DateRange,
  customDevToken?: string,
  customClientId?: string,
  customClientSecret?: string,
  customRefreshToken?: string,
  customCustomerId?: string,
  customManagerId?: string
): Promise<GoogleGeoBreakdown> {
  if (!hasGoogleCredentials(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId)) {
    return getMockGoogleGeo(dateRange.from, dateRange.to)
  }

  try {
    const customer = await getGoogleAdsClient(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId, customManagerId)
    
    const query = `
      SELECT
        segments.geo_target_city,
        segments.geo_target_state,
        metrics.cost_micros,
        metrics.clicks,
        metrics.conversions
      FROM geographic_view
      WHERE segments.date BETWEEN '${dateRange.from}' AND '${dateRange.to}'
      ORDER BY metrics.conversions DESC
      LIMIT 50
    `
    const rows = await customer.query(query)

    const locations = rows.map((r: any) => {
      const spend = microsToCurrency(r.metrics?.cost_micros || 0)
      const geo = parseGeoTarget(r.segments?.geo_target_city)
      return {
        city: geo.city,
        state: geo.state,
        spend,
        clicks: Number(r.metrics?.clicks || 0),
        conversions: Number(r.metrics?.conversions || 0)
      }
    })

    return { locations }
  } catch (err) {
    console.error('Failed to fetch Google Geo Breakdown, using fallback:', err)
    return getMockGoogleGeo(dateRange.from, dateRange.to)
  }
}

export async function fetchGoogleDailyTrend(
  dateRange: DateRange,
  customDevToken?: string,
  customClientId?: string,
  customClientSecret?: string,
  customRefreshToken?: string,
  customCustomerId?: string,
  customManagerId?: string
): Promise<GoogleDailyTrend[]> {
  if (!hasGoogleCredentials(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId)) {
    return getMockGoogleDailyTrend(dateRange.from, dateRange.to)
  }

  try {
    const customer = await getGoogleAdsClient(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId, customManagerId)
    
    const query = `
      SELECT
        segments.date,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.cost_per_conversion
      FROM customer
      WHERE segments.date BETWEEN '${dateRange.from}' AND '${dateRange.to}'
      ORDER BY segments.date ASC
    `
    const rows = await customer.query(query)

    const trend = rows.map((r: any) => {
      const spend = microsToCurrency(r.metrics?.cost_micros || 0)
      const conversions = Number(r.metrics?.conversions || 0)

      return {
        date: r.segments?.date || '',
        spend,
        impressions: Number(r.metrics?.impressions || 0),
        clicks: Number(r.metrics?.clicks || 0),
        conversions,
        ctr: Number(r.metrics?.ctr || 0) * 100,
        avgCpc: microsToCurrency(r.metrics?.average_cpc || 0),
        costPerConversion: conversions > 0 ? spend / conversions : 0
      }
    }).sort((a: any, b: any) => a.date.localeCompare(b.date))

    return trend
  } catch (err) {
    console.error('Failed to fetch Google Daily Trend, using fallback:', err)
    return getMockGoogleDailyTrend(dateRange.from, dateRange.to)
  }
}

export async function fetchGoogleAds(
  adGroupId: string,
  dateRange: DateRange,
  customDevToken?: string,
  customClientId?: string,
  customClientSecret?: string,
  customRefreshToken?: string,
  customCustomerId?: string,
  customManagerId?: string
): Promise<GoogleAd[]> {
  if (!hasGoogleCredentials(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId)) {
    return getMockGoogleAds(adGroupId, dateRange.from, dateRange.to)
  }

  try {
    const customer = await getGoogleAdsClient(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId, customManagerId)
    
    const query = `
      SELECT
        ad_group_ad.ad.id,
        ad_group_ad.ad.type,
        ad_group_ad.status,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group_ad.ad.final_urls,
        ad_group.id,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.cost_per_conversion
      FROM ad_group_ad
      WHERE ad_group.id = ${adGroupId}
        AND ad_group_ad.status IN ('ENABLED', 'PAUSED')
        AND segments.date BETWEEN '${dateRange.from}' AND '${dateRange.to}'
    `
    const rows = await customer.query(query)

    return rows.map((r: any) => {
      const spend = microsToCurrency(r.metrics?.cost_micros || 0)
      
      const headlines = (r.ad_group_ad?.ad?.responsive_search_ad?.headlines || [])
        .map((h: any) => h.text)
        .filter(Boolean)
        
      const descriptions = (r.ad_group_ad?.ad?.responsive_search_ad?.descriptions || [])
        .map((d: any) => d.text)
        .filter(Boolean)

      return {
        id: String(r.ad_group_ad?.ad?.id || ''),
        adGroupId: String(r.ad_group?.id || ''),
        type: r.ad_group_ad?.ad?.type || 'RESPONSIVE_SEARCH_AD',
        status: mapAdGroupStatus(r.ad_group_ad?.status),
        headlines,
        descriptions,
        finalUrls: r.ad_group_ad?.ad?.final_urls || [],
        spend,
        impressions: Number(r.metrics?.impressions || 0),
        clicks: Number(r.metrics?.clicks || 0),
        ctr: Number(r.metrics?.ctr || 0) * 100,
        avgCpc: microsToCurrency(r.metrics?.average_cpc || 0),
        conversions: Number(r.metrics?.conversions || 0),
        costPerConversion: r.metrics?.cost_per_conversion ? microsToCurrency(r.metrics.cost_per_conversion) : 0
      }
    })
  } catch (err) {
    console.error('Failed to fetch Google Ads, using fallback:', err)
    return getMockGoogleAds(adGroupId, dateRange.from, dateRange.to)
  }
}

// ── GOOGLE TARGETING EXPLORER FETCHERS & MOCKS ──────────────────

export interface GoogleAdGroupTargeting {
  keywords: string[]
  ageRanges: string[]
  genders: string[]
  placements: string[]
}

function formatAgeRange(type: string | number): string {
  if (type === undefined || type === null) return ''
  if (typeof type === 'number') {
    const numMap: Record<number, string> = {
      2: '18-24',
      3: '25-34',
      4: '35-44',
      5: '45-54',
      6: '55-64',
      7: '65+',
      8: 'Unknown Age'
    }
    return numMap[type] || ''
  }
  const clean = type.replace('AGE_RANGE_', '')
  if (clean === '65_UP') return '65+'
  if (clean === 'UNDETERMINED') return 'Unknown Age'
  return clean.replace('_', '-')
}

function formatGender(type: string | number): string {
  if (type === undefined || type === null) return ''
  if (typeof type === 'number') {
    const numMap: Record<number, string> = {
      2: 'Male',
      3: 'Female',
      4: 'Unknown Gender'
    }
    return numMap[type] || ''
  }
  if (type === 'MALE') return 'Male'
  if (type === 'FEMALE') return 'Female'
  if (type === 'UNDETERMINED') return 'Unknown Gender'
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
}

function getMockGoogleTargetingExplorer() {
  return [
    {
      id: 'gg_camp_1',
      name: 'HCM Search Campaign',
      status: 'ENABLED',
      type: 'SEARCH',
      biddingStrategy: 'TARGET_CPA',
      budget: 3000,
      adGroups: [
        {
          id: 'gg_adgroup_1a',
          name: 'Oracle HCM Training - Exact Match',
          status: 'ENABLED',
          targetingSummary: 'Keywords: oracle hcm cloud training, oracle hcm online certification',
          targeting: {
            keywords: ['oracle hcm cloud training', 'oracle hcm online certification', 'oracle fusion hcm course online', 'oracle cloud hcm certification cost', 'oracle hcm learning subscription'],
            ageRanges: ['22-34', '35-44', '45-54'],
            genders: ['Male', 'Female'],
            placements: []
          },
          ads: [
            {
              id: 'gg_ad_1',
              name: 'Responsive Search Ad 1',
              status: 'ENABLED',
              headlines: ['Oracle HCM Cloud Training', 'Oracle Fusion HCM Course', 'Job Placement Support'],
              descriptions: ['Get certified in Oracle Fusion HCM. Live interactive online training by ERP experts.', 'Enroll today for flat 20% discount.']
            }
          ]
        },
        {
          id: 'gg_adgroup_1b',
          name: 'Oracle HCM Online Course - Phrase Match',
          status: 'ENABLED',
          targetingSummary: 'Keywords: learn oracle fusion hcm',
          targeting: {
            keywords: ['learn oracle fusion hcm', 'oracle fusion hcm technical training', 'oracle hcm technical online classes', 'oracle hcm cloud tutorial for beginners'],
            ageRanges: ['25-34', '35-44'],
            genders: ['Male', 'Female'],
            placements: []
          },
          ads: [
            {
              id: 'gg_ad_2',
              name: 'Responsive Search Ad 2',
              status: 'ENABLED',
              headlines: ['ERP Technical Online Classes', 'BIP Reports and OTBI Guide', 'Learn HDL & HCM Extracts'],
              descriptions: ['Master Oracle Technical Cloud. Join top SCM/HCM technical functional modules course.']
            }
          ]
        }
      ]
    },
    {
      id: 'gg_camp_2',
      name: 'SCM Performance Max',
      status: 'ENABLED',
      type: 'PERFORMANCE_MAX',
      biddingStrategy: 'MAXIMIZE_CONVERSIONS',
      budget: 2000,
      adGroups: [
        {
          id: 'gg_adgroup_2a',
          name: 'SCM Performance Asset Group',
          status: 'ENABLED',
          targetingSummary: 'Audience Signal: Supply Chain Intent, Custom Segments',
          targeting: {
            keywords: ['supply chain management', 'scm certification online', 'logistics management training', 'oracle scm cloud tutorial'],
            ageRanges: ['25-34', '35-44', '45-54'],
            genders: ['Male', 'Female'],
            placements: ['YouTube Video Placements', 'Gmail Ads', 'Google Display Network']
          },
          ads: [
            {
              id: 'gg_ad_3',
              name: 'PMax Asset Group Ad',
              status: 'ENABLED',
              headlines: ['Oracle SCM Training Course', 'Master Fusion Supply Chain'],
              descriptions: ['Hands-on Oracle SCM certification classes. Industry expert trainers.']
            }
          ]
        }
      ]
    }
  ]
}

export interface GoogleTargetingExplorerCampaign {
  id: string
  name: string
  status: string
  type: string
  biddingStrategy: string
  budget: number
  adGroups: {
    id: string
    name: string
    status: string
    targetingSummary: string
    targeting: GoogleAdGroupTargeting
    ads: {
      id: string
      name: string
      status: string
      headlines: string[]
      descriptions: string[]
    }[]
  }[]
}

export async function fetchGoogleTargetingExplorer(
  customDevToken?: string,
  customClientId?: string,
  customClientSecret?: string,
  customRefreshToken?: string,
  customCustomerId?: string,
  customManagerId?: string
): Promise<GoogleTargetingExplorerCampaign[]> {
  if (!hasGoogleCredentials(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId)) {
    return getMockGoogleTargetingExplorer()
  }

  try {
    const customer = await getGoogleAdsClient(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId, customManagerId)
    
    // 1. Fetch campaigns
    const campaignsQuery = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign.bidding_strategy_type,
        campaign_budget.amount_micros
      FROM campaign
      WHERE campaign.status IN ('ENABLED', 'PAUSED')
    `
    const campRows = await customer.query(campaignsQuery)

    // 2. Fetch all ad groups
    const adGroupsQuery = `
      SELECT
        ad_group.id,
        ad_group.name,
        ad_group.status,
        ad_group.type,
        campaign.id
      FROM ad_group
      WHERE campaign.status IN ('ENABLED', 'PAUSED') AND ad_group.status IN ('ENABLED', 'PAUSED')
    `
    const adGroupRows = await customer.query(adGroupsQuery)

    // 3. Fetch all targeting criteria (keywords, ages, genders, placements)
    const criteriaQuery = `
      SELECT
        ad_group_criterion.type,
        ad_group_criterion.keyword.text,
        ad_group_criterion.age_range.type,
        ad_group_criterion.gender.type,
        ad_group_criterion.placement.url,
        ad_group_criterion.status,
        ad_group.id
      FROM ad_group_criterion
      WHERE ad_group_criterion.type IN ('KEYWORD', 'AGE_RANGE', 'GENDER', 'PLACEMENT')
        AND ad_group_criterion.status = 'ENABLED'
    `
    
    const targetingMap: Record<string, GoogleAdGroupTargeting> = {}
    try {
      const critRows = await customer.query(criteriaQuery)
      critRows.forEach((row: any) => {
        const adGroupId = String(row.ad_group?.id || '')
        if (adGroupId) {
          if (!targetingMap[adGroupId]) {
            targetingMap[adGroupId] = {
              keywords: [],
              ageRanges: [],
              genders: [],
              placements: []
            }
          }
          const critType = row.ad_group_criterion?.type
          
          if (critType === 'KEYWORD' || row.ad_group_criterion?.keyword?.text) {
            const text = row.ad_group_criterion?.keyword?.text
            if (text) targetingMap[adGroupId].keywords.push(text)
          } else if (critType === 'AGE_RANGE' || row.ad_group_criterion?.age_range?.type) {
            const rawAge = row.ad_group_criterion?.age_range?.type
            if (rawAge) {
              const formatted = formatAgeRange(rawAge)
              if (formatted) targetingMap[adGroupId].ageRanges.push(formatted)
            }
          } else if (critType === 'GENDER' || row.ad_group_criterion?.gender?.type) {
            const rawGender = row.ad_group_criterion?.gender?.type
            if (rawGender) {
              const formatted = formatGender(rawGender)
              if (formatted) targetingMap[adGroupId].genders.push(formatted)
            }
          } else if (critType === 'PLACEMENT' || row.ad_group_criterion?.placement?.url) {
            const url = row.ad_group_criterion?.placement?.url
            if (url) targetingMap[adGroupId].placements.push(url)
          }
        }
      })
    } catch (e) {
      console.warn('Failed to query Google Ads targeting criteria:', e)
    }

    // 4. Fetch all ads
    const adsQuery = `
      SELECT
        ad_group_ad.ad.id,
        ad_group_ad.ad.type,
        ad_group_ad.status,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group.id
      FROM ad_group_ad
      WHERE campaign.status IN ('ENABLED', 'PAUSED') AND ad_group_ad.status IN ('ENABLED', 'PAUSED')
    `
    const adRows = await customer.query(adsQuery)

    // Group ads by ad group ID
    const adsByAdGroup: Record<string, any[]> = {}
    adRows.forEach((r: any) => {
      const adGroupId = String(r.ad_group?.id || '')
      if (adGroupId) {
        if (!adsByAdGroup[adGroupId]) adsByAdGroup[adGroupId] = []
        
        const headlines = (r.ad_group_ad?.ad?.responsive_search_ad?.headlines || [])
          .map((h: any) => h.text)
          .filter(Boolean)
          
        const descriptions = (r.ad_group_ad?.ad?.responsive_search_ad?.descriptions || [])
          .map((d: any) => d.text)
          .filter(Boolean)

        adsByAdGroup[adGroupId].push({
          id: String(r.ad_group_ad?.ad?.id || ''),
          name: headlines[0] || r.ad_group_ad?.ad?.type || 'Search Ad',
          status: mapAdGroupStatus(r.ad_group_ad?.status),
          headlines,
          descriptions
        })
      }
    })

    // Group ad groups by campaign ID
    const adGroupsByCampaign: Record<string, any[]> = {}
    adGroupRows.forEach((r: any) => {
      const campaignId = String(r.campaign?.id || '')
      if (campaignId) {
        if (!adGroupsByCampaign[campaignId]) adGroupsByCampaign[campaignId] = []
        
        const adGroupId = String(r.ad_group?.id || '')
        const targeting = targetingMap[adGroupId] || {
          keywords: [],
          ageRanges: [],
          genders: [],
          placements: []
        }
        
        const kws = targeting.keywords
        const targetingSummary = kws.length > 0
          ? `Keywords: ${kws.slice(0, 5).join(', ')}${kws.length > 5 ? '...' : ''}`
          : r.ad_group?.type === 'SEARCH_STANDARD' ? 'Keywords targeting' : 'Audience Expansion targeting'

        adGroupsByCampaign[campaignId].push({
          id: adGroupId,
          name: r.ad_group?.name || 'Ad Group',
          status: mapAdGroupStatus(r.ad_group?.status),
          targetingSummary,
          targeting,
          ads: adsByAdGroup[adGroupId] || []
        })
      }
    })

    // Construct final tree
    const result: GoogleTargetingExplorerCampaign[] = campRows.map((r: any) => {
      const campaignId = String(r.campaign?.id || '')
      const budget = microsToCurrency(r.campaign_budget?.amount_micros || 0)
      
      return {
        id: campaignId,
        name: r.campaign?.name || 'Campaign',
        status: mapCampaignStatus(r.campaign?.status),
        type: mapAdvertisingChannelType(r.campaign?.advertising_channel_type),
        biddingStrategy: r.campaign?.bidding_strategy_type || 'MAXIMIZE_CONVERSIONS',
        budget,
        adGroups: adGroupsByCampaign[campaignId] || []
      }
    })

    return result
  } catch (err) {
    console.error('Failed to fetch Google Targeting Explorer, using fallback:', err)
    return getMockGoogleTargetingExplorer()
  }
}

export async function fetchGoogleAdsWithInsights(
  dateRange: DateRange,
  customDevToken?: string,
  customClientId?: string,
  customClientSecret?: string,
  customRefreshToken?: string,
  customCustomerId?: string,
  customManagerId?: string
): Promise<any[]> {
  if (!hasGoogleCredentials(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId)) {
    // Return mock ads with mock insights
    return [
      {
        id: 'gg_ad_1',
        name: 'Responsive Search Ad 1',
        status: 'ENABLED',
        headlines: ['Oracle HCM Cloud Training', 'Oracle Fusion HCM Course', 'Job Placement Support'],
        descriptions: ['Get certified in Oracle Fusion HCM. Live interactive online training by ERP experts.', 'Enroll today for flat 20% discount.'],
        campaignName: 'HCM Search Campaign',
        adGroupName: 'Oracle HCM Training - Exact Match',
        spend: 38000,
        impressions: 22000,
        clicks: 1800,
        ctr: 8.18,
        cpc: 21.11,
        conversions: 160
      },
      {
        id: 'gg_ad_2',
        name: 'Responsive Search Ad 2',
        status: 'ENABLED',
        headlines: ['ERP Technical Online Classes', 'BIP Reports and OTBI Guide', 'Learn HDL & HCM Extracts'],
        descriptions: ['Master Oracle Technical Cloud. Join top SCM/HCM technical functional modules course.'],
        campaignName: 'HCM Search Campaign',
        adGroupName: 'Oracle HCM Online Course - Phrase Match',
        spend: 21000,
        impressions: 14000,
        clicks: 920,
        ctr: 6.57,
        cpc: 22.82,
        conversions: 75
      },
      {
        id: 'gg_ad_3',
        name: 'PMax Asset Group Ad',
        status: 'ENABLED',
        headlines: ['Oracle SCM Training Course', 'Master Fusion Supply Chain'],
        descriptions: ['Hands-on Oracle SCM certification classes. Industry expert trainers.'],
        campaignName: 'SCM Performance Max',
        adGroupName: 'SCM Performance Asset Group',
        spend: 49000,
        impressions: 85000,
        clicks: 4300,
        ctr: 5.05,
        cpc: 11.39,
        conversions: 280
      }
    ]
  }

  try {
    const customer = await getGoogleAdsClient(customDevToken, customClientId, customClientSecret, customRefreshToken, customCustomerId, customManagerId)
    
    const query = `
      SELECT
        ad_group_ad.ad.id,
        ad_group_ad.ad.type,
        ad_group_ad.status,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        campaign.name,
        ad_group.name,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions
      FROM ad_group_ad
      WHERE campaign.status IN ('ENABLED', 'PAUSED') AND ad_group_ad.status IN ('ENABLED', 'PAUSED')
        AND segments.date BETWEEN '${dateRange.from}' AND '${dateRange.to}'
      LIMIT 100
    `
    const rows = await customer.query(query)

    return rows.map((r: any) => {
      const spend = microsToCurrency(r.metrics?.cost_micros || 0)
      const headlines = (r.ad_group_ad?.ad?.responsive_search_ad?.headlines || [])
        .map((h: any) => h.text)
        .filter(Boolean)
      const descriptions = (r.ad_group_ad?.ad?.responsive_search_ad?.descriptions || [])
        .map((d: any) => d.text)
        .filter(Boolean)

      return {
        id: String(r.ad_group_ad?.ad?.id || ''),
        name: headlines[0] || r.ad_group_ad?.ad?.type || 'Search Ad',
        status: r.ad_group_ad?.status || 'ENABLED',
        headlines,
        descriptions,
        campaignName: r.campaign?.name || 'Campaign',
        adGroupName: r.ad_group?.name || 'Ad Group',
        spend,
        impressions: Number(r.metrics?.impressions || 0),
        clicks: Number(r.metrics?.clicks || 0),
        ctr: Number(r.metrics?.ctr || 0) * 100,
        cpc: microsToCurrency(r.metrics?.average_cpc || 0),
        conversions: Number(r.metrics?.conversions || 0)
      }
    })
  } catch (err) {
    console.error('Failed to fetch Google Ads with insights, using fallback:', err)
    return []
  }
}
