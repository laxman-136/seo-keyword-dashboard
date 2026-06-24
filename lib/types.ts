// lib/types.ts

export interface KeywordRow {
  keyword: string
  group: string
  monthlyData: Record<string, MonthData>  // key = "May-25"
  status: string
  priority: string
  notes: string
}

export interface MonthData {
  page: number      // 0 = not ranking
  position: number  // 0 = not ranking
}

export interface ProcessedKeyword extends KeywordRow {
  currentMonth: string
  previousMonth: string
  currentPage: number
  currentPosition: number
  prevPage: number
  prevPosition: number
  pageBand: PageBand
  movement: Movement
  vsLastMonthLabel: string
}

export type PageBand = 
  | 'P1 Top (1-4)'
  | 'P1 Good (5-10)'
  | 'Page 2'
  | 'Page 3'
  | 'Page 4+'
  | 'Not Ranking'

export type Movement = 
  | 'Improved'
  | 'Neutral'
  | 'Dropped'
  | 'New Entry'
  | 'Lost Ranking'
  | 'No Data'

export interface GroupSummary {
  name: string
  total: number
  p1Top: number
  p1Good: number
  page2: number
  page3: number
  page4Plus: number
  notRanking: number
  improved: number
  dropped: number
  neutral: number
}

export interface DashboardStats {
  totalKeywords: number
  p1Top: number
  p1Good: number
  page2: number
  page3: number
  page4Plus: number
  notRanking: number
  improved: number
  neutral: number
  dropped: number
  newEntries: number
  lostRankings: number
  currentMonth: string
  previousMonth: string
  prevP1Top: number
  prevP1Good: number
  prevPage2: number
  prevPage3: number
  prevPage4Plus: number
  prevNotRanking: number
}

// ── TRAFFIC TYPES ─────────────────────────────────────────

export interface TrafficRow {
  month: string           // "January-2024"
  date: Date
  totalUsers: number
  newUsers: number
  sources: Record<TrafficSource, number>
  countries: Record<TrafficCountry, number>
}

export type TrafficSource =
  | 'Organic'
  | 'Direct'
  | 'Social'
  | 'Video'
  | 'Referral'
  | 'Paid Search'
  | 'Cross Network'
  | 'Display'
  | 'Email'
  | 'Unassigned'

export type TrafficCountry =
  | 'India'
  | 'USA'
  | 'UAE'
  | 'Saudi Arabia'
  | 'Canada'
  | 'Pakistan'
  | 'United Kingdom'
  | 'Poland'
  | 'Others'

export interface ViewerAccessGrant {
  id: string
  recipientEmail: string
  ownerEmail: string
  label: string
  sheetId?: string // Deprecated, kept for legacy compatibility
  seoSheetId?: string
  leadsSheetId?: string
  revenueSheetId?: string
  apiKey: string
  expiresAt: string
  createdAt: string
}

export interface TrafficAggregate {
  totalUsers: number
  newUsers: number
  sources: Record<TrafficSource, number>
  countries: Record<TrafficCountry, number>
  topSource: TrafficSource
  topCountry: TrafficCountry
}

export interface TrafficPeriodResult {
  current: TrafficAggregate
  previous: TrafficAggregate
  currentLabel: string
  previousLabel: string
  mode: 'monthly' | 'quarterly' | 'yearly'
}

export interface TrafficKPI {
  label: string
  current: number | string
  previous?: number | string
  changePercent?: number
  isText?: boolean
  icon: string
}

export interface QuarterlyData {
  year: number
  q1: number
  q2: number
  q3: number
  q4: number
  total: number
}

export interface YearlyData {
  year: number
  totalUsers: number
  newUsers: number
  topSource: string
  topCountry: string
  yoyChange: number | null
}

// ── SITE STATUS TYPES ─────────────────────────────────────────

export interface SiteStatusRow {
  month: string // "May-2025"
  date: Date
  pages: number
  newDate?: string
  domainRating?: number
  backlinks?: number
  referringDomains?: number
  da?: number
  pa?: number
}

export interface SiteStatusResult {
  rows: SiteStatusRow[]
  isMock: boolean
  lastUpdated: string
  fallbackReason?: string
}

// Per-page Site Status when sheet uses grouped headers like "May-2025 Domain Rating"
export interface SiteStatusPageRow {
  page: string
  monthlyData: Record<string, {
    domainRating?: number
    backlinks?: number
    referringDomains?: number
    da?: number
    pa?: number
  }>
}

