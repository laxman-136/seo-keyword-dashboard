// lib/mockAdsData.ts
import { 
  MetaAccountOverview, MetaCampaign, MetaAdSet, MetaAd, MetaPlacementBreakdown, MetaDemographicBreakdown, MetaDailyTrend,
  GoogleAccountOverview, GoogleCampaign, GoogleAdGroup, GoogleKeyword, GoogleSearchTerm, GoogleAd, GoogleDeviceBreakdown, GoogleGeoBreakdown, GoogleDailyTrend,
  AdsCombinedOverview, AdsBudgetAlert
} from './types'
import { getISTDateString } from './dateRange'

/**
 * Calculates number of days between two dates
 */
export function getDaysCount(from: string, to: string): number {
  const start = new Date(from).getTime()
  const end = new Date(to).getTime()
  if (isNaN(start) || isNaN(end)) return 7
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1)
}

/**
 * Helper to generate list of dates between from and to (inclusive)
 */
export function getDatesInRange(from: string, to: string): string[] {
  const dates: string[] = []
  const start = new Date(from)
  const end = new Date(to)
  const current = new Date(start)

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
    if (dates.length > 366) break // Safety cap
  }

  return dates
}

// ── BUDGET ALERTS SIMULATOR ───────────────────────────────

export function getMockBudgetAlerts(): AdsBudgetAlert[] {
  return [
    {
      platform: 'meta',
      campaignName: 'Meta · SCM Lead Gen Campaign',
      campaignId: 'meta_camp_1',
      dailyBudget: 2000,
      spentToday: 1850,
      remaining: 150,
      percentUsed: 92.5,
      alertLevel: 'critical'
    },
    {
      platform: 'google',
      campaignName: 'Google · HCM Search Campaign',
      campaignId: 'gg_camp_1',
      dailyBudget: 3000,
      spentToday: 2180,
      remaining: 820,
      percentUsed: 72.7,
      alertLevel: 'warning'
    }
  ]
}

// ── META ADS MOCK DATA ────────────────────────────────────

export function getMockMetaOverview(from: string, to: string): MetaAccountOverview {
  const days = getDaysCount(from, to)
  const spend = 1800 * days
  const reach = 8000 * days
  const impressions = 12000 * days
  const clicks = Math.round(impressions * 0.018) // 1.8% CTR
  const leadFormFills = Math.round(clicks * 0.12) // 12% conversion rate
  const websiteLeads = Math.round(clicks * 0.08)
  const websiteRegistrations = Math.round(clicks * 0.05)
  const landingPageViews = Math.round(clicks * 0.85)
  const totalConversions = leadFormFills + websiteLeads + websiteRegistrations

  return {
    accountId: 'act_10827364125',
    accountName: 'TechLeadsIT Meta Account',
    spend,
    impressions,
    clicks,
    ctr: 1.8,
    cpm: (spend / impressions) * 1000,
    cpc: spend / clicks,
    reach,
    frequency: impressions / reach,
    leadFormFills,
    websiteLeads,
    websiteRegistrations,
    landingPageViews,
    costPerLeadForm: spend / leadFormFills,
    costPerWebsiteLead: spend / websiteLeads,
    totalConversions,
    costPerConversion: spend / totalConversions,
    roas: 2.8,
    totalDailyBudget: 5000,
    totalSpentToday: 3880,
    budgetAlerts: getMockBudgetAlerts().filter(a => a.platform === 'meta')
  }
}

