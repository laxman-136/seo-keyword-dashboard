// lib/metrics-config.ts

export interface MetricConfig {
  id: string
  label: string
  description: string
  defaultVisible: boolean
  category: 'performance' | 'engagement' | 'conversion' | 'budget'
  platform: 'meta' | 'google' | 'both'
  format: 'currency' | 'number' | 'percent' | 'multiplier' | 'text'
}

export const META_METRICS: MetricConfig[] = [
  // Budget
  { id: 'spend',            label: 'Spend',            description: 'Total amount spent', defaultVisible: true,  category: 'budget', platform: 'meta', format: 'currency' },
  { id: 'dailyBudget',      label: 'Daily Budget',     description: 'Campaign daily budget cap', defaultVisible: true,  category: 'budget', platform: 'meta', format: 'currency' },
  { id: 'budgetRemaining',  label: 'Remaining Budget',  description: 'Remaining budget for today', defaultVisible: true,  category: 'budget', platform: 'meta', format: 'currency' },
  { id: 'budgetPercentUsed',label: '% Budget Used',     description: 'Percentage of budget spent today', defaultVisible: true,  category: 'budget', platform: 'meta', format: 'percent' },
  
  // Performance
  { id: 'impressions',      label: 'Impressions',       description: 'Number of times ads were viewed', defaultVisible: true,  category: 'performance', platform: 'meta', format: 'number' },
  { id: 'clicks',           label: 'Clicks',            description: 'Number of link clicks on ads', defaultVisible: true,  category: 'performance', platform: 'meta', format: 'number' },
  { id: 'ctr',              label: 'CTR %',             description: 'Click-through rate (clicks/impressions)', defaultVisible: true,  category: 'performance', platform: 'meta', format: 'percent' },
  { id: 'cpm',              label: 'CPM',               description: 'Cost per 1,000 impressions', defaultVisible: false, category: 'performance', platform: 'meta', format: 'currency' },
  { id: 'cpc',              label: 'CPC',               description: 'Average cost per click', defaultVisible: true,  category: 'performance', platform: 'meta', format: 'currency' },
  { id: 'reach',            label: 'Reach',             description: 'Unique people who saw the ads', defaultVisible: false, category: 'performance', platform: 'meta', format: 'number' },
  { id: 'frequency',        label: 'Frequency',         description: 'Average views per person', defaultVisible: false, category: 'performance', platform: 'meta', format: 'multiplier' },
  
  // Conversions
  { id: 'leadFormFills',    label: 'Lead Form Fills',   description: 'Leads from Meta instant forms', defaultVisible: true,  category: 'conversion', platform: 'meta', format: 'number' },
  { id: 'websiteLeads',     label: 'Website Leads',     description: 'Pixel lead events on website', defaultVisible: true,  category: 'conversion', platform: 'meta', format: 'number' },
  { id: 'websiteRegistrations', label: 'Registrations', description: 'Complete registration events', defaultVisible: false, category: 'conversion', platform: 'meta', format: 'number' },
  { id: 'landingPageViews',  label: 'Landing Page Views', description: 'Pixel landing page views', defaultVisible: false, category: 'conversion', platform: 'meta', format: 'number' },
  { id: 'totalConversions',  label: 'Total Conversions', description: 'Sum of all conversion actions', defaultVisible: true,  category: 'conversion', platform: 'meta', format: 'number' },
  { id: 'costPerConversion', label: 'Cost Per Lead',     description: 'Average cost per lead conversion', defaultVisible: true,  category: 'conversion', platform: 'meta', format: 'currency' },
  { id: 'costPerLeadForm',  label: 'Cost Per Form Lead',description: 'Cost per Meta instant form lead', defaultVisible: false, category: 'conversion', platform: 'meta', format: 'currency' },
  { id: 'costPerWebsiteLead', label: 'Cost Per Web Lead', description: 'Cost per website pixel lead', defaultVisible: false, category: 'conversion', platform: 'meta', format: 'currency' },
  { id: 'roas',             label: 'ROAS',              description: 'Return on Ad Spend', defaultVisible: true,  category: 'conversion', platform: 'meta', format: 'multiplier' }
]