export interface SiteStatusPageResult {
  rows: SiteStatusPageRow[]
  months: string[]
  isMock: boolean
  lastUpdated: string
  fallbackReason?: string
}

// ── LEADS TYPES ────────────────────────────────────────────

export interface LeadsMonthlyRow {
  month: string                    // "May 2026"
  totalLeads: number
  websiteLeads: number
  organicLeads: number
  scmLeads: number
  hcmLeads: number
  financialsLeads: number
  techOicLeads: number
  ppmLeads: number
  sapEbsOthersLeads: number
  llmLeads?: number
  chatgptLeads?: number
  perplexityLeads?: number
  enrolled: number
  highPotential: number
  mediumPotential: number
  freshUnqualified: number
  lowCold: number
  convRate: number                 // percentage e.g. 5.6
}

export interface LeadsDetailRow {
  month: string
  courseName: string
  enrolled: number
  highPotential: number
  mediumPotential: number
  freshUnqualified: number
  lowCold: number
  total: number
  organic: number
  website: number
}

export interface LeadsCourseAggregate {
  courseName: string
  enrolled: number
  highPotential: number
  mediumPotential: number
  freshUnqualified: number
  lowCold: number
  total: number
  organic: number
  website: number
  ads: number
  llm: number
  sharePercent: number
  convRate: number
}

export interface LeadsFunnelData {
  enrolled: number
  highPotential: number
  mediumPotential: number
  freshUnqualified: number
  lowCold: number
  total: number
  enrolledPct: number
  highPotentialPct: number
  mediumPotentialPct: number
  freshUnqualifiedPct: number
  lowColdPct: number
}

export interface LeadsKPI {
  totalLeads: number
  websiteLeads: number
  organicLeads: number
  llmLeads?: number
  enrolled: number
  highPotential: number
  convRate: number
  prevTotalLeads: number
  prevEnrolled: number
  prevConvRate: number
  prevHighPotential: number
  prevWebsiteLeads?: number
  prevOrganicLeads?: number
  prevLLMLeads?: number
  currentMonth: string
  previousMonth: string
}

export interface LeadsTrendPoint {
  month: string
  totalLeads: number
  websiteLeads: number
  organicLeads: number
  enrolled: number
  highPotential: number
  convRate: number
}

export interface LeadsChannelSplit {
  channel: string
  leads: number
  enrolled: number
  highPotential: number
  sharePercent: number
  convRate: number
}

// ── REVENUE TYPES ────────────────────────────────────────────

export interface RevenueMonthlyRow {
  month: string                      // "February 2026"
  totalConversions: number
  totalRevenue: number               // in ₹
  avgRevenuePerStudent: number
  // Lead source conversions
  organicConversions: number
  websiteConversions: number
  referralConversions: number
  googleAdsConversions: number
  metaAdsConversions: number
  directConversions: number
  // Lead source revenue
  organicRevenue: number
  websiteRevenue: number
  referralRevenue: number
  googleAdsRevenue: number
  metaAdsRevenue: number
  directRevenue: number
  // Ad spend
  totalAdSpend: number
  metaAdSpend: number
  googleAdSpend: number
  paidRevenue: number
  overallROAS: number
}

export interface RevenueCourseRow {
  month: string
  courseName: string
  conversions: number
  revenue: number
  avgFee: number
  revenueSharePct: number
  metaSpend: number
  googleSpend: number
  totalAdSpend: number
  googleAdsRevenue: number
  metaAdsRevenue: number
  paidRevenue: number
  roas: number
  organicRevenue: number
  websiteRevenue: number
  totalDemoAttended: number
  demoGoogle: number
  demoMeta: number
  batchNo: string
  faculty: string
}

export interface RevenueKPI {
  totalRevenue: number
  totalConversions: number
  avgFee: number
  totalAdSpend: number
  overallROAS: number
  organicRevenue: number
  paidRevenue: number
  prevTotalRevenue: number
  prevTotalConversions: number
  prevAvgFee: number
  prevTotalAdSpend: number
  prevOverallROAS: number
  currentMonth: string
  previousMonth: string
}

export interface RevenueSourceBreakdown {
  source: string
  conversions: number
  revenue: number
  revenueSharePct: number
  avgFee: number
  convSharePct: number
}