export function getMockMetaCampaigns(from: string, to: string): MetaCampaign[] {
  const days = getDaysCount(from, to)
  
  return [
    {
      id: 'meta_camp_1',
      name: 'SCM Lead Gen Campaign',
      status: 'ACTIVE',
      objective: 'LEADS',
      dailyBudget: 2000,
      lifetimeBudget: 0,
      spentToday: 1850,
      budgetRemaining: 150,
      budgetPercentUsed: 92.5,
      spend: 700 * days,
      impressions: 5000 * days,
      clicks: 110 * days,
      ctr: 2.2,
      cpm: 140,
      cpc: 6.36,
      reach: 3800 * days,
      frequency: 1.3,
      leadFormFills: 14 * days,
      websiteLeads: 8 * days,
      totalConversions: 22 * days,
      costPerConversion: (700 * days) / (22 * days),
      roas: 3.1,
      startTime: '2026-04-10T00:00:00Z',
      stopTime: null
    },
    {
      id: 'meta_camp_2',
      name: 'Financials Brand Awareness',
      status: 'ACTIVE',
      objective: 'OUTCOME_AWARENESS',
      dailyBudget: 1500,
      lifetimeBudget: 0,
      spentToday: 1120,
      budgetRemaining: 380,
      budgetPercentUsed: 74.7,
      spend: 580 * days,
      impressions: 6000 * days,
      clicks: 65 * days,
      ctr: 1.08,
      cpm: 96,
      cpc: 8.92,
      reach: 4800 * days,
      frequency: 1.25,
      leadFormFills: 0,
      websiteLeads: 2 * days,
      totalConversions: 2 * days,
      costPerConversion: (580 * days) / (2 * days),
      roas: 0.8,
      startTime: '2026-05-01T00:00:00Z',
      stopTime: null
    },
    {
      id: 'meta_camp_3',
      name: 'HCM Lookalike Conversions',
      status: 'ACTIVE',
      objective: 'CONVERSIONS',
      dailyBudget: 1500,
      lifetimeBudget: 0,
      spentToday: 910,
      budgetRemaining: 590,
      budgetPercentUsed: 60.7,
      spend: 520 * days,
      impressions: 4000 * days,
      clicks: 80 * days,
      ctr: 2.0,
      cpm: 130,
      cpc: 6.5,
      reach: 2900 * days,
      frequency: 1.38,
      leadFormFills: 8 * days,
      websiteLeads: 6 * days,
      totalConversions: 14 * days,
      costPerConversion: (520 * days) / (14 * days),
      roas: 2.4,
      startTime: '2026-05-15T00:00:00Z',
      stopTime: null
    },
    {
      id: 'meta_camp_4',
      name: 'PPM Retargeting Funnel',
      status: 'PAUSED',
      objective: 'CONVERSIONS',
      dailyBudget: 1000,
      lifetimeBudget: 0,
      spentToday: 0,
      budgetRemaining: 1000,
      budgetPercentUsed: 0,
      spend: 120 * days,
      impressions: 1000 * days,
      clicks: 30 * days,
      ctr: 3.0,
      cpm: 120,
      cpc: 4.0,
      reach: 600 * days,
      frequency: 1.66,
      leadFormFills: 4 * days,
      websiteLeads: 3 * days,
      totalConversions: 7 * days,
      costPerConversion: (120 * days) / (7 * days),
      roas: 3.9,
      startTime: '2026-04-20T00:00:00Z',
      stopTime: '2026-05-25T18:00:00Z'
    }
  ]
}

export function getMockMetaAdSets(campaignId: string, from: string, to: string): MetaAdSet[] {
  const days = getDaysCount(from, to)

  if (campaignId === 'meta_camp_1') {
    return [
      {
        id: 'meta_adset_1a',
        campaignId,
        name: 'SCM Broad - IT Professionals Interest',
        status: 'ACTIVE',
        dailyBudget: 1200,
        optimizationGoal: 'LEADS',
        billingEvent: 'IMPRESSIONS',
        bidStrategy: 'LOWEST_COST',
        targetingsummary: 'Location: India, Age: 22-45, Interests: Supply Chain Management, ERP, SAP, Oracle SCM',
        spend: 420 * days,
        impressions: 3000 * days,
        clicks: 65 * days,
        ctr: 2.16,
        cpm: 140,
        cpc: 6.46,
        reach: 2200 * days,
        frequency: 1.36,
        leadFormFills: 9 * days,
        websiteLeads: 5 * days,
        totalConversions: 14 * days,
        costPerConversion: (420 * days) / (14 * days)
      },
      {
        id: 'meta_adset_1b',
        campaignId,
        name: 'SCM Lookalike Audience 2%',
        status: 'ACTIVE',
        dailyBudget: 800,
        optimizationGoal: 'LEADS',
        billingEvent: 'IMPRESSIONS',
        bidStrategy: 'LOWEST_COST',
        targetingsummary: 'Location: India, Lookalike 2% of previous website conversions, Age: 24-40',
        spend: 280 * days,
        impressions: 2000 * days,
        clicks: 45 * days,
        ctr: 2.25,
        cpm: 140,
        cpc: 6.22,
        reach: 1600 * days,
        frequency: 1.25,
        leadFormFills: 5 * days,
        websiteLeads: 3 * days,
        totalConversions: 8 * days,
        costPerConversion: (280 * days) / (8 * days)
      }
    ]
  }

  // Generic fallback for other campaigns
  return [
    {
      id: `meta_adset_generic_1`,
      campaignId,
      name: 'Ad Set 1 — General Targeting',
      status: 'ACTIVE',
      dailyBudget: 800,
      optimizationGoal: 'CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST',
      targetingsummary: 'Location: India, Age: 21-50',
      spend: 200 * days,
      impressions: 2000 * days,
      clicks: 40 * days,
      ctr: 2.0,
      cpm: 100,
      cpc: 5.0,
      reach: 1500 * days,
      frequency: 1.33,
      leadFormFills: 3 * days,
      websiteLeads: 2 * days,
      totalConversions: 5 * days,
      costPerConversion: 40
    }
  ]
}

