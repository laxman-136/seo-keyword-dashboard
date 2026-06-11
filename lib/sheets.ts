// lib/sheets.ts
import { KeywordRow, MonthData, TrafficRow, TrafficSource, TrafficCountry } from './types'
import { SiteStatusRow, SiteStatusPageRow, SiteStatusPageResult } from './types'
import { LeadsMonthlyRow, LeadsDetailRow, LeadsCourseAggregate, LeadsFunnelData, LeadsKPI, LeadsTrendPoint, LeadsChannelSplit, LeadsQuarterlyDetailRow, LeadsYearlyDetailRow } from './types'
import { 
  RevenueMonthlyRow, 
  RevenueCourseRow, 
  RevenueKPI, 
  RevenueSourceBreakdown, 
  RevenueCourseAggregate, 
  AdSpendBreakdown, 
  RevenueTrendPoint,
  RevenueQuarterlyRow,
  RevenueYearlyRow,
  RevenueQuarterlyDetailRow,
  RevenueYearlyDetailRow
} from './types'
import { detectMonths, TRAFFIC_SOURCES, TRAFFIC_COUNTRIES } from './calculations'
import { getMockSheetsResponse } from './mockData'
import { getMockTrafficSheetsResponse } from './mockTrafficData'
import { getMockLeadsMonthlyResponse, getMockLeadsDetailResponse } from './mockLeadsData'
import { getMockRevenueMonthlyResponse, getMockRevenueCoursesResponse } from './mockRevenueData'

/**
 * Defensive parser that converts raw Google Sheets values grid to KeywordRow[]
 */
export function parseSheetGrid(values: string[][]): {
  rows: KeywordRow[];
  months: string[];
} {
  if (!values || values.length === 0) {
    return { rows: [], months: [] }
  }

  const headers = values[0]
  const months = detectMonths(headers)

  // Find column indices defensively
  const keywordIdx = headers.findIndex(h => h.toLowerCase() === 'keyword')
  const groupIdx = headers.findIndex(h => h.toLowerCase() === 'group')
  const statusIdx = headers.findIndex(h => h.toLowerCase() === 'status')
  const priorityIdx = headers.findIndex(h => h.toLowerCase() === 'priority')
  const notesIdx = headers.findIndex(h => h.toLowerCase() === 'notes')

  const rows: KeywordRow[] = []

  // Iterate over row values
  for (let i = 1; i < values.length; i++) {
    const row = values[i]
    if (!row || row.length === 0) continue

    // Safe retrieve helper
    const getCell = (idx: number, fallback = ''): string => {
      if (idx < 0 || idx >= row.length) return fallback
      return row[idx]?.trim() ?? fallback
    }

    const keyword = getCell(keywordIdx)
    if (!keyword) continue // Skip empty rows

    const group = getCell(groupIdx, 'Uncategorized')
    const status = getCell(statusIdx, 'Not Ranking')
    const priority = getCell(priorityIdx, 'Low')
    const notes = getCell(notesIdx, '')

    // Extract monthly data
    const monthlyData: Record<string, MonthData> = {}
    months.forEach(month => {
      const pageHeader = `${month} Page`
      const posHeader = `${month} Position`

      const pageColIdx = headers.findIndex(h => h === pageHeader)
      const posColIdx = headers.findIndex(h => h === posHeader)

      const pageStr = getCell(pageColIdx, '0')
      const posStr = getCell(posColIdx, '0')

      const page = parseInt(pageStr, 10) || 0
      const position = parseInt(posStr, 10) || 0

      monthlyData[month] = { page, position }
    })

    rows.push({
      keyword,
      group,
      monthlyData,
      status,
      priority,
      notes
    })
  }

  return { rows, months }
}

/**
 * Main fetch function with seamless fallback to mock data
 */
export async function fetchKeywordData(
  bypassCache = false,
  customSheetId?: string,
  customApiKey?: string
): Promise<{
  rows: KeywordRow[];
  months: string[];
  isMock: boolean;
  lastUpdated: string;
  fallbackReason?: string;
}> {
  const isForcedMock = customSheetId === 'mock'
  const sheetId = isForcedMock ? undefined : (customSheetId || process.env.GOOGLE_SHEET_ID)
  const apiKey = isForcedMock ? undefined : (customApiKey || process.env.GOOGLE_SHEETS_API_KEY)

  const nowString = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata', // Local Time context
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  // If environment variables are missing, fallback instantly to mock data
  if (!sheetId || !apiKey) {
    console.warn('Google Sheets API credentials missing. Falling back to local mock data.')
    const mockGrid = getMockSheetsResponse()
    const { rows, months } = parseSheetGrid(mockGrid.values)
    return {
      rows,
      months,
      isMock: true,
      lastUpdated: nowString,
      fallbackReason: 'No Google Sheets configuration was found. The dashboard is using demo data.'
    }
  }

  try {
    const data = await fetchSheetValues(sheetId, apiKey, 'Keywords', bypassCache)
    const { rows, months } = parseSheetGrid(data)

    if (rows.length === 0) {
      console.warn('Keywords sheet exists but is empty. Falling back to mock data.')
      const mockGrid = getMockSheetsResponse()
      const fallback = parseSheetGrid(mockGrid.values)
      return {
        rows: fallback.rows,
        months: fallback.months,
        isMock: true,
        lastUpdated: nowString,
        fallbackReason: 'Keywords sheet is empty (only headers found). Showing demo data.'
      }
    }

    return {
      rows,
      months,
      isMock: false,
      lastUpdated: nowString
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Failed to fetch from Google Sheets API. Falling back to mock data.', error)
    const mockGrid = getMockSheetsResponse()
    const { rows, months } = parseSheetGrid(mockGrid.values)
    return {
      rows,
      months,
      isMock: true,
      lastUpdated: nowString,
      fallbackReason: `Live Sheets failed: ${message}`
    }
  }
}

interface CacheEntry {
  values: string[][]
  timestamp: number
}
const sheetsCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes cache

export async function fetchSheetValues(
  sheetId: string,
  apiKey: string,
  sheetName: string,
  bypassCache: boolean
): Promise<string[][]> {
  const cacheKey = `${sheetId}::${sheetName}`

  if (!bypassCache) {
    const cached = sheetsCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return cached.values
    }
  }

  const cacheBuster = bypassCache ? `&t=${Date.now()}` : ''
  const fetchOptions: RequestInit = bypassCache
    ? { cache: 'no-store' }
    : { next: { revalidate: 3600 } }

  const attemptFetch = async (name: string): Promise<string[][]> => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(name)}?key=${apiKey}${cacheBuster}`
    const res = await fetch(url, fetchOptions)
    if (!res.ok) {
      throw new Error(`Google Sheets API responded with status ${res.status} for sheet ${name}`)
    }
    const data = await res.json()
    const values = data.values ?? []

    // Save to cache
    sheetsCache.set(cacheKey, { values, timestamp: Date.now() })

    return values
  }

  try {
    return await attemptFetch(sheetName)
  } catch (primaryError) {
    // If the requested sheet name is missing, try a case-insensitive/normalized match.
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties.title&key=${apiKey}${cacheBuster}`
    const metaRes = await fetch(metaUrl, fetchOptions)
    if (!metaRes.ok) {
      throw primaryError
    }

    const meta = await metaRes.json()
    const sheets = meta.sheets ?? []
    const titles: string[] = sheets.map((sheet: any) => sheet?.properties?.title).filter(Boolean)

    const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '')
    const target = normalize(sheetName)

    const matchedTitle = titles.find(title => normalize(title) === target)
    const firstSheetTitle = matchedTitle || titles[0]
    if (!firstSheetTitle) {
      throw primaryError
    }

    return await attemptFetch(firstSheetTitle)
  }
}

/**
 * Defensive parser that converts raw Google Sheets Traffic grid to TrafficRow[]
 */