export interface RevenueCourseAggregate {
  courseName: string
  conversions: number
  revenue: number
  avgFee: number
  revenueSharePct: number
  totalAdSpend: number
  paidRevenue: number
  roas: number
  organicRevenue: number
  websiteRevenue: number
  totalDemoAttended: number
  faculty: string
  batchNo: string
}

export interface AdSpendBreakdown {
  course: string
  metaSpend: number
  googleSpend: number
  totalAdSpend: number
  metaRevenue: number
  googleRevenue: number
  paidRevenue: number
  roas: number
  metaROAS: number
  googleROAS: number
  demoGoogle: number
  demoMeta: number
}

export interface RevenueTrendPoint {
  month: string
  totalRevenue: number
  organicRevenue: number
  paidRevenue: number
  totalConversions: number
  avgFee: number
  totalAdSpend: number
  overallROAS: number
}

export interface RevenueQuarterlyRow {
  year: number
  quarter: string
  totalRevenue: number
  conversions: number
  avgFee: number
  totalAdSpend: number
  paidRevenue: number
  overallROAS: number
  organicRevenue: number
}

export interface RevenueYearlyRow {
  year: number
  totalRevenue: number
  conversions: number
  avgFee: number
  totalAdSpend: number
  paidRevenue: number
  overallROAS: number
  organicRevenue: number
}

export interface RevenueQuarterlyDetailRow extends RevenueQuarterlyRow {
  organicConversions: number
  websiteConversions: number
  referralConversions: number
  googleAdsConversions: number
  metaAdsConversions: number
  directConversions: number
  websiteRevenue: number
  referralRevenue: number
  googleAdsRevenue: number
  metaAdsRevenue: number
  directRevenue: number
  googleAdSpend: number
  metaAdSpend: number
}

export interface RevenueYearlyDetailRow extends RevenueYearlyRow {
  organicConversions: number
  websiteConversions: number
  referralConversions: number
  googleAdsConversions: number
  metaAdsConversions: number
  directConversions: number
  websiteRevenue: number
  referralRevenue: number
  googleAdsRevenue: number
  metaAdsRevenue: number
  directRevenue: number
  googleAdSpend: number
  metaAdSpend: number
}

export interface LeadsQuarterlyDetailRow {
  year: number
  quarter: string
  totalLeads: number
  websiteLeads: number
  organicLeads: number
  scmLeads: number
  hcmLeads: number
  financialsLeads: number
  techOicLeads: number
  ppmLeads: number
  sapEbsOthersLeads: number
  llmLeads?: number
  chatgptLeads?: number
  perplexityLeads?: number
  enrolled: number
  highPotential: number
  mediumPotential: number
  freshUnqualified: number
  lowCold: number
  convRate: number
}

export interface LeadsYearlyDetailRow {
  year: number
  totalLeads: number
  websiteLeads: number
  organicLeads: number
  scmLeads: number
  hcmLeads: number
  financialsLeads: number
  techOicLeads: number
  ppmLeads: number
  sapEbsOthersLeads: number
  llmLeads?: number
  chatgptLeads?: number
  perplexityLeads?: number
  enrolled: number
  highPotential: number
  mediumPotential: number
  freshUnqualified: number
  lowCold: number
  convRate: number
}

// ── SHARED ADS TYPES ─────────────────────────────────────

export interface AdsDateRange {
  from: string
  to: string
  preset: string
  label: string
}

export interface AdsBudgetAlert {
  platform: 'meta' | 'google'
  campaignName: string
  campaignId: string
  dailyBudget: number
  spentToday: number
  remaining: number
  percentUsed: number
  alertLevel: 'healthy' | 'warning' | 'critical' | 'exhausted'
}

// ── META ADS TYPES ────────────────────────────────────────

export interface MetaAccountOverview {
  accountId: string
  accountName: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpm: number
  cpc: number
  reach: number
  frequency: number
  leadFormFills: number           // Meta instant form leads
  websiteLeads: number            // Website form submissions
  websiteRegistrations: number    // Website registrations
  landingPageViews: number
  costPerLeadForm: number
  costPerWebsiteLead: number
  totalConversions: number
  costPerConversion: number
  roas: number
  totalDailyBudget: number
  totalSpentToday: number
  budgetAlerts: AdsBudgetAlert[]
  lastRefreshedAt?: string
  nextRefreshAt?: string
  isCached?: boolean
}