export function getMockMetaAds(adSetId: string, from: string, to: string): MetaAd[] {
  const days = getDaysCount(from, to)

  if (adSetId.includes('1a')) {
    return [
      {
        id: 'meta_ad_1a_1',
        adSetId,
        name: 'SCM Course Benefit List - Image Creative',
        status: 'ACTIVE',
        creativeType: 'image',
        previewUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80',
        spend: 240 * days,
        impressions: 1700 * days,
        clicks: 40 * days,
        ctr: 2.35,
        cpc: 6.0,
        leadFormFills: 6 * days,
        websiteLeads: 3 * days,
        totalConversions: 9 * days,
        costPerConversion: (240 * days) / (9 * days)
      },
      {
        id: 'meta_ad_1a_2',
        adSetId,
        name: 'SCM Job Placement Guarantee - Video Ad',
        status: 'ACTIVE',
        creativeType: 'video',
        previewUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80',
        spend: 180 * days,
        impressions: 1300 * days,
        clicks: 25 * days,
        ctr: 1.92,
        cpc: 7.2,
        leadFormFills: 3 * days,
        websiteLeads: 2 * days,
        totalConversions: 5 * days,
        costPerConversion: (180 * days) / (5 * days)
      }
    ]
  }

  return [
    {
      id: `meta_ad_generic_1`,
      adSetId,
      name: 'Creative Ad Variation A (Image)',
      status: 'ACTIVE',
      creativeType: 'image',
      previewUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
      spend: 100 * days,
      impressions: 1000 * days,
      clicks: 20 * days,
      ctr: 2.0,
      cpc: 5.0,
      leadFormFills: 2 * days,
      websiteLeads: 1 * days,
      totalConversions: 3 * days,
      costPerConversion: 33.3
    }
  ]
}

export function getMockMetaPlacements(from: string, to: string): MetaPlacementBreakdown {
  const days = getDaysCount(from, to)

  return {
    placements: [
      { placement: 'Facebook Feed', spend: 800 * days, impressions: 5000 * days, clicks: 90 * days, ctr: 1.8, conversions: 24 * days, costPerConversion: (800 / 24) },
      { placement: 'Instagram Stories', spend: 450 * days, impressions: 3500 * days, clicks: 55 * days, ctr: 1.57, conversions: 12 * days, costPerConversion: (450 / 12) },
      { placement: 'Instagram Reels', spend: 350 * days, impressions: 2300 * days, clicks: 45 * days, ctr: 1.95, conversions: 11 * days, costPerConversion: (350 / 11) },
      { placement: 'Facebook Audience Network', spend: 120 * days, impressions: 1000 * days, clicks: 10 * days, ctr: 1.0, conversions: 1 * days, costPerConversion: 120 },
      { placement: 'Facebook Messenger', spend: 80 * days, impressions: 200 * days, clicks: 5 * days, ctr: 2.5, conversions: 1 * days, costPerConversion: 80 }
    ]
  }
}

