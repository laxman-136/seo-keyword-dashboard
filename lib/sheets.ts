// lib/sheets.ts
import { KeywordRow, MonthData, TrafficRow, TrafficSource, TrafficCountry } from './types'
import { SiteStatusRow, SiteStatusPageRow, SiteStatusPageResult } from './types'
import { detectMonths, TRAFFIC_SOURCES, TRAFFIC_COUNTRIES } from './calculations'
import { getMockSheetsResponse } from './mockData'
import { getMockTrafficSheetsResponse } from './mockTrafficData'

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
  const sheetId = customSheetId || process.env.GOOGLE_SHEET_ID
  const apiKey = customApiKey || process.env.GOOGLE_SHEETS_API_KEY

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

async function fetchSheetValues(
  sheetId: string,
  apiKey: string,
  sheetName: string,
  bypassCache: boolean
): Promise<string[][]> {
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
    return data.values ?? []
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
  const sheetId = customSheetId || process.env.GOOGLE_SHEET_ID
  const apiKey = customApiKey || process.env.GOOGLE_SHEETS_API_KEY
  
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
  const sheetId = customSheetId || process.env.GOOGLE_SHEET_ID
  const apiKey = customApiKey || process.env.GOOGLE_SHEETS_API_KEY

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
