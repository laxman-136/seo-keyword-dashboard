// lib/calculations.ts
import { PageBand, Movement, ProcessedKeyword, DashboardStats, GroupSummary, KeywordRow } from './types'

export function getPageBand(page: number, position: number): PageBand {
  if (page === 0) return 'Not Ranking'
  if (page === 1 && position <= 4) return 'P1 Top (1-4)'
  if (page === 1 && position <= 10) return 'P1 Good (5-10)'
  if (page === 2) return 'Page 2'
  if (page === 3) return 'Page 3'
  return 'Page 4+'
}

export function getMovement(
  currentPage: number, currentPos: number,
  prevPage: number, prevPos: number
): Movement {
  if (prevPage === 0 && currentPage === 0) return 'No Data'
  if (prevPage === 0 && currentPage > 0) return 'New Entry'
  if (currentPage === 0 && prevPage > 0) return 'Lost Ranking'
  if (currentPage < prevPage) return 'Improved'
  if (currentPage > prevPage) return 'Dropped'
  if (currentPos < prevPos) return 'Improved'
  if (currentPos > prevPos) return 'Dropped'
  return 'Neutral'
}

export function getVsLastMonthLabel(
  currentPage: number, currentPos: number,
  prevPage: number, prevPos: number
): string {
  const movement = getMovement(currentPage, currentPos, prevPage, prevPos)
  if (movement === 'No Data') return '—'
  if (movement === 'New Entry') return '🆕 New'
  if (movement === 'Lost Ranking') return '❌ Lost'
  if (movement === 'Neutral') return '→ Same'
  if (currentPage !== prevPage) {
    const arrow = currentPage < prevPage ? '↑' : '↓'
    return `${arrow} P${prevPage}→P${currentPage}`
  }
  const arrow = currentPos < prevPos ? '↑' : '↓'
  return `${arrow} #${prevPos}→#${currentPos}`
}

export function detectMonths(headers: string[]): string[] {
  const monthMap = new Set<string>()
  // Support Jan-26, June-26, March-26, etc. followed by optionally " Page", " Position", " Positior" etc.
  const monthPattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)-\d{2}/i
  
  headers.forEach(h => {
    const match = h.match(monthPattern)
    if (match) {
      // Add the matched prefix (e.g. "June-26" or "May-26")
      monthMap.add(match[0])
    }
  })

  return Array.from(monthMap).sort((a, b) => {
    // Sort chronologically
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
    const [aMonth, aYear] = a.split('-')
    const [bMonth, bYear] = b.split('-')
    
    const yearA = parseInt(aYear, 10) || 0
    const yearB = parseInt(bYear, 10) || 0
    
    if (yearA !== yearB) return yearA - yearB
    
    const aIndex = months.findIndex(m => aMonth.toLowerCase().startsWith(m))
    const bIndex = months.findIndex(m => bMonth.toLowerCase().startsWith(m))
    
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex)
  })
}

/**
 * Process raw keywords with detected/specified current and previous months
 */
export function processKeywords(
  rows: KeywordRow[],
  currentMonth: string,
  previousMonth: string
): ProcessedKeyword[] {
  return rows.map(row => {
    const curData = row.monthlyData[currentMonth] || { page: 0, position: 0 }
    const prevData = row.monthlyData[previousMonth] || { page: 0, position: 0 }

    const currentPage = curData.page
    const currentPosition = curData.position
    const prevPage = prevData.page
    const prevPosition = prevData.position

    const pageBand = getPageBand(currentPage, currentPosition)
    const movement = getMovement(currentPage, currentPosition, prevPage, prevPosition)
    const vsLastMonthLabel = getVsLastMonthLabel(currentPage, currentPosition, prevPage, prevPosition)

    return {
      ...row,
      currentMonth,
      previousMonth,
      currentPage,
      currentPosition,
      prevPage,
      prevPosition,
      pageBand,
      movement,
      vsLastMonthLabel
    }
  })
}

/**
 * Calculate dashboard overall stats
 */