export function getMockMetaDemographics(from: string, to: string): MetaDemographicBreakdown {
  const days = getDaysCount(from, to)

  return {
    ageGender: [
      { age: '22-24', gender: 'male', spend: 100 * days, impressions: 800 * days, clicks: 12 * days, conversions: 2 * days },
      { age: '22-24', gender: 'female', spend: 80 * days, impressions: 600 * days, clicks: 10 * days, conversions: 1 * days },
      { age: '25-34', gender: 'male', spend: 800 * days, impressions: 5200 * days, clicks: 110 * days, conversions: 28 * days },
      { age: '25-34', gender: 'female', spend: 550 * days, impressions: 3800 * days, clicks: 75 * days, conversions: 16 * days },
      { age: '35-44', gender: 'male', spend: 150 * days, impressions: 1000 * days, clicks: 15 * days, conversions: 2 * days },
      { age: '35-44', gender: 'female', spend: 120 * days, impressions: 600 * days, clicks: 8 * days, conversions: 1 * days }
    ]
  }
}

export function getMockMetaDailyTrend(from: string, to: string): MetaDailyTrend[] {
  const dates = getDatesInRange(from, to)

  return dates.map((date, idx) => {
    const seed = Math.sin(idx * 0.5) + 1.2 // Fluctuate trend
    const spend = Math.round((1200 + seed * 200) * 10) / 10
    const clicks = Math.round(spend / 6.5)
    const impressions = clicks * 55
    const leadFormFills = Math.round(clicks * 0.12)
    const websiteLeads = Math.round(clicks * 0.08)

    return {
      date,
      spend,
      impressions,
      clicks,
      leadFormFills,
      websiteLeads,
      totalConversions: leadFormFills + websiteLeads,
      ctr: 1.8,
      cpc: spend / clicks
    }
  })
}

// ── GOOGLE ADS MOCK DATA ──────────────────────────────────

export function getMockGoogleOverview(from: string, to: string): GoogleAccountOverview {
  const days = getDaysCount(from, to)
  const spend = 2300 * days
  const impressions = 9000 * days
  const clicks = Math.round(impressions * 0.052) // 5.2% CTR
  const conversions = Math.round(clicks * 0.042) // 4.2% CR
  const formSubmissions = Math.round(conversions * 0.6)
  const phoneCalls = Math.round(conversions * 0.25)
  const websiteConversions = conversions - formSubmissions - phoneCalls

  return {
    customerId: '592-882-9013',
    accountName: 'TechLeadsIT Google Ads',
    spend,
    impressions,
    clicks,
    ctr: 5.2,
    avgCpc: spend / clicks,
    conversions,
    costPerConversion: spend / conversions,
    conversionRate: 4.2,
    searchImpressionShare: 68.0,
    formSubmissions,
    phoneCalls,
    websiteConversions,
    costPerFormSubmission: spend / formSubmissions,
    costPerCall: spend / phoneCalls,
    totalDailyBudget: 6000,
    totalSpentToday: 4180,
    budgetAlerts: getMockBudgetAlerts().filter(a => a.platform === 'google')
  }
}

export function getMockGoogleCampaigns(from: string, to: string): GoogleCampaign[] {
  const days = getDaysCount(from, to)

  return [
    {
      id: 'gg_camp_1',
      name: 'HCM Search Campaign',
      status: 'ENABLED',
      type: 'SEARCH',
      dailyBudget: 3000,
      spentToday: 2180,
      budgetRemaining: 820,
      budgetPercentUsed: 72.7,
      biddingStrategy: 'TARGET_CPA',
      targetCpa: 450,
      targetRoas: null,
      spend: 1100 * days,
      impressions: 4200 * days,
      clicks: 220 * days,
      ctr: 5.24,
      avgCpc: 5.0,
      conversions: 10 * days,
      costPerConversion: 110,
      conversionRate: 4.54,
      searchImpressionShare: 72.5
    },
    {
      id: 'gg_camp_2',
      name: 'SCM Performance Max',
      status: 'ENABLED',
      type: 'PERFORMANCE_MAX',
      dailyBudget: 2000,
      spentToday: 1850,
      budgetRemaining: 150,
      budgetPercentUsed: 92.5,
      biddingStrategy: 'MAXIMIZE_CONVERSIONS',
      targetCpa: null,
      targetRoas: null,
      spend: 850 * days,
      impressions: 3800 * days,
      clicks: 185 * days,
      ctr: 4.87,
      avgCpc: 4.59,
      conversions: 8 * days,
      costPerConversion: 106.25,
      conversionRate: 4.32,
      searchImpressionShare: 62.0
    },
    {
      id: 'gg_camp_3',
      name: 'Oracle Integration Display',
      status: 'ENABLED',
      type: 'DISPLAY',
      dailyBudget: 1000,
      spentToday: 150,
      budgetRemaining: 850,
      budgetPercentUsed: 15.0,
      biddingStrategy: 'MAXIMIZE_CLICKS',
      targetCpa: null,
      targetRoas: null,
      spend: 350 * days,
      impressions: 1000 * days,
      clicks: 65 * days,
      ctr: 6.5,
      avgCpc: 5.38,
      conversions: 0,
      costPerConversion: 0,
      conversionRate: 0,
      searchImpressionShare: 55.0
    }
  ]
}