export function parseTrafficSheetGrid(values: string[][]): TrafficRow[] {
  if (!values || values.length === 0) return []

  const headers = values[0]
  
  // Find column indices defensively
  const monthIdx = headers.findIndex(h => h.toLowerCase() === 'month')
  const totalUsersIdx = headers.findIndex(h => h.toLowerCase() === 'total users')
  const newUsersIdx = headers.findIndex(h => h.toLowerCase() === 'new users')

  const monthsArray = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const rows: TrafficRow[] = []

  for (let i = 1; i < values.length; i++) {
    const row = values[i]
    if (!row || row.length === 0) continue

    const getCell = (idx: number, fallback = ''): string => {
      if (idx < 0 || idx >= row.length) return fallback
      return row[idx]?.trim() ?? fallback
    }

    const monthRaw = getCell(monthIdx)
    if (!monthRaw) continue

    // Determine Date & Standard Month label
    let date = new Date()
    let monthLabel = monthRaw

    if (monthRaw.includes('-')) {
      const parts = monthRaw.split('-')
      const mName = parts[0]
      const yStr = parts[1]
      const mIdx = monthsArray.findIndex(m => m.toLowerCase() === mName.toLowerCase())
      const year = parseInt(yStr, 10) || 2024
      date = new Date(year, mIdx >= 0 ? mIdx : 0, 1)
      // Normalize to "MonthName-Year"
      monthLabel = `${monthsArray[date.getMonth()]}-${date.getFullYear()}`
    } else {
      // Fallback for native dates e.g. "1/1/2024" or ISO
      const parsedDate = new Date(monthRaw)
      if (!isNaN(parsedDate.getTime())) {
        date = parsedDate
        monthLabel = `${monthsArray[date.getMonth()]}-${date.getFullYear()}`
      }
    }

    const totalUsers = parseInt(getCell(totalUsersIdx), 10) || 0
    const newUsers = parseInt(getCell(newUsersIdx), 10) || 0

    // Sources mapping
    const sources = {} as Record<TrafficSource, number>
    TRAFFIC_SOURCES.forEach(s => {
      const colIdx = headers.findIndex(h => h.toLowerCase() === s.toLowerCase())
      sources[s] = parseInt(getCell(colIdx), 10) || 0
    })

    // Countries mapping
    const countries = {} as Record<TrafficCountry, number>
    TRAFFIC_COUNTRIES.forEach(c => {
      const colIdx = headers.findIndex(h => h.toLowerCase() === c.toLowerCase())
      countries[c] = parseInt(getCell(colIdx), 10) || 0
    })

    rows.push({
      month: monthLabel,
      date,
      totalUsers,
      newUsers,
      sources,
      countries
    })
  }

  // Return chronologically sorted rows
  return rows.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * Fetches and parses traffic analytics data
 */
export async function fetchTrafficData(
  bypassCache = false,
  customSheetId?: string,
  customApiKey?: string
): Promise<{
  rows: TrafficRow[];
  isMock: boolean;
  lastUpdated: string;
  fallbackReason?: string;
}> {
  const isForcedMock = customSheetId === 'mock'
  const sheetId = isForcedMock ? undefined : (customSheetId || process.env.GOOGLE_SHEET_ID)
  const apiKey = isForcedMock ? undefined : (customApiKey || process.env.GOOGLE_SHEETS_API_KEY)
  
  const nowString = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  // If environment variables are missing, fallback instantly to mock data
  if (!sheetId || !apiKey) {
    console.warn('Google Sheets API credentials missing. Falling back to local mock traffic data.')
    const mockGrid = getMockTrafficSheetsResponse()
    const rows = parseTrafficSheetGrid(mockGrid.values)
    return {
      rows,
      isMock: true,
      lastUpdated: nowString,
      fallbackReason: 'No Google Sheets configuration was found. Traffic is using demo data.'
    }
  }

  try {
    const data = await fetchSheetValues(sheetId, apiKey, 'Traffic', bypassCache)
    const rows = parseTrafficSheetGrid(data)

    if (rows.length === 0) {
      console.warn('Traffic sheet exists but is empty. Falling back to mock data.')
      const mockGrid = getMockTrafficSheetsResponse()
      return {
        rows: parseTrafficSheetGrid(mockGrid.values),
        isMock: true,
        lastUpdated: nowString,
        fallbackReason: 'Traffic sheet is empty (only headers found). Showing demo data.'
      }
    }

    return {
      rows,
      isMock: false,
      lastUpdated: nowString
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Failed to fetch from Google Sheets API (Traffic). Falling back to mock data.', error)
    const mockGrid = getMockTrafficSheetsResponse()
    const rows = parseTrafficSheetGrid(mockGrid.values)
    return {
      rows,
      isMock: true,
      lastUpdated: nowString,
      fallbackReason: `Live Sheets failed: ${message}`
    }
  }
}

/**
 * Defensive parser that converts raw Google Sheets Site Status grid to SiteStatusRow[]
 */
export function parseSiteStatusGrid(values: string[][]): SiteStatusRow[] {
  if (!values || values.length === 0) return []

  const headers = values[0]
  const monthIdx = headers.findIndex(h => h.toLowerCase() === 'month')
  const dateIdx = headers.findIndex(h => h.toLowerCase() === 'date')
  const pagesIdx = headers.findIndex(h => h.toLowerCase() === 'pages')
  const domainRatingIdx = headers.findIndex(h => h.toLowerCase() === 'domain rating')
  const backlinksIdx = headers.findIndex(h => h.toLowerCase() === 'backlinks')
  const referringIdx = headers.findIndex(h => h.toLowerCase() === 'referring domains')
  const daIdx = headers.findIndex(h => h.toLowerCase() === 'da')
  const paIdx = headers.findIndex(h => h.toLowerCase() === 'pa')

  const rows: SiteStatusRow[] = []

  for (let i = 1; i < values.length; i++) {
    const row = values[i]
    if (!row || row.length === 0) continue

    const getCell = (idx: number, fallback = ''): string => {
      if (idx < 0 || idx >= row.length) return fallback
      return row[idx]?.trim() ?? fallback
    }

    const monthRaw = getCell(monthIdx)
    if (!monthRaw) continue

    let date = new Date()
    let monthLabel = monthRaw
    const parsedDate = new Date(getCell(dateIdx, ''))
    if (!isNaN(parsedDate.getTime())) {
      date = parsedDate
      const opts = { month: 'long' as const, year: 'numeric' as const }
      monthLabel = `${date.toLocaleString('en-US', opts).split(' ')[0]}-${date.getFullYear()}`
    }

    const pages = parseInt(getCell(pagesIdx), 10) || 0
    const domainRating = parseFloat(getCell(domainRatingIdx)) || undefined
    const backlinks = parseInt(getCell(backlinksIdx), 10) || undefined
    const referringDomains = parseInt(getCell(referringIdx), 10) || undefined
    const da = parseFloat(getCell(daIdx)) || undefined
    const pa = parseFloat(getCell(paIdx)) || undefined

    rows.push({
      month: monthLabel,
      date,
      pages,
      domainRating,
      backlinks,
      referringDomains,
      da,
      pa
    })
  }

  return rows.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * Parse grouped single-row headers like "May-2025 Domain Rating", first column 'Page'
 */
export function parseSiteStatusGroupedGrid(values: string[][]): { rows: SiteStatusPageRow[]; months: string[] } {
  if (!values || values.length === 0) return { rows: [], months: [] }

  const headers = values[0]
  if (!headers || headers.length < 2) return { rows: [], months: [] }

  // Identify mapping of column index -> { month, metric }
  type ColInfo = { month: string; metricKey: string }
  const cols: (ColInfo | null)[] = []
  const monthsSet: string[] = []

  for (let c = 0; c < headers.length; c++) {
    const h = (headers[c] || '').trim()
    if (c === 0) { cols.push(null); continue }
    // Expect format: "May-2025 Metric Name"
    const m = h.match(/^(.+?)\s+(.+)$/)
    if (!m) { cols.push(null); continue }
    const month = m[1].trim()
    const metric = m[2].trim().toLowerCase()
    let metricKey = ''
    if (metric.includes('domain rating')) metricKey = 'domainRating'
    else if (metric.includes('backlink')) metricKey = 'backlinks'
    else if (metric.includes('referring')) metricKey = 'referringDomains'
    else if (metric === 'da') metricKey = 'da'
    else if (metric === 'pa') metricKey = 'pa'
    else metricKey = metric.replace(/\s+/g, '_')

    if (!monthsSet.includes(month)) monthsSet.push(month)
    cols.push({ month, metricKey })
  }

  const rows: SiteStatusPageRow[] = []
  for (let r = 1; r < values.length; r++) {
    const row = values[r]
    if (!row || row.length === 0) continue
    const page = (row[0] || '').trim()
    if (!page) continue
    const monthlyData: Record<string, any> = {}
    for (let c = 1; c < headers.length; c++) {
      const info = cols[c]
      if (!info) continue
      const raw = (row[c] || '').toString().trim()
      if (raw === '') continue
      const num = Number(raw.replace(/,/g, ''))
      const val = isNaN(num) ? raw : num
      monthlyData[info.month] = monthlyData[info.month] || {}
      monthlyData[info.month][info.metricKey] = val
    }
    rows.push({ page, monthlyData })
  }

  // Ensure months are chronological if possible by parsing month-year
  const sortedMonths = monthsSet.sort((a, b) => {
    const pa = a.split('-'), pb = b.split('-')
    const ma = pa[0], ya = parseInt(pa[1] || '0')
    const mb = pb[0], yb = parseInt(pb[1] || '0')
    const monthsMap: Record<string, number> = { january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11 }
    const ia = monthsMap[ma.toLowerCase()] ?? 0
    const ib = monthsMap[mb.toLowerCase()] ?? 0
    if (ya !== yb) return ya - yb
    return ia - ib
  })

  return { rows, months: sortedMonths }
}

/**
 * Fetches and parses site status data
 */
export async function fetchSiteStatusData(
  bypassCache = false,
  customSheetId?: string,
  customApiKey?: string
): Promise<SiteStatusPageResult | {
  rows: SiteStatusRow[];
  isMock: boolean;
  lastUpdated: string;
  fallbackReason?: string;
}> {
  const isForcedMock = customSheetId === 'mock'
  const sheetId = isForcedMock ? undefined : (customSheetId || process.env.GOOGLE_SHEET_ID)
  const apiKey = isForcedMock ? undefined : (customApiKey || process.env.GOOGLE_SHEETS_API_KEY)

  const nowString = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  if (!sheetId || !apiKey) {
    console.warn('Google Sheets API credentials missing. Falling back to demo site status data.')
    const mockData = getMockSiteStatusPageData()
    return { rows: mockData.rows, months: mockData.months, isMock: true, lastUpdated: nowString, fallbackReason: 'No Google Sheets configuration was found. Site Status is using demo data.' }
  }

  try {
    const data = await fetchSheetValues(sheetId, apiKey, 'SiteStatus', bypassCache)
    // Detect grouped header (first cell 'Page')
    const headers = (data && data[0]) ? data[0] : []
    if (headers && headers[0] && String(headers[0]).toLowerCase().trim() === 'page') {
      const parsed = parseSiteStatusGroupedGrid(data)
      if (parsed.rows.length === 0) {
        const mockData = getMockSiteStatusPageData()
        return { rows: mockData.rows, months: mockData.months, isMock: true, lastUpdated: nowString, fallbackReason: 'Site Status sheet had no rows; using demo data.' }
      }
      return { rows: parsed.rows, months: parsed.months, isMock: false, lastUpdated: nowString }
    }

    // Fallback to row-per-month parser
    const rows = parseSiteStatusGrid(data)
    if (rows.length === 0) {
      const mockData = getMockSiteStatusPageData()
      return { rows: mockData.rows, months: mockData.months, isMock: true, lastUpdated: nowString, fallbackReason: 'Site Status sheet had no rows; using demo data.' }
    }
    return { rows, months: [], isMock: false, lastUpdated: nowString }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Failed to fetch Site Status from Google Sheets API. Falling back to demo data.', error)
    const mockData = getMockSiteStatusPageData()
    return { rows: mockData.rows, months: mockData.months, isMock: true, lastUpdated: nowString, fallbackReason: `Live Sheets failed: ${message}` }
  }
}

function getMockSiteStatusPageData(): { rows: SiteStatusPageRow[]; months: string[] } {
  const months = ['July-2024', 'August-2024', 'September-2024']
  return {
    months,
    rows: [
      {
        page: 'Home Page',
        monthlyData: {
          'July-2024': { domainRating: 38, backlinks: 4200, referringDomains: 367, da: 53, pa: 38 },
          'August-2024': { domainRating: 39, backlinks: 4350, referringDomains: 379, da: 54, pa: 39 },
          'September-2024': { domainRating: 39, backlinks: 4420, referringDomains: 385, da: 54, pa: 40 }
        }
      },
      {
        page: 'Oracle Fusion SCM',
        monthlyData: {
          'July-2024': { domainRating: 38, backlinks: 918, referringDomains: 145, da: 53, pa: 40 },
          'August-2024': { domainRating: 38, backlinks: 930, referringDomains: 150, da: 53, pa: 41 },
          'September-2024': { domainRating: 38, backlinks: 945, referringDomains: 155, da: 53, pa: 41 }
        }
      },
      {
        page: 'Oracle Fusion HCM',
        monthlyData: {
          'July-2024': { domainRating: 38, backlinks: 606, referringDomains: 112, da: 53, pa: 39 },
          'August-2024': { domainRating: 38, backlinks: 620, referringDomains: 118, da: 53, pa: 39 },
          'September-2024': { domainRating: 38, backlinks: 634, referringDomains: 122, da: 53, pa: 40 }
        }
      }
    ]
  }
}

// ── LEADS DATA PARSING & FETCHING ──────────────────────────

export const LEADS_MONTHLY_SHEET = "Leads Monthly"
export const LEADS_DETAIL_SHEET  = "Leads Detail"

export const LEAD_COURSES = [
  "Oracle Fusion SCM",
  "Oracle Fusion HCM",
  "Oracle Fusion Financials",
  "Oracle Fusion Tech + OIC",
  "Oracle Fusion PPM",
  "SAP / EBS / Others"
]

export const STATUS_GROUPS = [
  "Enrolled",
  "High Potential",
  "Medium Potential",
  "Fresh/Unqualified",
  "Low/Cold"
]

// Status group colors (consistent everywhere)
export const STATUS_COLORS = {
  "Enrolled":           "#16a34a",  // green
  "High Potential":     "#2563eb",  // blue
  "Medium Potential":   "#ca8a04",  // yellow
  "Fresh/Unqualified":  "#6b7280",  // gray
  "Low/Cold":           "#dc2626",  // red
}

// Helper to parse "Month Year" (e.g. "May 2026") to Date defensively
function parseLeadsMonthYear(monthStr: string): Date {
  if (!monthStr) return new Date(0)
  const parts = monthStr.trim().split(/\s+/)
  if (parts.length < 2) {
    const d = new Date(monthStr)
    return isNaN(d.getTime()) ? new Date(0) : d
  }
  const mName = parts[0].toLowerCase()
  const yNum = parseInt(parts[1], 10) || 2026
  const monthsMap: Record<string, number> = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
    may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, september: 8,
    oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
  }
  const mIdx = monthsMap[mName] ?? 0
  return new Date(yNum, mIdx, 1)
}

export function parseLeadsMonthlyGrid(values: string[][]): LeadsMonthlyRow[] {
  if (!values || values.length === 0) return []
  const headers = values[0].map(h => (h || '').trim().toLowerCase())

  const colIdx = {
    month: headers.indexOf('month'),
    totalLeads: headers.indexOf('total leads'),
    websiteLeads: headers.indexOf('website leads'),
    organicLeads: headers.indexOf('organic leads'),
    llmLeads: headers.indexOf('llm leads'),
    chatgptLeads: headers.indexOf('chatgpt leads'),
    perplexityLeads: headers.indexOf('perplexity leads'),
    scmLeads: headers.indexOf('scm leads'),
    hcmLeads: headers.indexOf('hcm leads'),
    financialsLeads: headers.indexOf('financials leads'),
    techOicLeads: headers.indexOf('tech oic leads'),
    ppmLeads: headers.indexOf('ppm leads'),
    sapEbsOthersLeads: headers.indexOf('sap ebs others leads'),
    enrolled: headers.indexOf('enrolled'),
    highPotential: headers.indexOf('high potential'),
    mediumPotential: headers.indexOf('medium potential'),
    freshUnqualified: headers.indexOf('fresh unqualified'),
    lowCold: headers.indexOf('low cold'),
    convRate: headers.indexOf('conv rate')
  }

  const rows: LeadsMonthlyRow[] = []

  for (let i = 1; i < values.length; i++) {
    const row = values[i]
    if (!row || row.length === 0) continue

    const getCell = (idx: number, fallback = ''): string => {
      if (idx < 0 || idx >= row.length) return fallback
      return row[idx]?.trim() ?? fallback
    }

    const month = getCell(colIdx.month)
    if (!month) continue

    const totalLeads = parseInt(getCell(colIdx.totalLeads), 10) || 0
    if (totalLeads === 0) continue // Skip empty rows

    rows.push({
      month,
      totalLeads,
      websiteLeads: parseInt(getCell(colIdx.websiteLeads), 10) || 0,
      organicLeads: parseInt(getCell(colIdx.organicLeads), 10) || 0,
      llmLeads: parseInt(getCell(colIdx.llmLeads), 10) || 0,
      chatgptLeads: parseInt(getCell(colIdx.chatgptLeads), 10) || 0,
      perplexityLeads: parseInt(getCell(colIdx.perplexityLeads), 10) || 0,
      scmLeads: parseInt(getCell(colIdx.scmLeads), 10) || 0,
      hcmLeads: parseInt(getCell(colIdx.hcmLeads), 10) || 0,
      financialsLeads: parseInt(getCell(colIdx.financialsLeads), 10) || 0,
      techOicLeads: parseInt(getCell(colIdx.techOicLeads), 10) || 0,
      ppmLeads: parseInt(getCell(colIdx.ppmLeads), 10) || 0,
      sapEbsOthersLeads: parseInt(getCell(colIdx.sapEbsOthersLeads), 10) || 0,
      enrolled: parseInt(getCell(colIdx.enrolled), 10) || 0,
      highPotential: parseInt(getCell(colIdx.highPotential), 10) || 0,
      mediumPotential: parseInt(getCell(colIdx.mediumPotential), 10) || 0,
      freshUnqualified: parseInt(getCell(colIdx.freshUnqualified), 10) || 0,
      lowCold: parseInt(getCell(colIdx.lowCold), 10) || 0,
      convRate: parseFloat(getCell(colIdx.convRate)) || 0
    })
  }

  return rows.sort((a, b) => parseLeadsMonthYear(a.month).getTime() - parseLeadsMonthYear(b.month).getTime())
}

export function parseLeadsDetailGrid(values: string[][]): LeadsDetailRow[] {
  if (!values || values.length === 0) return []
  const headers = values[0].map(h => (h || '').trim().toLowerCase())

  const colIdx = {
    month: headers.indexOf('month'),
    courseName: headers.indexOf('course name'),
    enrolled: headers.indexOf('enrolled'),
    highPotential: headers.indexOf('high potential'),
    mediumPotential: headers.indexOf('medium potential'),
    freshUnqualified: headers.indexOf('fresh unqualified'),
    lowCold: headers.indexOf('low cold'),
    total: headers.indexOf('total'),
    organic: headers.indexOf('organic'),
    website: headers.indexOf('website')
  }

  const rows: LeadsDetailRow[] = []

  for (let i = 1; i < values.length; i++) {
    const row = values[i]
    if (!row || row.length === 0) continue

    const getCell = (idx: number, fallback = ''): string => {
      if (idx < 0 || idx >= row.length) return fallback
      return row[idx]?.trim() ?? fallback
    }

    const month = getCell(colIdx.month)
    const courseName = getCell(colIdx.courseName)
    if (!month || !courseName) continue

    rows.push({
      month,
      courseName,
      enrolled: parseInt(getCell(colIdx.enrolled), 10) || 0,
      highPotential: parseInt(getCell(colIdx.highPotential), 10) || 0,
      mediumPotential: parseInt(getCell(colIdx.mediumPotential), 10) || 0,
      freshUnqualified: parseInt(getCell(colIdx.freshUnqualified), 10) || 0,
      lowCold: parseInt(getCell(colIdx.lowCold), 10) || 0,
      total: parseInt(getCell(colIdx.total), 10) || 0,
      organic: parseInt(getCell(colIdx.organic), 10) || 0,
      website: parseInt(getCell(colIdx.website), 10) || 0
    })
  }

  return rows
}

export async function fetchLeadsMonthly(
  bypassCache = false,
  customSheetId?: string,
  customApiKey?: string
): Promise<{
  rows: LeadsMonthlyRow[]
  isMock: boolean
  lastUpdated: string
  fallbackReason?: string
}> {
  const isForcedMock = customSheetId === 'mock'
  const sheetId = isForcedMock ? undefined : (customSheetId || process.env.GOOGLE_SHEET_ID)
  const apiKey = isForcedMock ? undefined : (customApiKey || process.env.GOOGLE_SHEETS_API_KEY)

  const nowString = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  if (!sheetId || !apiKey) {
    console.warn('Google Sheets API credentials missing. Falling back to local mock leads monthly data.')
    const mock = getMockLeadsMonthlyResponse()
    return {
      rows: parseLeadsMonthlyGrid(mock.values),
      isMock: true,
      lastUpdated: nowString,
      fallbackReason: 'No Google Sheets credentials configured. Showing demo leads data.'
    }
  }

  try {
    const data = await fetchSheetValues(sheetId, apiKey, LEADS_MONTHLY_SHEET, bypassCache)
    const rows = parseLeadsMonthlyGrid(data)

    // If the Leads Monthly sheet tab doesn't exist yet, fall back to mock
    if (rows.length === 0) {
      const mock = getMockLeadsMonthlyResponse()
      return {
        rows: parseLeadsMonthlyGrid(mock.values),
        isMock: true,
        lastUpdated: nowString,
        fallbackReason: 'Leads Monthly sheet is empty or not yet created. Showing demo data.'
      }
    }

    return {
      rows,
      isMock: false,
      lastUpdated: nowString
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Failed to fetch Leads Monthly. Falling back to mock data.', error)
    const mock = getMockLeadsMonthlyResponse()
    return {
      rows: parseLeadsMonthlyGrid(mock.values),
      isMock: true,
      lastUpdated: nowString,
      fallbackReason: `Live Sheets failed: ${msg}`
    }
  }
}

export async function fetchLeadsDetail(
  bypassCache = false,
  customSheetId?: string,
  customApiKey?: string
): Promise<{
  rows: LeadsDetailRow[]
  isMock: boolean
}> {
  const isForcedMock = customSheetId === 'mock'
  const sheetId = isForcedMock ? undefined : (customSheetId || process.env.GOOGLE_SHEET_ID)
  const apiKey = isForcedMock ? undefined : (customApiKey || process.env.GOOGLE_SHEETS_API_KEY)

  if (!sheetId || !apiKey) {
    const mock = getMockLeadsDetailResponse()
    return {
      rows: parseLeadsDetailGrid(mock.values),
      isMock: true
    }
  }

  try {
    const data = await fetchSheetValues(sheetId, apiKey, LEADS_DETAIL_SHEET, bypassCache)
    const rows = parseLeadsDetailGrid(data)

    // If the Leads Detail sheet tab doesn't exist yet, use mock
    if (rows.length === 0) {
      const mock = getMockLeadsDetailResponse()
      return {
        rows: parseLeadsDetailGrid(mock.values),
        isMock: true
      }
    }

    return {
      rows,
      isMock: false
    }
  } catch (error) {
    console.warn('Leads Detail sheet missing or empty. Returning mock data.', error)
    const mock = getMockLeadsDetailResponse()
    return {
      rows: parseLeadsDetailGrid(mock.values),
      isMock: true
    }
  }
}

// ── LEADS METRICS CALCULATORS ──────────────────────────────

export function getLeadsKPI(rows: LeadsMonthlyRow[]): LeadsKPI {
  const defaultKPI: LeadsKPI = {
    totalLeads: 0, websiteLeads: 0, organicLeads: 0, llmLeads: 0, enrolled: 0, highPotential: 0, convRate: 0,
    prevTotalLeads: 0, prevEnrolled: 0, prevConvRate: 0, prevHighPotential: 0,
    prevWebsiteLeads: 0, prevOrganicLeads: 0, prevLLMLeads: 0,
    currentMonth: 'N/A', previousMonth: 'N/A'
  }

  if (!rows || rows.length === 0) return defaultKPI

  const sorted = [...rows].sort((a, b) => parseLeadsMonthYear(a.month).getTime() - parseLeadsMonthYear(b.month).getTime())
  const curr = sorted[sorted.length - 1]
  const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : null

  return {
    totalLeads: curr.totalLeads,
    websiteLeads: curr.websiteLeads,
    organicLeads: curr.organicLeads,
    llmLeads: curr.llmLeads || 0,
    enrolled: curr.enrolled,
    highPotential: curr.highPotential,
    convRate: curr.convRate,
    prevTotalLeads: prev ? prev.totalLeads : 0,
    prevEnrolled: prev ? prev.enrolled : 0,
    prevConvRate: prev ? prev.convRate : 0,
    prevHighPotential: prev ? prev.highPotential : 0,
    prevWebsiteLeads: prev ? prev.websiteLeads : 0,
    prevOrganicLeads: prev ? prev.organicLeads : 0,
    prevLLMLeads: prev ? (prev.llmLeads || 0) : 0,
    currentMonth: curr.month,
    previousMonth: prev ? prev.month : 'N/A'
  }
}

export function getLeadsTrend(rows: LeadsMonthlyRow[]): LeadsTrendPoint[] {
  return (rows || []).map(r => ({
    month: r.month,
    totalLeads: r.totalLeads,
    websiteLeads: r.websiteLeads,
    organicLeads: r.organicLeads,
    llmLeads: r.llmLeads || 0,
    chatgptLeads: r.chatgptLeads || 0,
    perplexityLeads: r.perplexityLeads || 0,
    enrolled: r.enrolled,
    highPotential: r.highPotential,
    convRate: r.convRate
  }))
}

export function getLeadsFunnel(rows: LeadsMonthlyRow[], month?: string): LeadsFunnelData {
  const emptyFunnel: LeadsFunnelData = {
    enrolled: 0, highPotential: 0, mediumPotential: 0, freshUnqualified: 0, lowCold: 0, total: 0,
    enrolledPct: 0, highPotentialPct: 0, mediumPotentialPct: 0, freshUnqualifiedPct: 0, lowColdPct: 0,
    convRate: 0,
    stageBreakdown: {}
  }

  if (!rows || rows.length === 0) return emptyFunnel

  let row = rows[rows.length - 1]
  if (month) {
    const found = rows.find(r => r.month.toLowerCase() === month.toLowerCase())
    if (found) row = found
  }

  const total = row.totalLeads || 1
  return {
    enrolled: row.enrolled,
    highPotential: row.highPotential,
    mediumPotential: row.mediumPotential,
    freshUnqualified: row.freshUnqualified,
    lowCold: row.lowCold,
    total: row.totalLeads,
    enrolledPct: parseFloat(((row.enrolled / total) * 100).toFixed(1)),
    highPotentialPct: parseFloat(((row.highPotential / total) * 100).toFixed(1)),
    mediumPotentialPct: parseFloat(((row.mediumPotential / total) * 100).toFixed(1)),
    freshUnqualifiedPct: parseFloat(((row.freshUnqualified / total) * 100).toFixed(1)),
    lowColdPct: parseFloat(((row.lowCold / total) * 100).toFixed(1)),
    convRate: parseFloat(((row.enrolled / total) * 100).toFixed(1)),
    stageBreakdown: {}
  }
}

export function getLeadsCourseBreakdown(
  detailRows: LeadsDetailRow[],
  month?: string
): LeadsCourseAggregate[] {
  if (!detailRows || detailRows.length === 0) return []

  // If no month is specified, detect the latest month that has detail data
  let targetMonth = month
  if (!targetMonth) {
    const sorted = [...detailRows].sort((a, b) => parseLeadsMonthYear(a.month).getTime() - parseLeadsMonthYear(b.month).getTime())
    if (sorted.length > 0) {
      targetMonth = sorted[sorted.length - 1].month
    }
  }

  if (!targetMonth) return []

  const filtered = detailRows.filter(r => r.month.toLowerCase() === targetMonth!.toLowerCase())
  const totalSum = filtered.reduce((acc, r) => acc + r.total, 0) || 1

  const list: LeadsCourseAggregate[] = filtered.map(r => ({
    courseName: r.courseName,
    enrolled: r.enrolled,
    highPotential: r.highPotential,
    mediumPotential: r.mediumPotential,
    freshUnqualified: r.freshUnqualified,
    lowCold: r.lowCold,
    total: r.total,
    organic: r.organic,
    website: r.website,
    sharePercent: parseFloat(((r.total / totalSum) * 100).toFixed(1)),
    convRate: parseFloat((r.total > 0 ? (r.enrolled / r.total) * 100 : 0).toFixed(1))
  }))

  return list.sort((a, b) => b.total - a.total)
}

export function getLeadsChannelSplit(rows: LeadsMonthlyRow[], month?: string): LeadsChannelSplit[] {
  if (!rows || rows.length === 0) return []

  let row = rows[rows.length - 1]
  if (month) {
    const found = rows.find(r => r.month.toLowerCase() === month.toLowerCase())
    if (found) row = found
  }

  const total = row.totalLeads || 1
  return [
    {
      channel: "Website Leads",
      leads: row.websiteLeads,
      enrolled: Math.round(row.enrolled * 0.75), // approximate split defensively
      highPotential: Math.round(row.highPotential * 0.6),
      sharePercent: parseFloat(((row.websiteLeads / total) * 100).toFixed(1)),
      convRate: parseFloat((row.websiteLeads > 0 ? (Math.round(row.enrolled * 0.75) / row.websiteLeads) * 100 : 0).toFixed(1))
    },
    {
      channel: "Organic Leads",
      leads: row.organicLeads,
      enrolled: row.enrolled - Math.round(row.enrolled * 0.75),
      highPotential: row.highPotential - Math.round(row.highPotential * 0.6),
      sharePercent: parseFloat(((row.organicLeads / total) * 100).toFixed(1)),
      convRate: parseFloat((row.organicLeads > 0 ? ((row.enrolled - Math.round(row.enrolled * 0.75)) / row.organicLeads) * 100 : 0).toFixed(1))
    }
  ]
}

export function getAvailableLeadsMonths(rows: LeadsMonthlyRow[]): string[] {
  if (!rows || rows.length === 0) return []
  return rows.map(r => r.month)
}



// ── REVENUE DATA FETCHING & PARSING ──────────────────────────

export const REVENUE_MONTHLY_SHEET = "Revenue Monthly"
export const REVENUE_COURSES_SHEET = "Revenue Courses"

export const REVENUE_COURSES = [
  "SCM",
  "HCM",
  "Financials",
  "Technical",
  "Mfg Planning"
]

export const REVENUE_SOURCES = [
  "Organic",
  "Website",
  "Referrals / Old Students",
  "Google Ads",
  "Facebook/Instagram Ads",
  "Direct/Walk-in"
]

export const REVENUE_SOURCE_COLORS: Record<string, string> = {
  "Organic":                    "#16a34a",  // green
  "Website":                    "#2563eb",  // blue
  "Referrals / Old Students":   "#7c3aed",  // purple
  "Google Ads":                 "#ea580c",  // orange
  "Facebook/Instagram Ads":     "#db2777",  // pink
  "Direct/Walk-in":             "#0891b2",  // cyan
}

export const REVENUE_COURSE_COLORS: Record<string, string> = {
  "SCM":           "#2563eb",  // blue
  "HCM":           "#7c3aed",  // purple
  "Financials":    "#16a34a",  // green
  "Technical":     "#ea580c",  // orange
  "Mfg Planning":  "#0891b2",  // cyan
}

function parseRevenueMonthYear(monthStr: string): Date {
  if (!monthStr) return new Date(0)
  const parts = monthStr.trim().split(/\s+/)
  if (parts.length < 2) {
    const d = new Date(monthStr)
    return isNaN(d.getTime()) ? new Date(0) : d
  }
  const mName = parts[0].toLowerCase()
  const yNum = parseInt(parts[1], 10) || 2026
  const monthsMap: Record<string, number> = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
    may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, september: 8,
    oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
  }
  const mIdx = monthsMap[mName] ?? 0
  return new Date(yNum, mIdx, 1)
}

export function parseRevenueMonthlyGrid(values: string[][]): RevenueMonthlyRow[] {
  if (!values || values.length === 0) return []
  const headers = values[0].map(h => (h || '').trim().toLowerCase())

  const colIdx = {
    month: headers.indexOf('month'),
    totalConversions: headers.indexOf('total conversions'),
    totalRevenue: headers.indexOf('total revenue'),
    avgRevenuePerStudent: headers.indexOf('avg revenue per student'),
    organicConversions: headers.indexOf('organic conversions'),
    organicRevenue: headers.indexOf('organic revenue'),
    websiteConversions: headers.indexOf('website conversions'),
    websiteRevenue: headers.indexOf('website revenue'),
    referralConversions: headers.indexOf('referral conversions'),
    referralRevenue: headers.indexOf('referral revenue'),
    googleAdsConversions: headers.indexOf('google ads conversions'),
    googleAdsRevenue: headers.indexOf('google ads revenue'),
    metaAdsConversions: headers.indexOf('meta ads conversions'),
    metaAdsRevenue: headers.indexOf('meta ads revenue'),
    directConversions: headers.indexOf('direct conversions'),
    directRevenue: headers.indexOf('direct revenue'),
    totalAdSpend: headers.indexOf('total ad spend'),
    metaAdSpend: headers.indexOf('meta ad spend'),
    googleAdSpend: headers.indexOf('google ad spend'),
    paidRevenue: headers.indexOf('paid revenue'),
    overallROAS: headers.indexOf('overall roas')
  }

  const rows: RevenueMonthlyRow[] = []

  for (let i = 1; i < values.length; i++) {
    const row = values[i]
    if (!row || row.length === 0) continue

    const getCell = (idx: number, fallback = '0'): string => {
      if (idx < 0 || idx >= row.length) return fallback
      return row[idx]?.trim() ?? fallback
    }

    const month = getCell(colIdx.month, '')
    if (!month) continue

    const parseNum = (val: string): number => {
      const cleaned = val.replace(/,/g, '').trim()
      return parseFloat(cleaned) || 0
    }

    rows.push({
      month,
      totalConversions: parseNum(getCell(colIdx.totalConversions)),
      totalRevenue: parseNum(getCell(colIdx.totalRevenue)),
      avgRevenuePerStudent: parseNum(getCell(colIdx.avgRevenuePerStudent)),
      organicConversions: parseNum(getCell(colIdx.organicConversions)),
      organicRevenue: parseNum(getCell(colIdx.organicRevenue)),
      websiteConversions: parseNum(getCell(colIdx.websiteConversions)),
      websiteRevenue: parseNum(getCell(colIdx.websiteRevenue)),
      referralConversions: parseNum(getCell(colIdx.referralConversions)),
      referralRevenue: parseNum(getCell(colIdx.referralRevenue)),
      googleAdsConversions: parseNum(getCell(colIdx.googleAdsConversions)),
      googleAdsRevenue: parseNum(getCell(colIdx.googleAdsRevenue)),
      metaAdsConversions: parseNum(getCell(colIdx.metaAdsConversions)),
      metaAdsRevenue: parseNum(getCell(colIdx.metaAdsRevenue)),
      directConversions: parseNum(getCell(colIdx.directConversions)),
      directRevenue: parseNum(getCell(colIdx.directRevenue)),
      totalAdSpend: parseNum(getCell(colIdx.totalAdSpend)),
      metaAdSpend: parseNum(getCell(colIdx.metaAdSpend)),
      googleAdSpend: parseNum(getCell(colIdx.googleAdSpend)),
      paidRevenue: parseNum(getCell(colIdx.paidRevenue)),
      overallROAS: parseNum(getCell(colIdx.overallROAS))
    })
  }

  return rows.sort((a, b) => parseRevenueMonthYear(a.month).getTime() - parseRevenueMonthYear(b.month).getTime())
}

export function parseRevenueCoursesGrid(values: string[][]): RevenueCourseRow[] {
  if (!values || values.length === 0) return []
  const headers = values[0].map(h => (h || '').trim().toLowerCase())

  const colIdx = {
    month: headers.indexOf('month'),
    courseName: headers.indexOf('course name'),
    conversions: headers.indexOf('conversions'),
    revenue: headers.indexOf('revenue'),
    avgFee: headers.indexOf('avg fee'),
    revenueSharePct: headers.indexOf('revenue share %'),
    metaSpend: headers.indexOf('meta spend'),
    googleSpend: headers.indexOf('google spend'),
    totalAdSpend: headers.indexOf('total ad spend'),
    googleAdsRevenue: headers.indexOf('google ads revenue'),
    metaAdsRevenue: headers.indexOf('meta ads revenue'),
    paidRevenue: headers.indexOf('paid revenue'),
    roas: headers.indexOf('roas'),
    organicRevenue: headers.indexOf('organic revenue'),
    websiteRevenue: headers.indexOf('website revenue'),
    totalDemoAttended: headers.indexOf('total demo attended'),
    demoGoogle: headers.indexOf('demo google'),
    demoMeta: headers.indexOf('demo meta'),
    batchNo: headers.indexOf('batch no'),
    faculty: headers.indexOf('faculty')
  }

  const rows: RevenueCourseRow[] = []

  for (let i = 1; i < values.length; i++) {
    const row = values[i]
    if (!row || row.length === 0) continue

    const getCell = (idx: number, fallback = ''): string => {
      if (idx < 0 || idx >= row.length) return fallback
      return row[idx]?.trim() ?? fallback
    }

    const month = getCell(colIdx.month)
    const courseName = getCell(colIdx.courseName)
    if (!month || !courseName) continue

    const parseNum = (val: string): number => {
      const cleaned = val.replace(/,/g, '').trim()
      return parseFloat(cleaned) || 0
    }

    rows.push({
      month,
      courseName,
      conversions: parseNum(getCell(colIdx.conversions)),
      revenue: parseNum(getCell(colIdx.revenue)),
      avgFee: parseNum(getCell(colIdx.avgFee)),
      revenueSharePct: parseNum(getCell(colIdx.revenueSharePct)),
      metaSpend: parseNum(getCell(colIdx.metaSpend)),
      googleSpend: parseNum(getCell(colIdx.googleSpend)),
      totalAdSpend: parseNum(getCell(colIdx.totalAdSpend)),
      googleAdsRevenue: parseNum(getCell(colIdx.googleAdsRevenue)),
      metaAdsRevenue: parseNum(getCell(colIdx.metaAdsRevenue)),
      paidRevenue: parseNum(getCell(colIdx.paidRevenue)),
      roas: parseNum(getCell(colIdx.roas)),
      organicRevenue: parseNum(getCell(colIdx.organicRevenue)),
      websiteRevenue: parseNum(getCell(colIdx.websiteRevenue)),
      totalDemoAttended: parseNum(getCell(colIdx.totalDemoAttended)),
      demoGoogle: parseNum(getCell(colIdx.demoGoogle)),
      demoMeta: parseNum(getCell(colIdx.demoMeta)),
      batchNo: getCell(colIdx.batchNo),
      faculty: getCell(colIdx.faculty)
    })
  }

  return rows
}

export async function fetchRevenueMonthly(
  bypassCache = false,
  customSheetId?: string,
  customApiKey?: string
): Promise<{
  rows: RevenueMonthlyRow[]
  isMock: boolean
  lastUpdated: string
  fallbackReason?: string
}> {
  const isForcedMock = customSheetId === 'mock'
  const sheetId = isForcedMock ? undefined : (customSheetId || process.env.GOOGLE_SHEET_ID)
  const apiKey = isForcedMock ? undefined : (customApiKey || process.env.GOOGLE_SHEETS_API_KEY)

  const nowString = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  if (!sheetId || !apiKey) {
    console.warn('Google Sheets credentials missing for Revenue. Falling back to local mock data.')
    const mock = getMockRevenueMonthlyResponse()
    return {
      rows: parseRevenueMonthlyGrid(mock.values),
      isMock: true,
      lastUpdated: nowString,
      fallbackReason: 'No Google Sheets credentials configured. Showing demo revenue data.'
    }
  }

  try {
    const data = await fetchSheetValues(sheetId, apiKey, REVENUE_MONTHLY_SHEET, bypassCache)
    const rows = parseRevenueMonthlyGrid(data)

    if (rows.length === 0) {
      const mock = getMockRevenueMonthlyResponse()
      return {
        rows: parseRevenueMonthlyGrid(mock.values),
        isMock: true,
        lastUpdated: nowString,
        fallbackReason: 'Revenue Monthly sheet is empty or not yet created. Showing demo data.'
      }
    }

    return {
      rows,
      isMock: false,
      lastUpdated: nowString
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Failed to fetch Revenue Monthly. Falling back to mock data.', error)
    const mock = getMockRevenueMonthlyResponse()
    return {
      rows: parseRevenueMonthlyGrid(mock.values),
      isMock: true,
      lastUpdated: nowString,
      fallbackReason: `Live Sheets failed: ${msg}`
    }
  }
}

export async function fetchRevenueCourses(
  bypassCache = false,
  customSheetId?: string,
  customApiKey?: string
): Promise<{
  rows: RevenueCourseRow[]
  isMock: boolean
}> {
  const isForcedMock = customSheetId === 'mock'
  const sheetId = isForcedMock ? undefined : (customSheetId || process.env.GOOGLE_SHEET_ID)
  const apiKey = isForcedMock ? undefined : (customApiKey || process.env.GOOGLE_SHEETS_API_KEY)

  if (!sheetId || !apiKey) {
    const mock = getMockRevenueCoursesResponse()
    return {
      rows: parseRevenueCoursesGrid(mock.values),
      isMock: true
    }
  }

  try {
    const data = await fetchSheetValues(sheetId, apiKey, REVENUE_COURSES_SHEET, bypassCache)
    const rows = parseRevenueCoursesGrid(data)

    if (rows.length === 0) {
      const mock = getMockRevenueCoursesResponse()
      return {
        rows: parseRevenueCoursesGrid(mock.values),
        isMock: true
      }
    }

    return {
      rows,
      isMock: false
    }
  } catch (error) {
    console.warn('Revenue Courses sheet missing or empty. Returning mock data.', error)
    const mock = getMockRevenueCoursesResponse()
    return {
      rows: parseRevenueCoursesGrid(mock.values),
      isMock: true
    }
  }
}

// ── REVENUE METRICS CALCULATORS ──────────────────────────────

export function getRevenueKPI(rows: RevenueMonthlyRow[]): RevenueKPI {
  const defaultKPI: RevenueKPI = {
    totalRevenue: 0, totalConversions: 0, avgFee: 0, totalAdSpend: 0, overallROAS: 0,
    organicRevenue: 0, paidRevenue: 0, prevTotalRevenue: 0, prevTotalConversions: 0,
    prevAvgFee: 0, prevTotalAdSpend: 0, prevOverallROAS: 0,
    currentMonth: 'N/A', previousMonth: 'N/A'
  }

  if (!rows || rows.length === 0) return defaultKPI

  const sorted = [...rows].sort((a, b) => parseRevenueMonthYear(a.month).getTime() - parseRevenueMonthYear(b.month).getTime())
  const curr = sorted[sorted.length - 1]
  const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : null

  return {
    totalRevenue: curr.totalRevenue,
    totalConversions: curr.totalConversions,
    avgFee: curr.avgRevenuePerStudent,
    totalAdSpend: curr.totalAdSpend,
    overallROAS: curr.overallROAS,
    organicRevenue: curr.organicRevenue,
    paidRevenue: curr.paidRevenue,
    prevTotalRevenue: prev ? prev.totalRevenue : 0,
    prevTotalConversions: prev ? prev.totalConversions : 0,
    prevAvgFee: prev ? prev.avgRevenuePerStudent : 0,
    prevTotalAdSpend: prev ? prev.totalAdSpend : 0,
    prevOverallROAS: prev ? prev.overallROAS : 0,
    currentMonth: curr.month,
    previousMonth: prev ? prev.month : 'N/A'
  }
}

export function getRevenueTrend(rows: RevenueMonthlyRow[]): RevenueTrendPoint[] {
  return (rows || []).map(r => ({
    month: r.month,
    totalRevenue: r.totalRevenue,
    organicRevenue: r.organicRevenue,
    paidRevenue: r.paidRevenue,
    totalConversions: r.totalConversions,
    avgFee: r.avgRevenuePerStudent,
    totalAdSpend: r.totalAdSpend,
    overallROAS: r.overallROAS
  }))
}

export function getRevenueSourceBreakdown(rows: RevenueMonthlyRow[], month?: string): RevenueSourceBreakdown[] {
  if (!rows || rows.length === 0) return []

  let row = rows[rows.length - 1]
  let prevRow: RevenueMonthlyRow | null = rows.length >= 2 ? rows[rows.length - 2] : null

  if (month) {
    const idx = rows.findIndex(r => r.month.toLowerCase() === month.toLowerCase())
    if (idx >= 0) {
      row = rows[idx]
      prevRow = idx >= 1 ? rows[idx - 1] : null
    }
  }

  const totRev = row.totalRevenue || 1
  const totConv = row.totalConversions || 1

  const sources = [
    {
      source: "Organic",
      conversions: row.organicConversions,
      revenue: row.organicRevenue,
      prevRevenue: prevRow ? prevRow.organicRevenue : 0
    },
    {
      source: "Website",
      conversions: row.websiteConversions,
      revenue: row.websiteRevenue,
      prevRevenue: prevRow ? prevRow.websiteRevenue : 0
    },
    {
      source: "Referrals / Old Students",
      conversions: row.referralConversions,
      revenue: row.referralRevenue,
      prevRevenue: prevRow ? prevRow.referralRevenue : 0
    },
    {
      source: "Google Ads",
      conversions: row.googleAdsConversions,
      revenue: row.googleAdsRevenue,
      prevRevenue: prevRow ? prevRow.googleAdsRevenue : 0
    },
    {
      source: "Facebook/Instagram Ads",
      conversions: row.metaAdsConversions,
      revenue: row.metaAdsRevenue,
      prevRevenue: prevRow ? prevRow.metaAdsRevenue : 0
    },
    {
      source: "Direct/Walk-in",
      conversions: row.directConversions,
      revenue: row.directRevenue,
      prevRevenue: prevRow ? prevRow.directRevenue : 0
    }
  ]

  return sources.map(s => ({
    source: s.source,
    conversions: s.conversions,
    revenue: s.revenue,
    revenueSharePct: parseFloat(((s.revenue / totRev) * 100).toFixed(1)),
    avgFee: s.conversions > 0 ? Math.round(s.revenue / s.conversions) : 0,
    convSharePct: parseFloat(((s.conversions / totConv) * 100).toFixed(1))
  })).sort((a, b) => b.revenue - a.revenue)
}

export function getRevenueCourseBreakdown(courseRows: RevenueCourseRow[], month?: string): RevenueCourseAggregate[] {
  if (!courseRows || courseRows.length === 0) return []

  let targetMonth = month
  if (!targetMonth) {
    const sorted = [...courseRows].sort((a, b) => parseRevenueMonthYear(a.month).getTime() - parseRevenueMonthYear(b.month).getTime())
    if (sorted.length > 0) {
      targetMonth = sorted[sorted.length - 1].month
    }
  }

  if (!targetMonth) return []

  const filtered = courseRows.filter(r => r.month.toLowerCase() === targetMonth!.toLowerCase())
  const totalSum = filtered.reduce((acc, r) => acc + r.revenue, 0) || 1

  return filtered.map(r => ({
    courseName: r.courseName,
    conversions: r.conversions,
    revenue: r.revenue,
    avgFee: r.avgFee,
    revenueSharePct: parseFloat(((r.revenue / totalSum) * 100).toFixed(1)),
    totalAdSpend: r.totalAdSpend,
    paidRevenue: r.paidRevenue,
    roas: r.roas,
    organicRevenue: r.organicRevenue,
    websiteRevenue: r.websiteRevenue,
    totalDemoAttended: r.totalDemoAttended,
    faculty: r.faculty,
    batchNo: r.batchNo
  })).sort((a, b) => b.revenue - a.revenue)
}

export function getAdSpendBreakdown(courseRows: RevenueCourseRow[], month?: string): AdSpendBreakdown[] {
  if (!courseRows || courseRows.length === 0) return []

  let targetMonth = month
  if (!targetMonth) {
    const sorted = [...courseRows].sort((a, b) => parseRevenueMonthYear(a.month).getTime() - parseRevenueMonthYear(b.month).getTime())
    if (sorted.length > 0) {
      targetMonth = sorted[sorted.length - 1].month
    }
  }

  if (!targetMonth) return []

  const filtered = courseRows.filter(r => r.month.toLowerCase() === targetMonth!.toLowerCase())

  return filtered.map(r => {
    const metaROAS = r.metaSpend > 0 ? parseFloat((r.metaAdsRevenue / r.metaSpend).toFixed(2)) : 0
    const googleROAS = r.googleSpend > 0 ? parseFloat((r.googleAdsRevenue / r.googleSpend).toFixed(2)) : 0
    return {
      course: r.courseName,
      metaSpend: r.metaSpend,
      googleSpend: r.googleSpend,
      totalAdSpend: r.totalAdSpend,
      metaRevenue: r.metaAdsRevenue,
      googleRevenue: r.googleAdsRevenue,
      paidRevenue: r.paidRevenue,
      roas: r.roas,
      metaROAS,
      googleROAS,
      demoGoogle: r.demoGoogle,
      demoMeta: r.demoMeta
    }
  }).sort((a, b) => b.totalAdSpend - a.totalAdSpend)
}

export function getAvailableRevenueMonths(rows: RevenueMonthlyRow[]): string[] {
  if (!rows || rows.length === 0) return []
  return rows.map(r => r.month)
}

export function formatCurrency(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n.toLocaleString('en-IN')}`
}

export function formatROAS(roas: number): string {
  if (roas === 0) return 'N/A'
  return `${roas.toFixed(2)}x`
}

export function getRevenueMonthComparison(
  rows: RevenueMonthlyRow[],
  monthA: string,
  monthB: string
): {
  a: RevenueMonthlyRow
  b: RevenueMonthlyRow
  deltas: Record<string, number>
} {
  const defaultRow = (mName: string): RevenueMonthlyRow => ({
    month: mName,
    totalConversions: 0,
    totalRevenue: 0,
    avgRevenuePerStudent: 0,
    organicConversions: 0,
    organicRevenue: 0,
    websiteConversions: 0,
    websiteRevenue: 0,
    referralConversions: 0,
    referralRevenue: 0,
    googleAdsConversions: 0,
    googleAdsRevenue: 0,
    metaAdsConversions: 0,
    metaAdsRevenue: 0,
    directConversions: 0,
    directRevenue: 0,
    totalAdSpend: 0,
    metaAdSpend: 0,
    googleAdSpend: 0,
    paidRevenue: 0,
    overallROAS: 0
  })

  const a = rows.find(r => r.month.toLowerCase() === monthA.toLowerCase()) || defaultRow(monthA)
  const b = rows.find(r => r.month.toLowerCase() === monthB.toLowerCase()) || defaultRow(monthB)

  const deltas: Record<string, number> = {
    totalConversions: a.totalConversions - b.totalConversions,
    totalRevenue: a.totalRevenue - b.totalRevenue,
    avgRevenuePerStudent: a.avgRevenuePerStudent - b.avgRevenuePerStudent,
    organicConversions: a.organicConversions - b.organicConversions,
    organicRevenue: a.organicRevenue - b.organicRevenue,
    websiteConversions: a.websiteConversions - b.websiteConversions,
    websiteRevenue: a.websiteRevenue - b.websiteRevenue,
    referralConversions: a.referralConversions - b.referralConversions,
    referralRevenue: a.referralRevenue - b.referralRevenue,
    googleAdsConversions: a.googleAdsConversions - b.googleAdsConversions,
    googleAdsRevenue: a.googleAdsRevenue - b.googleAdsRevenue,
    metaAdsConversions: a.metaAdsConversions - b.metaAdsConversions,
    metaAdsRevenue: a.metaAdsRevenue - b.metaAdsRevenue,
    directConversions: a.directConversions - b.directConversions,
    directRevenue: a.directRevenue - b.directRevenue,
    totalAdSpend: a.totalAdSpend - b.totalAdSpend,
    metaAdSpend: a.metaAdSpend - b.metaAdSpend,
    googleAdSpend: a.googleAdSpend - b.googleAdSpend,
    paidRevenue: a.paidRevenue - b.paidRevenue,
    overallROAS: a.overallROAS - b.overallROAS
  }

  return { a, b, deltas }
}

export function getRevenueQuarterlySummary(rows: RevenueMonthlyRow[]): RevenueQuarterlyRow[] {
  if (!rows || rows.length === 0) return []

  const groups: Record<string, RevenueMonthlyRow[]> = {}
  rows.forEach(row => {
    const date = parseRevenueMonthYear(row.month)
    const year = date.getFullYear()
    const month = date.getMonth()
    let q = 'Q1'
    if (month >= 9) q = 'Q4'
    else if (month >= 6) q = 'Q3'
    else if (month >= 3) q = 'Q2'

    const key = `${year}-${q}`
    if (!groups[key]) groups[key] = []
    groups[key].push(row)
  })

  const result: RevenueQuarterlyRow[] = Object.entries(groups).map(([key, list]) => {
    const [yearStr, quarter] = key.split('-')
    const year = parseInt(yearStr, 10)

    const totalRevenue = list.reduce((sum, r) => sum + r.totalRevenue, 0)
    const conversions = list.reduce((sum, r) => sum + r.totalConversions, 0)
    const totalAdSpend = list.reduce((sum, r) => sum + r.totalAdSpend, 0)
    const paidRevenue = list.reduce((sum, r) => sum + r.paidRevenue, 0)
    const organicRevenue = list.reduce((sum, r) => sum + r.organicRevenue, 0)
    
    const avgFee = conversions > 0 ? Math.round(totalRevenue / conversions) : 0
    const overallROAS = totalAdSpend > 0 ? paidRevenue / totalAdSpend : 0

    return {
      year,
      quarter,
      totalRevenue,
      conversions,
      avgFee,
      totalAdSpend,
      paidRevenue,
      overallROAS,
      organicRevenue
    }
  })

  return result.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.quarter.localeCompare(a.quarter)
  })
}

export function getRevenueYearlySummary(rows: RevenueMonthlyRow[]): RevenueYearlyRow[] {
  if (!rows || rows.length === 0) return []

  const groups: Record<number, RevenueMonthlyRow[]> = {}
  rows.forEach(row => {
    const date = parseRevenueMonthYear(row.month)
    const year = date.getFullYear()
    if (!groups[year]) groups[year] = []
    groups[year].push(row)
  })

  const result: RevenueYearlyRow[] = Object.entries(groups).map(([yearStr, list]) => {
    const year = parseInt(yearStr, 10)

    const totalRevenue = list.reduce((sum, r) => sum + r.totalRevenue, 0)
    const conversions = list.reduce((sum, r) => sum + r.totalConversions, 0)
    const totalAdSpend = list.reduce((sum, r) => sum + r.totalAdSpend, 0)
    const paidRevenue = list.reduce((sum, r) => sum + r.paidRevenue, 0)
    const organicRevenue = list.reduce((sum, r) => sum + r.organicRevenue, 0)

    const avgFee = conversions > 0 ? Math.round(totalRevenue / conversions) : 0
    const overallROAS = totalAdSpend > 0 ? paidRevenue / totalAdSpend : 0

    return {
      year,
      totalRevenue,
      conversions,
      avgFee,
      totalAdSpend,
      paidRevenue,
      overallROAS,
      organicRevenue
    }
  })

  return result.sort((a, b) => b.year - a.year)
}

export function getRevenueQuarterlyDetails(rows: RevenueMonthlyRow[]): RevenueQuarterlyDetailRow[] {
  if (!rows || rows.length === 0) return []

  const groups: Record<string, RevenueMonthlyRow[]> = {}
  rows.forEach(row => {
    const date = parseRevenueMonthYear(row.month)
    const year = date.getFullYear()
    const month = date.getMonth()
    let q = 'Q1'
    if (month >= 9) q = 'Q4'
    else if (month >= 6) q = 'Q3'
    else if (month >= 3) q = 'Q2'

    const key = `${year}-${q}`
    if (!groups[key]) groups[key] = []
    groups[key].push(row)
  })

  const result: RevenueQuarterlyDetailRow[] = Object.entries(groups).map(([key, list]) => {
    const [yearStr, quarter] = key.split('-')
    const year = parseInt(yearStr, 10)

    const totalRevenue = list.reduce((sum, r) => sum + r.totalRevenue, 0)
    const conversions = list.reduce((sum, r) => sum + r.totalConversions, 0)
    const totalAdSpend = list.reduce((sum, r) => sum + r.totalAdSpend, 0)
    const paidRevenue = list.reduce((sum, r) => sum + r.paidRevenue, 0)
    const organicRevenue = list.reduce((sum, r) => sum + r.organicRevenue, 0)
    
    const avgFee = conversions > 0 ? Math.round(totalRevenue / conversions) : 0
    const overallROAS = totalAdSpend > 0 ? paidRevenue / totalAdSpend : 0

    const organicConversions = list.reduce((sum, r) => sum + r.organicConversions, 0)
    const websiteConversions = list.reduce((sum, r) => sum + r.websiteConversions, 0)
    const referralConversions = list.reduce((sum, r) => sum + r.referralConversions, 0)
    const googleAdsConversions = list.reduce((sum, r) => sum + r.googleAdsConversions, 0)
    const metaAdsConversions = list.reduce((sum, r) => sum + r.metaAdsConversions, 0)
    const directConversions = list.reduce((sum, r) => sum + r.directConversions, 0)

    const websiteRevenue = list.reduce((sum, r) => sum + r.websiteRevenue, 0)
    const referralRevenue = list.reduce((sum, r) => sum + r.referralRevenue, 0)
    const googleAdsRevenue = list.reduce((sum, r) => sum + r.googleAdsRevenue, 0)
    const metaAdsRevenue = list.reduce((sum, r) => sum + r.metaAdsRevenue, 0)
    const directRevenue = list.reduce((sum, r) => sum + r.directRevenue, 0)

    const googleAdSpend = list.reduce((sum, r) => sum + r.googleAdSpend, 0)
    const metaAdSpend = list.reduce((sum, r) => sum + r.metaAdSpend, 0)

    return {
      year,
      quarter,
      totalRevenue,
      conversions,
      avgFee,
      totalAdSpend,
      paidRevenue,
      overallROAS,
      organicRevenue,
      organicConversions,
      websiteConversions,
      referralConversions,
      googleAdsConversions,
      metaAdsConversions,
      directConversions,
      websiteRevenue,
      referralRevenue,
      googleAdsRevenue,
      metaAdsRevenue,
      directRevenue,
      googleAdSpend,
      metaAdSpend
    }
  })

  return result.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.quarter.localeCompare(a.quarter)
  })
}

export function getRevenueQuarterComparison(
  rows: RevenueQuarterlyDetailRow[],
  qA: string,
  qB: string
): {
  a: RevenueQuarterlyDetailRow
  b: RevenueQuarterlyDetailRow
  deltas: Record<string, number>
} {
  const parseKey = (k: string) => {
    const parts = k.trim().split(' ')
    return { year: parseInt(parts[0], 10), quarter: parts[1] }
  }

  const keyA = parseKey(qA)
  const keyB = parseKey(qB)

  const defaultRow = (yr: number, qtr: string): RevenueQuarterlyDetailRow => ({
    year: yr,
    quarter: qtr,
    totalRevenue: 0,
    conversions: 0,
    avgFee: 0,
    totalAdSpend: 0,
    paidRevenue: 0,
    overallROAS: 0,
    organicRevenue: 0,
    organicConversions: 0,
    websiteConversions: 0,
    referralConversions: 0,
    googleAdsConversions: 0,
    metaAdsConversions: 0,
    directConversions: 0,
    websiteRevenue: 0,
    referralRevenue: 0,
    googleAdsRevenue: 0,
    metaAdsRevenue: 0,
    directRevenue: 0,
    googleAdSpend: 0,
    metaAdSpend: 0
  })

  const a = rows.find(r => r.year === keyA.year && r.quarter.toLowerCase() === keyA.quarter.toLowerCase()) || defaultRow(keyA.year, keyA.quarter)
  const b = rows.find(r => r.year === keyB.year && r.quarter.toLowerCase() === keyB.quarter.toLowerCase()) || defaultRow(keyB.year, keyB.quarter)

  const deltas: Record<string, number> = {
    totalRevenue: a.totalRevenue - b.totalRevenue,
    conversions: a.conversions - b.conversions,
    avgFee: a.avgFee - b.avgFee,
    totalAdSpend: a.totalAdSpend - b.totalAdSpend,
    paidRevenue: a.paidRevenue - b.paidRevenue,
    overallROAS: a.overallROAS - b.overallROAS,
    organicRevenue: a.organicRevenue - b.organicRevenue,
    organicConversions: a.organicConversions - b.organicConversions,
    websiteConversions: a.websiteConversions - b.websiteConversions,
    referralConversions: a.referralConversions - b.referralConversions,
    googleAdsConversions: a.googleAdsConversions - b.googleAdsConversions,
    metaAdsConversions: a.metaAdsConversions - b.metaAdsConversions,
    directConversions: a.directConversions - b.directConversions,
    websiteRevenue: a.websiteRevenue - b.websiteRevenue,
    referralRevenue: a.referralRevenue - b.referralRevenue,
    googleAdsRevenue: a.googleAdsRevenue - b.googleAdsRevenue,
    metaAdsRevenue: a.metaAdsRevenue - b.metaAdsRevenue,
    directRevenue: a.directRevenue - b.directRevenue,
    googleAdSpend: a.googleAdSpend - b.googleAdSpend,
    metaAdSpend: a.metaAdSpend - b.metaAdSpend
  }

  return { a, b, deltas }
}

export function getRevenueYearlyDetails(rows: RevenueMonthlyRow[]): RevenueYearlyDetailRow[] {
  if (!rows || rows.length === 0) return []

  const groups: Record<number, RevenueMonthlyRow[]> = {}
  rows.forEach(row => {
    const date = parseRevenueMonthYear(row.month)
    const year = date.getFullYear()
    if (!groups[year]) groups[year] = []
    groups[year].push(row)
  })

  const result: RevenueYearlyDetailRow[] = Object.entries(groups).map(([yearStr, list]) => {
    const year = parseInt(yearStr, 10)

    const totalRevenue = list.reduce((sum, r) => sum + r.totalRevenue, 0)
    const conversions = list.reduce((sum, r) => sum + r.totalConversions, 0)
    const totalAdSpend = list.reduce((sum, r) => sum + r.totalAdSpend, 0)
    const paidRevenue = list.reduce((sum, r) => sum + r.paidRevenue, 0)
    const organicRevenue = list.reduce((sum, r) => sum + r.organicRevenue, 0)
    
    const avgFee = conversions > 0 ? Math.round(totalRevenue / conversions) : 0
    const overallROAS = totalAdSpend > 0 ? paidRevenue / totalAdSpend : 0

    const organicConversions = list.reduce((sum, r) => sum + r.organicConversions, 0)
    const websiteConversions = list.reduce((sum, r) => sum + r.websiteConversions, 0)
    const referralConversions = list.reduce((sum, r) => sum + r.referralConversions, 0)
    const googleAdsConversions = list.reduce((sum, r) => sum + r.googleAdsConversions, 0)
    const metaAdsConversions = list.reduce((sum, r) => sum + r.metaAdsConversions, 0)
    const directConversions = list.reduce((sum, r) => sum + r.directConversions, 0)

    const websiteRevenue = list.reduce((sum, r) => sum + r.websiteRevenue, 0)
    const referralRevenue = list.reduce((sum, r) => sum + r.referralRevenue, 0)
    const googleAdsRevenue = list.reduce((sum, r) => sum + r.googleAdsRevenue, 0)
    const metaAdsRevenue = list.reduce((sum, r) => sum + r.metaAdsRevenue, 0)
    const directRevenue = list.reduce((sum, r) => sum + r.directRevenue, 0)

    const googleAdSpend = list.reduce((sum, r) => sum + r.googleAdSpend, 0)
    const metaAdSpend = list.reduce((sum, r) => sum + r.metaAdSpend, 0)

    return {
      year,
      totalRevenue,
      conversions,
      avgFee,
      totalAdSpend,
      paidRevenue,
      overallROAS,
      organicRevenue,
      organicConversions,
      websiteConversions,
      referralConversions,
      googleAdsConversions,
      metaAdsConversions,
      directConversions,
      websiteRevenue,
      referralRevenue,
      googleAdsRevenue,
      metaAdsRevenue,
      directRevenue,
      googleAdSpend,
      metaAdSpend
    }
  })

  return result.sort((a, b) => b.year - a.year)
}

export function getRevenueYearComparison(
  rows: RevenueYearlyDetailRow[],
  yearA: string,
  yearB: string
): {
  a: RevenueYearlyDetailRow
  b: RevenueYearlyDetailRow
  deltas: Record<string, number>
} {
  const yrA = parseInt(yearA, 10)
  const yrB = parseInt(yearB, 10)

  const defaultRow = (yr: number): RevenueYearlyDetailRow => ({
    year: yr,
    totalRevenue: 0,
    conversions: 0,
    avgFee: 0,
    totalAdSpend: 0,
    paidRevenue: 0,
    overallROAS: 0,
    organicRevenue: 0,
    organicConversions: 0,
    websiteConversions: 0,
    referralConversions: 0,
    googleAdsConversions: 0,
    metaAdsConversions: 0,
    directConversions: 0,
    websiteRevenue: 0,
    referralRevenue: 0,
    googleAdsRevenue: 0,
    metaAdsRevenue: 0,
    directRevenue: 0,
    googleAdSpend: 0,
    metaAdSpend: 0
  })

  const a = rows.find(r => r.year === yrA) || defaultRow(yrA)
  const b = rows.find(r => r.year === yrB) || defaultRow(yrB)

  const deltas: Record<string, number> = {
    totalRevenue: a.totalRevenue - b.totalRevenue,
    conversions: a.conversions - b.conversions,
    avgFee: a.avgFee - b.avgFee,
    totalAdSpend: a.totalAdSpend - b.totalAdSpend,
    paidRevenue: a.paidRevenue - b.paidRevenue,
    overallROAS: a.overallROAS - b.overallROAS,
    organicRevenue: a.organicRevenue - b.organicRevenue,
    organicConversions: a.organicConversions - b.organicConversions,
    websiteConversions: a.websiteConversions - b.websiteConversions,
    referralConversions: a.referralConversions - b.referralConversions,
    googleAdsConversions: a.googleAdsConversions - b.googleAdsConversions,
    metaAdsConversions: a.metaAdsConversions - b.metaAdsConversions,
    directConversions: a.directConversions - b.directConversions,
    websiteRevenue: a.websiteRevenue - b.websiteRevenue,
    referralRevenue: a.referralRevenue - b.referralRevenue,
    googleAdsRevenue: a.googleAdsRevenue - b.googleAdsRevenue,
    metaAdsRevenue: a.metaAdsRevenue - b.metaAdsRevenue,
    directRevenue: a.directRevenue - b.directRevenue,
    googleAdSpend: a.googleAdSpend - b.googleAdSpend,
    metaAdSpend: a.metaAdSpend - b.metaAdSpend
  }

  return { a, b, deltas }
}

export function getLeadsQuarterlyDetails(rows: LeadsMonthlyRow[]): LeadsQuarterlyDetailRow[] {
  if (!rows || rows.length === 0) return []

  const groups: Record<string, LeadsMonthlyRow[]> = {}
  rows.forEach(row => {
    const date = parseLeadsMonthYear(row.month)
    const year = date.getFullYear()
    const month = date.getMonth()
    let q = 'Q1'
    if (month >= 9) q = 'Q4'
    else if (month >= 6) q = 'Q3'
    else if (month >= 3) q = 'Q2'

    const key = `${year}-${q}`
    if (!groups[key]) groups[key] = []
    groups[key].push(row)
  })

  const result: LeadsQuarterlyDetailRow[] = Object.entries(groups).map(([key, list]) => {
    const [yearStr, quarter] = key.split('-')
    const year = parseInt(yearStr, 10)

    const totalLeads = list.reduce((sum, r) => sum + r.totalLeads, 0)
    const websiteLeads = list.reduce((sum, r) => sum + r.websiteLeads, 0)
    const organicLeads = list.reduce((sum, r) => sum + r.organicLeads, 0)
    const llmLeads = list.reduce((sum, r) => sum + (r.llmLeads || 0), 0)
    const chatgptLeads = list.reduce((sum, r) => sum + (r.chatgptLeads || 0), 0)
    const perplexityLeads = list.reduce((sum, r) => sum + (r.perplexityLeads || 0), 0)
    const scmLeads = list.reduce((sum, r) => sum + r.scmLeads, 0)
    const hcmLeads = list.reduce((sum, r) => sum + r.hcmLeads, 0)
    const financialsLeads = list.reduce((sum, r) => sum + r.financialsLeads, 0)
    const techOicLeads = list.reduce((sum, r) => sum + r.techOicLeads, 0)
    const ppmLeads = list.reduce((sum, r) => sum + r.ppmLeads, 0)
    const sapEbsOthersLeads = list.reduce((sum, r) => sum + r.sapEbsOthersLeads, 0)
    const enrolled = list.reduce((sum, r) => sum + r.enrolled, 0)
    const highPotential = list.reduce((sum, r) => sum + r.highPotential, 0)
    const mediumPotential = list.reduce((sum, r) => sum + r.mediumPotential, 0)
    const freshUnqualified = list.reduce((sum, r) => sum + r.freshUnqualified, 0)
    const lowCold = list.reduce((sum, r) => sum + r.lowCold, 0)

    const convRate = totalLeads > 0 ? (enrolled / totalLeads) * 100 : 0

    return {
      year,
      quarter,
      totalLeads,
      websiteLeads,
      organicLeads,
      llmLeads,
      chatgptLeads,
      perplexityLeads,
      scmLeads,
      hcmLeads,
      financialsLeads,
      techOicLeads,
      ppmLeads,
      sapEbsOthersLeads,
      enrolled,
      highPotential,
      mediumPotential,
      freshUnqualified,
      lowCold,
      convRate
    }
  })

  return result.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.quarter.localeCompare(a.quarter)
  })
}

export function getLeadsQuarterComparison(
  rows: LeadsQuarterlyDetailRow[],
  qA: string,
  qB: string
): {
  a: LeadsQuarterlyDetailRow
  b: LeadsQuarterlyDetailRow
  deltas: Record<string, number>
} {
  const parseKey = (k: string) => {
    const parts = k.trim().split(' ')
    return { year: parseInt(parts[0], 10), quarter: parts[1] }
  }

  const keyA = parseKey(qA)
  const keyB = parseKey(qB)

  const defaultRow = (yr: number, qtr: string): LeadsQuarterlyDetailRow => ({
    year: yr,
    quarter: qtr,
    totalLeads: 0,
    websiteLeads: 0,
    organicLeads: 0,
    llmLeads: 0,
    chatgptLeads: 0,
    perplexityLeads: 0,
    scmLeads: 0,
    hcmLeads: 0,
    financialsLeads: 0,
    techOicLeads: 0,
    ppmLeads: 0,
    sapEbsOthersLeads: 0,
    enrolled: 0,
    highPotential: 0,
    mediumPotential: 0,
    freshUnqualified: 0,
    lowCold: 0,
    convRate: 0
  })

  const a = rows.find(r => r.year === keyA.year && r.quarter.toLowerCase() === keyA.quarter.toLowerCase()) || defaultRow(keyA.year, keyA.quarter)
  const b = rows.find(r => r.year === keyB.year && r.quarter.toLowerCase() === keyB.quarter.toLowerCase()) || defaultRow(keyB.year, keyB.quarter)

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
    convRate: parseFloat((a.convRate - b.convRate).toFixed(2))
  }

  return { a, b, deltas }
}

export function getLeadsYearlyDetails(rows: LeadsMonthlyRow[]): LeadsYearlyDetailRow[] {
  if (!rows || rows.length === 0) return []

  const groups: Record<number, LeadsMonthlyRow[]> = {}
  rows.forEach(row => {
    const date = parseLeadsMonthYear(row.month)
    const year = date.getFullYear()
    if (!groups[year]) groups[year] = []
    groups[year].push(row)
  })

  const result: LeadsYearlyDetailRow[] = Object.entries(groups).map(([yearStr, list]) => {
    const year = parseInt(yearStr, 10)

    const totalLeads = list.reduce((sum, r) => sum + r.totalLeads, 0)
    const websiteLeads = list.reduce((sum, r) => sum + r.websiteLeads, 0)
    const organicLeads = list.reduce((sum, r) => sum + r.organicLeads, 0)
    const llmLeads = list.reduce((sum, r) => sum + (r.llmLeads || 0), 0)
    const chatgptLeads = list.reduce((sum, r) => sum + (r.chatgptLeads || 0), 0)
    const perplexityLeads = list.reduce((sum, r) => sum + (r.perplexityLeads || 0), 0)
    const scmLeads = list.reduce((sum, r) => sum + r.scmLeads, 0)
    const hcmLeads = list.reduce((sum, r) => sum + r.hcmLeads, 0)
    const financialsLeads = list.reduce((sum, r) => sum + r.financialsLeads, 0)
    const techOicLeads = list.reduce((sum, r) => sum + r.techOicLeads, 0)
    const ppmLeads = list.reduce((sum, r) => sum + r.ppmLeads, 0)
    const sapEbsOthersLeads = list.reduce((sum, r) => sum + r.sapEbsOthersLeads, 0)
    const enrolled = list.reduce((sum, r) => sum + r.enrolled, 0)
    const highPotential = list.reduce((sum, r) => sum + r.highPotential, 0)
    const mediumPotential = list.reduce((sum, r) => sum + r.mediumPotential, 0)
    const freshUnqualified = list.reduce((sum, r) => sum + r.freshUnqualified, 0)
    const lowCold = list.reduce((sum, r) => sum + r.lowCold, 0)

    const convRate = totalLeads > 0 ? (enrolled / totalLeads) * 100 : 0

    return {
      year,
      totalLeads,
      websiteLeads,
      organicLeads,
      llmLeads,
      chatgptLeads,
      perplexityLeads,
      scmLeads,
      hcmLeads,
      financialsLeads,
      techOicLeads,
      ppmLeads,
      sapEbsOthersLeads,
      enrolled,
      highPotential,
      mediumPotential,
      freshUnqualified,
      lowCold,
      convRate
    }
  })

  return result.sort((a, b) => b.year - a.year)
}

export function getLeadsYearComparison(
  rows: LeadsYearlyDetailRow[],
  yearA: string,
  yearB: string
): {
  a: LeadsYearlyDetailRow
  b: LeadsYearlyDetailRow
  deltas: Record<string, number>
} {
  const yrA = parseInt(yearA, 10)
  const yrB = parseInt(yearB, 10)

  const defaultRow = (yr: number): LeadsYearlyDetailRow => ({
    year: yr,
    totalLeads: 0,
    websiteLeads: 0,
    organicLeads: 0,
    llmLeads: 0,
    chatgptLeads: 0,
    perplexityLeads: 0,
    scmLeads: 0,
    hcmLeads: 0,
    financialsLeads: 0,
    techOicLeads: 0,
    ppmLeads: 0,
    sapEbsOthersLeads: 0,
    enrolled: 0,
    highPotential: 0,
    mediumPotential: 0,
    freshUnqualified: 0,
    lowCold: 0,
    convRate: 0
  })

  const a = rows.find(r => r.year === yrA) || defaultRow(yrA)
  const b = rows.find(r => r.year === yrB) || defaultRow(yrB)

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
    convRate: parseFloat((a.convRate - b.convRate).toFixed(2))
  }

  return { a, b, deltas }
}