export interface MetaCampaign {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DELETED'
  objective: string
  dailyBudget: number
  lifetimeBudget: number
  spentToday: number
  budgetRemaining: number
  budgetPercentUsed: number
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpm: number
  cpc: number
  reach: number
  frequency: number
  leadFormFills: number
  websiteLeads: number
  totalConversions: number
  costPerConversion: number
  roas: number
  startTime: string
  stopTime: string | null
}

export interface MetaAdSet {
  id: string
  campaignId: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  dailyBudget: number
  optimizationGoal: string
  billingEvent: string
  bidStrategy: string
  targetingsummary: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpm: number
  cpc: number
  reach: number
  frequency: number
  leadFormFills: number
  websiteLeads: number
  totalConversions: number
  costPerConversion: number
}

export interface MetaAd {
  id: string
  adSetId: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  creativeType: 'image' | 'video' | 'carousel' | 'collection' | 'other'
  previewUrl: string | null
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  leadFormFills: number
  websiteLeads: number
  totalConversions: number
  costPerConversion: number
}

export interface MetaDemographicBreakdown {
  ageGender: Array<{
    age: string
    gender: string
    spend: number
    impressions: number
    clicks: number
    conversions: number
  }>
}

export interface MetaPlacementBreakdown {
  placements: Array<{
    placement: string        // "facebook_feed", "instagram_feed", "reels", "stories"
    spend: number
    impressions: number
    clicks: number
    ctr: number
    conversions: number
    costPerConversion: number
  }>
}

export interface MetaDailyTrend {
  date: string
  spend: number
  impressions: number
  clicks: number
  leadFormFills: number
  websiteLeads: number
  totalConversions: number
  ctr: number
  cpc: number
}

// ── GOOGLE ADS TYPES ──────────────────────────────────────

export interface GoogleAccountOverview {
  customerId: string
  accountName: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  avgCpc: number
  conversions: number
  costPerConversion: number
  conversionRate: number
  searchImpressionShare: number
  formSubmissions: number
  phoneCalls: number
  websiteConversions: number
  costPerFormSubmission: number
  costPerCall: number
  totalDailyBudget: number
  totalSpentToday: number
  budgetAlerts: AdsBudgetAlert[]
  lastRefreshedAt?: string
  nextRefreshAt?: string
  isCached?: boolean
}

export interface GoogleCampaign {
  id: string
  name: string
  status: 'ENABLED' | 'PAUSED' | 'REMOVED'
  type: 'SEARCH' | 'DISPLAY' | 'PERFORMANCE_MAX' | 'VIDEO' | 'SHOPPING' | 'SMART'
  dailyBudget: number
  spentToday: number
  budgetRemaining: number
  budgetPercentUsed: number
  biddingStrategy: string
  targetCpa: number | null
  targetRoas: number | null
  spend: number
  impressions: number
  clicks: number
  ctr: number
  avgCpc: number
  conversions: number
  costPerConversion: number
  conversionRate: number
  searchImpressionShare: number
}

export interface GoogleAdGroup {
  id: string
  campaignId: string
  name: string
  status: 'ENABLED' | 'PAUSED' | 'REMOVED'
  type: string
  cpcBidMicros: number
  spend: number
  impressions: number
  clicks: number
  ctr: number
  avgCpc: number
  conversions: number
  costPerConversion: number
  conversionRate: number
}

export interface GoogleKeyword {
  id: string
  adGroupId: string
  text: string
  matchType: 'BROAD' | 'PHRASE' | 'EXACT'
  status: 'ENABLED' | 'PAUSED' | 'REMOVED'
  qualityScore: number | null
  expectedCtr: string | null
  adRelevance: string | null
  landingPageExp: string | null
  cpcBidMicros: number
  spend: number
  impressions: number
  clicks: number
  ctr: number
  avgCpc: number
  conversions: number
  costPerConversion: number
  conversionRate: number
}

export interface GoogleSearchTerm {
  searchTerm: string
  matchType: string
  campaignName: string
  adGroupName: string
  impressions: number
  clicks: number
  ctr: number
  avgCpc: number
  spend: number
  conversions: number
  costPerConversion: number
}

export interface GoogleAd {
  id: string
  adGroupId: string
  type: string
  status: 'ENABLED' | 'PAUSED' | 'REMOVED'
  headlines: string[]
  descriptions: string[]
  finalUrls: string[]
  spend: number
  impressions: number
  clicks: number
  ctr: number
  avgCpc: number
  conversions: number
  costPerConversion: number
}