export function getMockGoogleAdGroups(campaignId: string, from: string, to: string): GoogleAdGroup[] {
  const days = getDaysCount(from, to)

  if (campaignId === 'gg_camp_1') {
    return [
      {
        id: 'gg_adgroup_1a',
        campaignId,
        name: 'Oracle HCM Training - Exact Match',
        status: 'ENABLED',
        type: 'SEARCH_STANDARD',
        cpcBidMicros: 8000000, // ₹8.00
        spend: 600 * days,
        impressions: 2200 * days,
        clicks: 125 * days,
        ctr: 5.68,
        avgCpc: 4.8,
        conversions: 6 * days,
        costPerConversion: 100,
        conversionRate: 4.8
      },
      {
        id: 'gg_adgroup_1b',
        campaignId,
        name: 'Oracle HCM Online Course - Phrase Match',
        status: 'ENABLED',
        type: 'SEARCH_STANDARD',
        cpcBidMicros: 6000000, // ₹6.00
        spend: 500 * days,
        impressions: 2000 * days,
        clicks: 95 * days,
        ctr: 4.75,
        avgCpc: 5.26,
        conversions: 4 * days,
        costPerConversion: 125,
        conversionRate: 4.21
      }
    ]
  }

  return [
    {
      id: `gg_adgroup_generic_1`,
      campaignId,
      name: 'Ad Group 1 — Main Target',
      status: 'ENABLED',
      type: 'STANDARD',
      cpcBidMicros: 5000000,
      spend: 250 * days,
      impressions: 1000 * days,
      clicks: 50 * days,
      ctr: 5.0,
      avgCpc: 5.0,
      conversions: 2 * days,
      costPerConversion: 125,
      conversionRate: 4.0
    }
  ]
}

export function getMockGoogleKeywords(from: string, to: string): GoogleKeyword[] {
  const days = getDaysCount(from, to)

  return [
    {
      id: 'gg_kw_1',
      adGroupId: 'gg_adgroup_1a',
      text: 'oracle hcm cloud training',
      matchType: 'EXACT',
      status: 'ENABLED',
      qualityScore: 9,
      expectedCtr: 'ABOVE_AVERAGE',
      adRelevance: 'ABOVE_AVERAGE',
      landingPageExp: 'ABOVE_AVERAGE',
      cpcBidMicros: 8000000,
      spend: 240 * days,
      impressions: 800 * days,
      clicks: 45 * days,
      ctr: 5.62,
      avgCpc: 5.33,
      conversions: 3 * days,
      costPerConversion: 80,
      conversionRate: 6.66
    },
    {
      id: 'gg_kw_2',
      adGroupId: 'gg_adgroup_1a',
      text: 'oracle hcm online certification',
      matchType: 'PHRASE',
      status: 'ENABLED',
      qualityScore: 7,
      expectedCtr: 'AVERAGE',
      adRelevance: 'ABOVE_AVERAGE',
      landingPageExp: 'AVERAGE',
      cpcBidMicros: 6000000,
      spend: 180 * days,
      impressions: 700 * days,
      clicks: 35 * days,
      ctr: 5.0,
      avgCpc: 5.14,
      conversions: 2 * days,
      costPerConversion: 90,
      conversionRate: 5.71
    },
    {
      id: 'gg_kw_3',
      adGroupId: 'gg_adgroup_1b',
      text: 'oracle hcm training in hyderabad',
      matchType: 'EXACT',
      status: 'ENABLED',
      qualityScore: 5,
      expectedCtr: 'AVERAGE',
      adRelevance: 'AVERAGE',
      landingPageExp: 'BELOW_AVERAGE',
      cpcBidMicros: 5000000,
      spend: 120 * days,
      impressions: 500 * days,
      clicks: 25 * days,
      ctr: 5.0,
      avgCpc: 4.8,
      conversions: 1 * days,
      costPerConversion: 120,
      conversionRate: 4.0
    },
    {
      id: 'gg_kw_4',
      adGroupId: 'gg_adgroup_1b',
      text: 'learn oracle fusion hcm',
      matchType: 'BROAD',
      status: 'ENABLED',
      qualityScore: 3,
      expectedCtr: 'BELOW_AVERAGE',
      adRelevance: 'AVERAGE',
      landingPageExp: 'BELOW_AVERAGE',
      cpcBidMicros: 4000000,
      spend: 80 * days,
      impressions: 400 * days,
      clicks: 12 * days,
      ctr: 3.0,
      avgCpc: 6.66,
      conversions: 0,
      costPerConversion: 0,
      conversionRate: 0
    }
  ]
}

