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
  enrolled: number
  highPotential: number
  convRate: number
  prevTotalLeads: number
  prevEnrolled: number
  prevConvRate: number
  prevHighPotential: number
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
  enrolled: number
  highPotential: number
  mediumPotential: number
  freshUnqualified: number
  lowCold: number
  convRate: number
}