export function calculateDashboardStats(
  processed: ProcessedKeyword[],
  currentMonth: string,
  previousMonth: string
): DashboardStats {
  const stats: DashboardStats = {
    totalKeywords: processed.length,
    p1Top: 0,
    p1Good: 0,
    page2: 0,
    page3: 0,
    page4Plus: 0,
    notRanking: 0,
    improved: 0,
    neutral: 0,
    dropped: 0,
    newEntries: 0,
    lostRankings: 0,
    currentMonth,
    previousMonth,
    prevP1Top: 0,
    prevP1Good: 0,
    prevPage2: 0,
    prevPage3: 0,
    prevPage4Plus: 0,
    prevNotRanking: 0
  }

  processed.forEach(kw => {
    // Current month bands
    if (kw.pageBand === 'P1 Top (1-4)') stats.p1Top++
    else if (kw.pageBand === 'P1 Good (5-10)') stats.p1Good++
    else if (kw.pageBand === 'Page 2') stats.page2++
    else if (kw.pageBand === 'Page 3') stats.page3++
    else if (kw.pageBand === 'Page 4+') stats.page4Plus++
    else if (kw.pageBand === 'Not Ranking') stats.notRanking++

    // Previous month bands
    const prevBand = getPageBand(kw.prevPage, kw.prevPosition)
    if (prevBand === 'P1 Top (1-4)') stats.prevP1Top++
    else if (prevBand === 'P1 Good (5-10)') stats.prevP1Good++
    else if (prevBand === 'Page 2') stats.prevPage2++
    else if (prevBand === 'Page 3') stats.prevPage3++
    else if (prevBand === 'Page 4+') stats.prevPage4Plus++
    else if (prevBand === 'Not Ranking') stats.prevNotRanking++

    // Movement
    if (kw.movement === 'Improved') stats.improved++
    else if (kw.movement === 'Neutral') stats.neutral++
    else if (kw.movement === 'Dropped') stats.dropped++
    else if (kw.movement === 'New Entry') stats.newEntries++
    else if (kw.movement === 'Lost Ranking') stats.lostRankings++
  })

  return stats
}

/**
 * Calculate performance summaries per group
 */
export function calculateGroupSummaries(
  processed: ProcessedKeyword[]
): GroupSummary[] {
  const groupsMap: Record<string, GroupSummary> = {}

  processed.forEach(kw => {
    if (!groupsMap[kw.group]) {
      groupsMap[kw.group] = {
        name: kw.group,
        total: 0,
        p1Top: 0,
        p1Good: 0,
        page2: 0,
        page3: 0,
        page4Plus: 0,
        notRanking: 0,
        improved: 0,
        dropped: 0,
        neutral: 0
      }
    }

    const g = groupsMap[kw.group]
    g.total++

    // Current Bands
    if (kw.pageBand === 'P1 Top (1-4)') g.p1Top++
    else if (kw.pageBand === 'P1 Good (5-10)') g.p1Good++
    else if (kw.pageBand === 'Page 2') g.page2++
    else if (kw.pageBand === 'Page 3') g.page3++
    else if (kw.pageBand === 'Page 4+') g.page4Plus++
    else if (kw.pageBand === 'Not Ranking') g.notRanking++

    // Movement
    if (kw.movement === 'Improved' || kw.movement === 'New Entry') g.improved++
    else if (kw.movement === 'Dropped' || kw.movement === 'Lost Ranking') g.dropped++
    else if (kw.movement === 'Neutral') g.neutral++
  })

  return Object.values(groupsMap).sort((a, b) => a.name.localeCompare(b.name))
}

// ── TRAFFIC CALCULATIONS ──────────────────────────────────
import { TrafficRow, TrafficSource, TrafficCountry, TrafficAggregate, TrafficPeriodResult, QuarterlyData, YearlyData } from './types'

export const TRAFFIC_SOURCES: TrafficSource[] = [
  'Organic', 'Direct', 'Social', 'Video', 'Referral',
  'Paid Search', 'Cross Network', 'Display', 'Email', 'Unassigned'
]

export const TRAFFIC_COUNTRIES: TrafficCountry[] = [
  'India', 'USA', 'UAE', 'Saudi Arabia', 'Canada',
  'Pakistan', 'United Kingdom', 'Poland', 'Others'
]

const MONTHS_ORDER = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

/**
 * Return percentage change (positive = up, negative = down)
 */