export function getMockGoogleSearchTerms(from: string, to: string): GoogleSearchTerm[] {
  const days = getDaysCount(from, to)

  return [
    {
      searchTerm: 'best oracle hcm cloud functional training institute',
      matchType: 'PHRASE',
      campaignName: 'HCM Search Campaign',
      adGroupName: 'Oracle HCM Training - Exact Match',
      impressions: 150 * days,
      clicks: 22 * days,
      ctr: 14.67,
      avgCpc: 4.5,
      spend: 99 * days,
      conversions: 3 * days,
      costPerConversion: 33.0
    },
    {
      searchTerm: 'oracle fusion hcm course cost and schedule',
      matchType: 'BROAD',
      campaignName: 'HCM Search Campaign',
      adGroupName: 'Oracle HCM Online Course - Phrase Match',
      impressions: 110 * days,
      clicks: 15 * days,
      ctr: 13.63,
      avgCpc: 5.2,
      spend: 78 * days,
      conversions: 2 * days,
      costPerConversion: 39.0
    },
    {
      searchTerm: 'oracle hcm jobs salary package in india', // Potential negative (informational search)
      matchType: 'BROAD',
      campaignName: 'HCM Search Campaign',
      adGroupName: 'Oracle HCM Online Course - Phrase Match',
      impressions: 250 * days,
      clicks: 30 * days,
      ctr: 12.0,
      avgCpc: 6.8,
      spend: 204 * days,
      conversions: 0,
      costPerConversion: 0
    },
    {
      searchTerm: 'free oracle fusion hcm tutorial pdf download', // High spend, 0 conversions -> flag
      matchType: 'PHRASE',
      campaignName: 'HCM Search Campaign',
      adGroupName: 'Oracle HCM Online Course - Phrase Match',
      impressions: 300 * days,
      clicks: 45 * days,
      ctr: 15.0,
      avgCpc: 5.8,
      spend: 261 * days,
      conversions: 0,
      costPerConversion: 0
    }
  ]
}

export function getMockGoogleAds(adGroupId: string, from: string, to: string): GoogleAd[] {
  const days = getDaysCount(from, to)

  return [
    {
      id: 'gg_ad_1',
      adGroupId,
      type: 'RESPONSIVE_SEARCH_AD',
      status: 'ENABLED',
      headlines: ['Oracle HCM Cloud Training', 'Oracle Fusion HCM Course', 'Job Placement Support'],
      descriptions: ['Get certified in Oracle Fusion HCM. Live interactive online training by ERP experts.', 'Enroll today for flat 20% discount.'],
      finalUrls: ['https://techleadsit.com/oracle-hcm-course'],
      spend: 350 * days,
      impressions: 1500 * days,
      clicks: 80 * days,
      ctr: 5.33,
      avgCpc: 4.38,
      conversions: 4 * days,
      costPerConversion: 87.5
    },
    {
      id: 'gg_ad_2',
      adGroupId,
      type: 'RESPONSIVE_SEARCH_AD',
      status: 'ENABLED',
      headlines: ['ERP Technical Online Classes', 'BIP Reports and OTBI Guide', 'Learn HDL & HCM Extracts'],
      descriptions: ['Master Oracle Technical Cloud. Join top SCM/HCM technical functional modules course.'],
      finalUrls: ['https://techleadsit.com/oracle-technical-course'],
      spend: 250 * days,
      impressions: 1200 * days,
      clicks: 50 * days,
      ctr: 4.16,
      avgCpc: 5.0,
      conversions: 2 * days,
      costPerConversion: 125
    }
  ]
}