export const GOOGLE_METRICS: MetricConfig[] = [
  // Budget
  { id: 'spend',            label: 'Spend',            description: 'Total cost incurred', defaultVisible: true,  category: 'budget', platform: 'google', format: 'currency' },
  { id: 'dailyBudget',      label: 'Daily Budget',     description: 'Campaign daily budget cap', defaultVisible: true,  category: 'budget', platform: 'google', format: 'currency' },
  { id: 'budgetRemaining',  label: 'Remaining Budget',  description: 'Remaining budget for today', defaultVisible: true,  category: 'budget', platform: 'google', format: 'currency' },
  { id: 'budgetPercentUsed',label: '% Budget Used',     description: 'Percentage of budget spent today', defaultVisible: true,  category: 'budget', platform: 'google', format: 'percent' },
  
  // Performance
  { id: 'impressions',      label: 'Impressions',       description: 'Number of times ads were shown', defaultVisible: true,  category: 'performance', platform: 'google', format: 'number' },
  { id: 'clicks',           label: 'Clicks',            description: 'Number of clicks on ads', defaultVisible: true,  category: 'performance', platform: 'google', format: 'number' },
  { id: 'ctr',              label: 'CTR %',             description: 'Click-through rate (clicks/impressions)', defaultVisible: true,  category: 'performance', platform: 'google', format: 'percent' },
  { id: 'avgCpc',           label: 'Avg CPC',           description: 'Average cost per click', defaultVisible: true,  category: 'performance', platform: 'google', format: 'currency' },
  { id: 'searchImpressionShare', label: 'Impr Share %', description: 'Search Impression Share', defaultVisible: false, category: 'performance', platform: 'google', format: 'percent' },
  
  // Conversions
  { id: 'formSubmissions',  label: 'Form Fills',        description: 'Leads from Google lead forms', defaultVisible: true,  category: 'conversion', platform: 'google', format: 'number' },
  { id: 'phoneCalls',       label: 'Phone Calls',       description: 'Phone call conversions', defaultVisible: true,  category: 'conversion', platform: 'google', format: 'number' },
  { id: 'websiteConversions', label: 'Web Conversions', description: 'Conversion actions on website', defaultVisible: false, category: 'conversion', platform: 'google', format: 'number' },
  { id: 'conversions',      label: 'Total Conversions', description: 'Sum of all conversions', defaultVisible: true,  category: 'conversion', platform: 'google', format: 'number' },
  { id: 'costPerConversion', label: 'Cost Per Conv',    description: 'Average cost per conversion', defaultVisible: true,  category: 'conversion', platform: 'google', format: 'currency' },
  { id: 'conversionRate',   label: 'Conv Rate %',       description: 'Conversion rate (conversions/clicks)', defaultVisible: true,  category: 'conversion', platform: 'google', format: 'percent' }
]

export const COMBINED_METRICS: MetricConfig[] = [
  { id: 'totalSpend',       label: 'Total Spend',       description: 'Combined spend on Meta and Google', defaultVisible: true,  category: 'budget', platform: 'both', format: 'currency' },
  { id: 'totalConversions', label: 'Total Conversions', description: 'Combined conversion actions', defaultVisible: true,  category: 'conversion', platform: 'both', format: 'number' },
  { id: 'totalLeads',       label: 'Total Leads',       description: 'Combined lead forms and form fills', defaultVisible: true,  category: 'conversion', platform: 'both', format: 'number' },
  { id: 'avgCostPerLead',   label: 'Avg Cost Per Lead',  description: 'Combined average cost per lead', defaultVisible: true,  category: 'conversion', platform: 'both', format: 'currency' },
  { id: 'overallCTR',       label: 'Overall CTR',       description: 'Combined click-through rate', defaultVisible: true,  category: 'performance', platform: 'both', format: 'percent' },
  { id: 'overallCPC',       label: 'Overall CPC',       description: 'Combined average cost per click', defaultVisible: true,  category: 'performance', platform: 'both', format: 'currency' }
]

/**
 * Loads a user's column preference list from localStorage, fallback to default configurations if not customized
 */
export function getVisibleMetricIds(pageKey: string, platform: 'meta' | 'google' | 'both'): string[] {
  if (typeof window === 'undefined') {
    return getDefaultMetricIds(platform)
  }

  try {
    const key = `visible-metrics::${pageKey}`
    const saved = localStorage.getItem(key)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {
    // Ignore error and use default
  }

  return getDefaultMetricIds(platform)
}

/**
 * Saves a user's column preference list to localStorage
 */
export function saveVisibleMetricIds(pageKey: string, ids: string[]): void {
  if (typeof window === 'undefined') return
  try {
    const key = `visible-metrics::${pageKey}`
    localStorage.setItem(key, JSON.stringify(ids))
  } catch {
    // Ignore error
  }
}

function getDefaultMetricIds(platform: 'meta' | 'google' | 'both'): string[] {
  const list = platform === 'meta' ? META_METRICS : platform === 'google' ? GOOGLE_METRICS : COMBINED_METRICS
  return list.filter(m => m.defaultVisible).map(m => m.id)
}