export interface GoogleDeviceBreakdown {
  devices: Array<{
    device: 'MOBILE' | 'DESKTOP' | 'TABLET'
    spend: number
    impressions: number
    clicks: number
    ctr: number
    conversions: number
    costPerConversion: number
  }>
}

export interface GoogleGeoBreakdown {
  locations: Array<{
    city: string
    state: string
    spend: number
    clicks: number
    conversions: number
  }>
}

export interface GoogleDailyTrend {
  date: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  avgCpc: number
  costPerConversion: number
}

// ── COMBINED TYPES ────────────────────────────────────────

export interface AdsCombinedOverview {
  dateRange: AdsDateRange
  totalSpend: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalLeads: number
  avgCostPerLead: number
  overallCTR: number
  overallCPC: number
  metaSpend: number
  googleSpend: number
  metaConversions: number
  googleConversions: number
  metaCPL: number
  googleCPL: number
  metaLeadFormFills: number
  metaWebsiteLeads: number
  metaLeadFormCPL: number
  metaWebsiteLeadCPL: number
  googleFormSubmissions: number
  googlePhoneCalls: number
  budgetAlerts: AdsBudgetAlert[]
  lastRefreshedAt: string
  nextRefreshAt: string
}

// ── TELECRM TYPES ─────────────────────────────────────────

export type LeadCategory =
  | 'Enrolled'
  | 'High Potential'
  | 'Medium Potential'
  | 'Fresh/Unqualified'
  | 'Low/Cold'

export type LeadChannel =
  | 'Organic'
  | 'Website'
  | 'Google Ads'
  | 'Meta Ads'
  | 'Referral'
  | 'SOT'
  | 'LLM'
  | 'Other'

export interface TeleCRMLead {
  id: string
  status: string                    // raw TeleCRM status
  employeeid: string                // assigned agent email
  createdBy: string
  fields: {
    name: string
    phone: string
    email?: string
    course?: string
    lead_source_1?: string
    lead_date?: number              // Unix ms
    created_on: number              // Unix ms
    modified_on: number             // Unix ms
    course_fee?: string
    amount_paid?: string
    amount_paid_emi_2?: string
    batch_number?: number
    mode_of_training?: string
    remarks?: string
    utmsource?: string
    utmcampaign?: string
    utmmedium?: string
    utmcontent?: string
    utmterm?: string
    referrer?: string
    fbclid?: string
    google_gcl_id?: string
    gclid?: string
    course_enrollment_date?: number
  }
  rating: number
  isArchived: boolean
  isSpam: boolean
}

export interface LeadsMonthlyTrend {
  month: string                     // "May 2026"
  monthStart: Date
  totalLeads: number
  enrolled: number
  highPotential: number
  mediumPotential: number
  freshUnqualified: number
  lowCold: number
  websiteLeads: number
  organicLeads: number
  googleAdsLeads: number
  metaAdsLeads: number
  referralLeads: number
  convRate: number                  // enrolled / total * 100
  scmLeads?: number
  hcmLeads?: number
  financialsLeads?: number
  techOicLeads?: number
  ppmLeads?: number
  sapEbsOthersLeads?: number
  llmLeads?: number
  chatgptLeads?: number
  perplexityLeads?: number
  courses?: Record<string, number>
}

export interface LeadsFunnelData {
  total: number
  enrolled: number
  highPotential: number
  mediumPotential: number
  freshUnqualified: number
  lowCold: number
  enrolledPct: number
  highPotentialPct: number
  mediumPotentialPct: number
  freshUnqualifiedPct: number
  lowColdPct: number
  convRate: number
  // Raw stage breakdown (for drill-down)
  stageBreakdown: Record<string, number>
}

export interface LeadsCourseBreakdown {
  courseName: string                // display name
  rawCourses: string[]              // raw TeleCRM course values in this group
  total: number
  enrolled: number
  highPotential: number
  mediumPotential: number
  freshUnqualified: number
  lowCold: number
  websiteLeads: number
  organicLeads: number
  googleAdsLeads: number
  metaAdsLeads: number
  adsLeads: number
  llmLeads: number
  convRate: number
  sharePercent: number
}

export interface LeadsChannelBreakdown {
  channel: LeadChannel
  total: number
  enrolled: number
  highPotential: number
  convRate: number
  sharePercent: number
}