export function getMovementPercent(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

/**
 * Sum all values across given rows
 */
export function aggregateTrafficRows(rows: TrafficRow[]): TrafficAggregate {
  const aggregate: TrafficAggregate = {
    totalUsers: 0,
    newUsers: 0,
    sources: {} as Record<TrafficSource, number>,
    countries: {} as Record<TrafficCountry, number>,
    topSource: 'Organic',
    topCountry: 'India'
  }

  // Initialize maps
  TRAFFIC_SOURCES.forEach(s => { aggregate.sources[s] = 0 })
  TRAFFIC_COUNTRIES.forEach(c => { aggregate.countries[c] = 0 })

  if (rows.length === 0) return aggregate

  rows.forEach(row => {
    aggregate.totalUsers += row.totalUsers
    aggregate.newUsers += row.newUsers

    TRAFFIC_SOURCES.forEach(s => {
      aggregate.sources[s] += row.sources[s] || 0
    })

    TRAFFIC_COUNTRIES.forEach(c => {
      aggregate.countries[c] += row.countries[c] || 0
    })
  })

  // Find Top Source
  let maxSourceVal = -1
  TRAFFIC_SOURCES.forEach(s => {
    if (aggregate.sources[s] > maxSourceVal) {
      maxSourceVal = aggregate.sources[s]
      aggregate.topSource = s
    }
  })

  // Find Top Country
  let maxCountryVal = -1
  TRAFFIC_COUNTRIES.forEach(c => {
    if (aggregate.countries[c] > maxCountryVal) {
      maxCountryVal = aggregate.countries[c]
      aggregate.topCountry = c
    }
  })

  return aggregate
}

/**
 * Filter rows by month (matches format "January-2024" or case-insensitive)
 */
export function filterByMonth(rows: TrafficRow[], monthLabel: string): TrafficRow[] {
  return rows.filter(r => r.month.toLowerCase() === monthLabel.toLowerCase())
}

/**
 * Filter rows by quarter
 */
export function filterByQuarter(rows: TrafficRow[], quarter: number, year: number): TrafficRow[] {
  return rows.filter(r => {
    const m = r.date.getMonth() // 0-11
    const y = r.date.getFullYear()
    const q = Math.floor(m / 3) + 1
    return q === quarter && y === year
  })
}

/**
 * Filter rows by year
 */
export function filterByYear(rows: TrafficRow[], year: number): TrafficRow[] {
  return rows.filter(r => r.date.getFullYear() === year)
}

/**
 * Returns available unique month strings, sorted chronologically
 */
export function getAvailableMonths(rows: TrafficRow[]): string[] {
  // Sort rows chronologically first
  const sorted = [...rows].sort((a, b) => a.date.getTime() - b.date.getTime())
  const months = sorted.map(r => r.month)
  return Array.from(new Set(months))
}

/**
 * Returns available years as sorted numbers
 */
export function getAvailableYears(rows: TrafficRow[]): number[] {
  const years = rows.map(r => r.date.getFullYear())
  return Array.from(new Set(years)).sort((a, b) => a - b)
}

/**
 * Parse a month label string like "January-2024" into helper object
 */
function parseMonthLabel(monthLabel: string) {
  const [mName, yStr] = monthLabel.split('-')
  const year = parseInt(yStr)
  const monthIdx = MONTHS_ORDER.indexOf(mName)
  return { year, monthIdx, mName }
}

/**
 * Detect immediately previous period
 */
function getPreviousPeriodLabel(
  currentLabel: string,
  mode: 'monthly' | 'quarterly' | 'yearly',
  availableMonths: string[]
): string {
  if (mode === 'yearly') {
    const yr = parseInt(currentLabel)
    return String(yr - 1)
  }

  if (mode === 'quarterly') {
    // Expect format like "q1-2024" or "Q1-2024"
    const [qStr, yrStr] = currentLabel.toLowerCase().split('-')
    const qNum = parseInt(qStr.replace('q', ''))
    const yr = parseInt(yrStr)

    if (qNum === 1) {
      return `q4-${yr - 1}`
    } else {
      return `q${qNum - 1}-${yr}`
    }
  }

  // Monthly mode: find index in available months
  const currentIdx = availableMonths.findIndex(m => m.toLowerCase() === currentLabel.toLowerCase())
  if (currentIdx > 0) {
    return availableMonths[currentIdx - 1]
  }

  // Fallback: subtract 1 month
  const { year, monthIdx } = parseMonthLabel(currentLabel)
  let prevMonthIdx = monthIdx - 1
  let prevYear = year
  if (prevMonthIdx < 0) {
    prevMonthIdx = 11
    prevYear -= 1
  }
  return `${MONTHS_ORDER[prevMonthIdx]}-${prevYear}`
}

/**
 * Aggregates current and comparison periods defensively
 */
export function getTrafficPeriod(
  rows: TrafficRow[],
  mode: 'monthly' | 'quarterly' | 'yearly',
  currentPeriod?: string,
  comparePeriod?: string
): TrafficPeriodResult {
  const availableMonths = getAvailableMonths(rows)
  const availableYears = getAvailableYears(rows)

  let curLabel = currentPeriod || ''
  let prevLabel = comparePeriod || ''

  // 1. Auto-detect Current Period
  if (!curLabel) {
    if (mode === 'yearly' && availableYears.length > 0) {
      curLabel = String(availableYears[availableYears.length - 1])
    } else if (mode === 'quarterly' && rows.length > 0) {
      // Find latest date in rows
      const latestRow = [...rows].sort((a, b) => b.date.getTime() - a.date.getTime())[0]
      if (latestRow) {
        const y = latestRow.date.getFullYear()
        const q = Math.floor(latestRow.date.getMonth() / 3) + 1
        curLabel = `q${q}-${y}`
      } else {
        curLabel = 'q1-2024'
      }
    } else if (mode === 'monthly' && availableMonths.length > 0) {
      curLabel = availableMonths[availableMonths.length - 1]
    } else {
      curLabel = 'January-2024'
    }
  }

  // 2. Auto-detect Comparison Period
  if (!prevLabel) {
    prevLabel = getPreviousPeriodLabel(curLabel, mode, availableMonths)
  }

  // 3. Filter and Aggregate
  let curRows: TrafficRow[] = []
  let prevRows: TrafficRow[] = []

  if (mode === 'yearly') {
    const yrCur = parseInt(curLabel)
    const yrPrev = parseInt(prevLabel)
    curRows = filterByYear(rows, yrCur)
    prevRows = filterByYear(rows, yrPrev)
  } else if (mode === 'quarterly') {
    const [qCurStr, yCurStr] = curLabel.toLowerCase().split('-')
    const qCur = parseInt(qCurStr.replace('q', ''))
    const yCur = parseInt(yCurStr)

    const [qPrevStr, yPrevStr] = prevLabel.toLowerCase().split('-')
    const qPrev = parseInt(qPrevStr.replace('q', ''))
    const yPrev = parseInt(yPrevStr)

    curRows = filterByQuarter(rows, qCur, yCur)
    prevRows = filterByQuarter(rows, qPrev, yPrev)
  } else {
    // monthly
    curRows = filterByMonth(rows, curLabel)
    prevRows = filterByMonth(rows, prevLabel)
  }

  const current = aggregateTrafficRows(curRows)
  const previous = aggregateTrafficRows(prevRows)

  // Format labels nicely
  const formatLabel = (label: string): string => {
    if (mode === 'quarterly') {
      const [qStr, yStr] = label.toUpperCase().split('-')
      return `${qStr} ${yStr}`
    }
    if (mode === 'monthly') {
      const [mName, yStr] = label.split('-')
      return `${mName} ${yStr}`
    }
    return label // yearly is just the year
  }

  return {
    current,
    previous,
    currentLabel: formatLabel(curLabel),
    previousLabel: formatLabel(prevLabel),
    mode
  }
}

/**
 * Returns Q1-Q4 breakdown records for all available years
 */
export function getQuarterlyBreakdown(rows: TrafficRow[]): QuarterlyData[] {
  const years = getAvailableYears(rows)
  const breakdown: QuarterlyData[] = []

  years.forEach(yr => {
    const q1Rows = filterByQuarter(rows, 1, yr)
    const q2Rows = filterByQuarter(rows, 2, yr)
    const q3Rows = filterByQuarter(rows, 3, yr)
    const q4Rows = filterByQuarter(rows, 4, yr)

    const q1Val = q1Rows.reduce((sum, r) => sum + r.totalUsers, 0)
    const q2Val = q2Rows.reduce((sum, r) => sum + r.totalUsers, 0)
    const q3Val = q3Rows.reduce((sum, r) => sum + r.totalUsers, 0)
    const q4Val = q4Rows.reduce((sum, r) => sum + r.totalUsers, 0)
    const total = q1Val + q2Val + q3Val + q4Val

    breakdown.push({
      year: yr,
      q1: q1Val,
      q2: q2Val,
      q3: q3Val,
      q4: q4Val,
      total
    })
  })

  return breakdown.sort((a, b) => b.year - a.year) // Sort descending (latest years first)
}

/**
 * Returns yearly breakdown records with YoY shifts
 */
export function getYearlyBreakdown(rows: TrafficRow[]): YearlyData[] {
  const years = getAvailableYears(rows)
  const breakdown: YearlyData[] = []

  years.forEach(yr => {
    const yrRows = filterByYear(rows, yr)
    const agg = aggregateTrafficRows(yrRows)

    breakdown.push({
      year: yr,
      totalUsers: agg.totalUsers,
      newUsers: agg.newUsers,
      topSource: agg.topSource,
      topCountry: agg.topCountry,
      yoyChange: null // computed next
    })
  })

  // Compute YoY changes
  for (let i = breakdown.length - 2; i >= 0; i--) {
    const current = breakdown[i]
    const prev = breakdown[i + 1]
    current.yoyChange = getMovementPercent(current.totalUsers, prev.totalUsers)
  }

  return breakdown // already sorted descending
}