export function getMockGoogleDevices(from: string, to: string): GoogleDeviceBreakdown {
  const days = getDaysCount(from, to)

  return {
    devices: [
      { device: 'MOBILE', spend: 1400 * days, impressions: 5800 * days, clicks: 310 * days, ctr: 5.34, conversions: 12 * days, costPerConversion: (1400 / 12) },
      { device: 'DESKTOP', spend: 800 * days, impressions: 2800 * days, clicks: 145 * days, ctr: 5.17, conversions: 6 * days, costPerConversion: (800 / 6) },
      { device: 'TABLET', spend: 100 * days, impressions: 400 * days, clicks: 15 * days, ctr: 3.75, conversions: 0, costPerConversion: 0 }
    ]
  }
}

export function getMockGoogleGeo(from: string, to: string): GoogleGeoBreakdown {
  const days = getDaysCount(from, to)

  return {
    locations: [
      { city: 'Hyderabad', state: 'Telangana', spend: 750 * days, clicks: 150 * days, conversions: 8 * days },
      { city: 'Bangalore', state: 'Karnataka', spend: 650 * days, clicks: 120 * days, conversions: 6 * days },
      { city: 'Pune', state: 'Maharashtra', spend: 450 * days, clicks: 80 * days, conversions: 3 * days },
      { city: 'Chennai', state: 'Tamil Nadu', spend: 300 * days, clicks: 60 * days, conversions: 1 * days },
      { city: 'Noida', state: 'Uttar Pradesh', spend: 150 * days, clicks: 30 * days, conversions: 0 }
    ]
  }
}

export function getMockGoogleDailyTrend(from: string, to: string): GoogleDailyTrend[] {
  const dates = getDatesInRange(from, to)

  return dates.map((date, idx) => {
    const seed = Math.cos(idx * 0.4) + 1.3 // Fluctuate trend
    const spend = Math.round((1500 + seed * 250) * 10) / 10
    const clicks = Math.round(spend / 5.2)
    const impressions = clicks * 19
    const conversions = Math.round(clicks * 0.042)

    return {
      date,
      spend,
      impressions,
      clicks,
      conversions,
      ctr: 5.2,
      avgCpc: spend / clicks,
      costPerConversion: conversions > 0 ? spend / conversions : 0
    }
  })
}

// ── COMBINED OVERVIEW MOCK DATA ───────────────────────────

export function getMockCombinedOverview(from: string, to: string): AdsCombinedOverview {
  const days = getDaysCount(from, to)
  const meta = getMockMetaOverview(from, to)
  const google = getMockGoogleOverview(from, to)

  const totalSpend = meta.spend + google.spend
  const totalConversions = meta.totalConversions + google.conversions
  const totalLeads = meta.leadFormFills + google.formSubmissions

  return {
    dateRange: {
      from,
      to,
      preset: 'custom',
      label: `${from} to ${to}`
    },
    totalSpend,
    totalImpressions: meta.impressions + google.impressions,
    totalClicks: meta.clicks + google.clicks,
    totalConversions,
    totalLeads,
    avgCostPerLead: totalSpend / totalLeads,
    overallCTR: ((meta.clicks + google.clicks) / (meta.impressions + google.impressions)) * 100,
    overallCPC: totalSpend / (meta.clicks + google.clicks),
    metaSpend: meta.spend,
    googleSpend: google.spend,
    metaConversions: meta.totalConversions,
    googleConversions: google.conversions,
    metaCPL: meta.spend / (meta.leadFormFills || 1),
    googleCPL: google.spend / (google.formSubmissions || 1),
    metaLeadFormFills: meta.leadFormFills,
    metaWebsiteLeads: meta.websiteLeads,
    metaLeadFormCPL: meta.costPerLeadForm,
    metaWebsiteLeadCPL: meta.costPerWebsiteLead,
    googleFormSubmissions: google.formSubmissions,
    googlePhoneCalls: google.phoneCalls,
    budgetAlerts: getMockBudgetAlerts(),
    lastRefreshedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    nextRefreshAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()    // in 4 hours
  }
}