export interface LiveLeadsKPI {
  // Current period
  totalLeads: number
  enrolled: number
  highPotential: number
  mediumPotential: number
  freshUnqualified: number
  lowCold: number
  convRate: number
  websiteLeads: number
  organicLeads: number
  llmLeads?: number
  googleAdsLeads: number
  metaAdsLeads: number
  // Previous period (for delta)
  prevTotalLeads: number
  prevEnrolled: number
  prevHighPotential: number
  prevConvRate: number
  prevWebsiteLeads?: number
  prevOrganicLeads?: number
  prevLLMLeads?: number
  // Metadata
  periodLabel: string
  prevPeriodLabel: string
  lastRefreshedAt: string
  dataSource: 'telecrm'
}

export interface TeleCRMAction {
  id: string
  type: 'OUTGOING_CALL' | 'INCOMING_CALL' | 'FOLLOW_UP' | 'NOTE' | 'WHATSAPP' | 'EMAIL'
  performedBy: string        // agent email
  performedAt: number        // Unix ms timestamp
  duration?: number          // call duration in seconds
  outcome?: string           // call outcome
  note?: string
}

export interface ScoreFactor {
  factor: string
  impact: number    // positive or negative
  reason: string
}

export interface LeadScore {
  leadId: string
  score: number
  category: 'high' | 'medium' | 'low' | 'very_low'
  factors: ScoreFactor[]
}

export interface LeadResponseData {
  leadId: string
  createdOn: number
  firstContactAt: number | null
  responseTimeHours: number | null
  responseCategory: 'under_1h' | '1_4h' | '4_24h' | 'over_24h' | 'never'
  channel: LeadChannel
  status: string
  isEnrolled: boolean
  assignedAgent: string
}

export interface PipelineValue {
  category: LeadCategory
  count: number
  avgFee: number
  totalValue: number           // count × avgFee
  convRate: number             // historical conv rate for this category
  expectedValue: number        // totalValue × convRate
  weightedValue: number        // conservative estimate
}

export interface AgeBucket {
  label: string
  min: number
  max: number
  action: string
  color: string
}

// ── GA4 ANALYTICS TYPES ─────────────────────────────────────

export interface GA4Overview {
  sessions: number
  totalUsers: number
  newUsers: number
  returningUsers: number
  bounceRate: number
  avgSessionDuration: number
  pageViews: number
  conversions: number
  conversionRate: number
  prevSessions: number
  prevConversions: number
  prevBounceRate: number
  sessionsDelta?: number
  conversionsDelta?: number
  bounceRateDelta?: number
}

export interface GA4TrafficSource {
  channelGroup: string
  source: string
  medium: string
  sessions: number
  users: number
  newUsers: number
  bounceRate: number
  avgSessionDuration: number
  conversions: number
  conversionRate: number
  shareOfSessions: number
}

export interface GA4LandingPage {
  pagePath: string
  pageTitle: string
  sessions: number
  users: number
  bounceRate: number
  avgSessionDuration: number
  conversions: number
  conversionRate: number
  engagedSessions: number
  engagementRate: number
  courseGroup: string | null
  isCoursePage: boolean
}

export interface GA4PagePath {
  pagePath: string
  pageTitle: string
  pageViews: number
  users: number
  avgTimeOnPage: number
  bounceRate: number
  exits: number
  exitRate: number
}

export interface GA4DeviceData {
  device: string
  sessions: number
  users: number
  bounceRate: number
  conversions: number
  conversionRate: number
  avgSessionDuration: number
}

export interface GA4GeoData {
  city: string
  region: string
  sessions: number
  users: number
  conversions: number
  conversionRate: number
}

export interface GA4ConversionData {
  eventName: string
  channelGroup: string
  eventCount: number
  users: number
  conversionRate: number
}

export interface GA4DailyPoint {
  date: string
  sessions: number
  users: number
  newUsers: number
  conversions: number
  bounceRate: number
}

export interface GA4SourceLandingRow {
  channelGroup: string
  landingPage: string
  sessions: number
  conversions: number
  bounceRate: number
  conversionRate: number
}

export interface GA4ReturningData {
  newUserSessions: number
  returningUserSessions: number
  newUserConversions: number
  returningUserConversions: number
  newUserConvRate: number
  returningUserConvRate: number
  byChannel: Array<{
    channel: string
    newSessions: number
    returningSessions: number
    newConversions: number
    returningConversions: number
  }>
}


