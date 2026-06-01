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
  sheetId: string
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

