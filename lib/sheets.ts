// lib/sheets.ts
import { KeywordRow, MonthData, TrafficRow, TrafficSource, TrafficCountry } from './types'
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
      lastUpdated: nowString
    }
  }

  try {
    const cacheBuster = bypassCache ? `&t=${Date.now()}` : ''
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Keywords?key=${apiKey}${cacheBuster}`
    
    // We use next: { revalidate: 3600 } for standard 1 hour revalidation caching unless bypassing
    const fetchOptions: RequestInit = bypassCache 
      ? { cache: 'no-store' } 
      : { next: { revalidate: 3600 } }

    const res = await fetch(url, fetchOptions)

    if (!res.ok) {
      throw new Error(`Google Sheets API responded with status ${res.status}`)
    }

    const data = await res.json()
    const { rows, months } = parseSheetGrid(data.values)

    return {
      rows,
      months,
      isMock: false,
      lastUpdated: nowString
    }
  } catch (error) {
    console.error('Failed to fetch from Google Sheets API. Falling back to mock data.', error)
    const mockGrid = getMockSheetsResponse()
    const { rows, months } = parseSheetGrid(mockGrid.values)
    return {
      rows,
      months,
      isMock: true,
      lastUpdated: nowString
    }
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
      lastUpdated: nowString
    }
  }

  try {
    const cacheBuster = bypassCache ? `&t=${Date.now()}` : ''
    // Fetch from Traffic tab
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Traffic?key=${apiKey}${cacheBuster}`
    
    const fetchOptions: RequestInit = bypassCache 
      ? { cache: 'no-store' } 
      : { next: { revalidate: 3600 } }

    const res = await fetch(url, fetchOptions)

    if (!res.ok) {
      throw new Error(`Google Sheets API responded with status ${res.status}`)
    }

    const data = await res.json()
    const rows = parseTrafficSheetGrid(data.values)

    return {
      rows,
      isMock: false,
      lastUpdated: nowString
    }
  } catch (error) {
    console.error('Failed to fetch from Google Sheets API (Traffic). Falling back to mock data.', error)
    const mockGrid = getMockTrafficSheetsResponse()
    const rows = parseTrafficSheetGrid(mockGrid.values)
    return {
      rows,
      isMock: true,
      lastUpdated: nowString
    }
  }
}
