// hooks/useDailyKeywordData.ts
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { ProcessedKeyword } from '@/lib/types'
import { getPageBand, getMovement, getVsLastMonthLabel } from '@/lib/calculations'

export interface DailyKeywordRow {
  date: string
  keyword: string
  group: string
  page: number
  position: number
}

export interface DailyKeywordStats {
  date: string
  prevDate: string
  p1Top: number
  prevP1Top: number
  p1Good: number
  prevP1Good: number
  page2: number
  prevPage2: number
  page3: number
  prevPage3: number
  page4Plus: number
  prevPage4Plus: number
  notRanking: number
  prevNotRanking: number
  improved: number
  neutral: number
  dropped: number
  newEntries: number
  lostRankings: number
}

interface DailyKeywordResult {
  rawRows: DailyKeywordRow[]
  dates: string[]
  latestDate: string | null
  prevDate: string | null
  keywords: ProcessedKeyword[] // Latest date keywords as ProcessedKeyword
  stats: DailyKeywordStats | null
  loading: boolean
  refreshing: boolean
  error: string | null
  isMock: boolean
  fallbackReason: string | null
  lastUpdated: string
  refresh: () => Promise<void>
}

let globalDailyKeywordCache: {
  rawRows: DailyKeywordRow[]
  isMock: boolean
  lastUpdated: string
} | null = null

function parseDailyKeywordValues(values: string[][]): DailyKeywordRow[] {
  if (!values || values.length <= 1) return []

  const rows: DailyKeywordRow[] = []

  for (let i = 1; i < values.length; i++) {
    const row = values[i]
    if (!row || row.length === 0 || !row[1]) continue // Index 1 is Keyword

    const date = row[0]?.trim() || ''
    const keyword = row[1]?.trim() || ''
    const group = row[2]?.trim() || 'Unassigned'
    const page = parseInt(row[3] || '0', 10)
    const position = parseInt(row[4] || '0', 10)

    rows.push({
      date,
      keyword,
      group,
      page,
      position
    })
  }

  return rows
}

export function useDailyKeywordData(): DailyKeywordResult {
  const [rawRows, setRawRows] = useState<DailyKeywordRow[]>(globalDailyKeywordCache?.rawRows || [])
  const [isMock, setIsMock] = useState(globalDailyKeywordCache?.isMock || false)
  const [fallbackReason, setFallbackReason] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(globalDailyKeywordCache?.lastUpdated || '')
  const [loading, setLoading] = useState(globalDailyKeywordCache ? false : true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true)
    } else if (rawRows.length === 0) {
      setLoading(true)
    }
    setError(null)

    try {
      let url = isManualRefresh ? '/api/keywords/daily?refresh=true' : '/api/keywords/daily'

      if (typeof window !== 'undefined') {
        const clientSeoSheetId = localStorage.getItem('client-seo-sheet-id')
        const clientApiKey = localStorage.getItem('client-api-key')
        const hasActiveConfig = localStorage.getItem('active-sheet-config') !== null

        if (hasActiveConfig) {
          url += (url.includes('?') ? '&' : '?') + `sheetId=${encodeURIComponent(clientSeoSheetId || 'mock')}`
          if (clientApiKey) {
            url += `&apiKey=${encodeURIComponent(clientApiKey)}`
          }
        }
      }

      const res = await fetch(url)

      if (!res.ok) {
        throw new Error(`Failed to load daily keyword data: ${res.statusText}`)
      }

      const payload = await res.json()
      const parsedRows = parseDailyKeywordValues(payload.values || [])

      globalDailyKeywordCache = {
        rawRows: parsedRows,
        isMock: payload.isMock,
        lastUpdated: payload.lastUpdated || ''
      }

      setRawRows(parsedRows)
      setIsMock(payload.isMock)
      setFallbackReason(payload.fallbackReason ?? null)
      setLastUpdated(payload.lastUpdated || '')
    } catch (err: any) {
      console.error('Error fetching daily keyword data hook:', err)
      setError(err?.message || 'Unknown network error loading daily keyword rankings.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [rawRows.length])

  useEffect(() => {
    if (rawRows.length === 0) {
      loadData()
    }
  }, [loadData, rawRows.length])

  useEffect(() => {
    const handleConfigChange = () => {
      globalDailyKeywordCache = null
      setRawRows([])
      setLoading(true)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('active-config-updated', handleConfigChange)
      return () => {
        window.removeEventListener('active-config-updated', handleConfigChange)
      }
    }
  }, [])

  // Process data chronologically and calculate statistics
  const processed = useMemo(() => {
    if (rawRows.length === 0) {
      return { dates: [], latestDate: null, prevDate: null, keywords: [], stats: null }
    }

    // 1. Find all unique dates
    const uniqueDates = Array.from(new Set(rawRows.map(r => r.date))).sort()
    if (uniqueDates.length === 0) {
      return { dates: [], latestDate: null, prevDate: null, keywords: [], stats: null }
    }

    const latestDate = uniqueDates[uniqueDates.length - 1]
    const prevDate = uniqueDates.length > 1 ? uniqueDates[uniqueDates.length - 2] : latestDate

    // 2. Filter rows for latest and previous dates
    const latestKeywords = rawRows.filter(r => r.date === latestDate)
    const prevKeywords = rawRows.filter(r => r.date === prevDate)

    const prevMap = new Map<string, DailyKeywordRow>()
    prevKeywords.forEach(k => prevMap.set(k.keyword, k))

    // 3. Compute stats for latest date
    let p1Top = 0
    let p1Good = 0
    let page2 = 0
    let page3 = 0
    let page4Plus = 0
    let notRanking = 0

    latestKeywords.forEach(k => {
      const pos = k.position
      if (pos === 0) notRanking++
      else if (pos >= 1 && pos <= 4) p1Top++
      else if (pos >= 5 && pos <= 10) p1Good++
      else if (pos >= 11 && pos <= 20) page2++
      else if (pos >= 21 && pos <= 30) page3++
      else page4Plus++
    })

    // Compute stats for previous date
    let prevP1Top = 0
    let prevP1Good = 0
    let prevPage2 = 0
    let prevPage3 = 0
    let prevPage4Plus = 0
    let prevNotRanking = 0

    prevKeywords.forEach(k => {
      const pos = k.position
      if (pos === 0) prevNotRanking++
      else if (pos >= 1 && pos <= 4) prevP1Top++
      else if (pos >= 5 && pos <= 10) prevP1Good++
      else if (pos >= 11 && pos <= 20) prevPage2++
      else if (pos >= 21 && pos <= 30) prevPage3++
      else prevPage4Plus++
    })

    // 4. Calculate day-over-day movement trends
    let improved = 0
    let neutral = 0
    let dropped = 0
    let newEntries = 0
    let lostRankings = 0

    latestKeywords.forEach(k => {
      const prev = prevMap.get(k.keyword)
      const currentPos = k.position

      if (!prev) {
        // Keyword was not tracked on the previous date
        if (currentPos > 0) {
          newEntries++
          improved++
        } else {
          neutral++
        }
      } else {
        const prevPos = prev.position

        if (prevPos === 0 && currentPos > 0) {
          // Gained ranking
          newEntries++
          improved++
        } else if (prevPos > 0 && currentPos === 0) {
          // Lost ranking
          lostRankings++
          dropped++
        } else if (currentPos > 0 && currentPos < prevPos) {
          // Rank improved (smaller number is better rank)
          improved++
        } else if (currentPos > 0 && currentPos > prevPos) {
          // Rank dropped
          dropped++
        } else {
          neutral++
        }
      }
    })

    // Find any keywords that were in prev but disappeared entirely from latest
    const latestSet = new Set(latestKeywords.map(k => k.keyword))
    prevKeywords.forEach(prev => {
      if (!latestSet.has(prev.keyword) && prev.position > 0) {
        lostRankings++
        dropped++
      }
    })

    const stats: DailyKeywordStats = {
      date: latestDate,
      prevDate,
      p1Top,
      prevP1Top,
      p1Good,
      prevP1Good,
      page2,
      prevPage2,
      page3,
      prevPage3,
      page4Plus,
      prevPage4Plus,
      notRanking,
      prevNotRanking,
      improved,
      neutral,
      dropped,
      newEntries,
      lostRankings
    }

    const keywords: ProcessedKeyword[] = latestKeywords.map(k => {
      const prev = prevMap.get(k.keyword)
      const prevPage = prev?.page || 0
      const prevPosition = prev?.position || 0
      const pageBand = getPageBand(k.page, k.position)
      const movement = getMovement(k.page, k.position, prevPage, prevPosition)
      const vsLastMonthLabel = getVsLastMonthLabel(k.page, k.position, prevPage, prevPosition)
      
      const status = k.position > 0 && k.position <= 10 
        ? 'Ranking Well' 
        : k.position > 0 
          ? 'Needs Work' 
          : 'Not Ranking'

      return {
        keyword: k.keyword,
        group: k.group,
        monthlyData: {},
        status,
        priority: 'Medium',
        notes: '',
        currentMonth: latestDate || '',
        previousMonth: prevDate || '',
        currentPage: k.page,
        currentPosition: k.position,
        prevPage,
        prevPosition,
        pageBand,
        movement,
        vsLastMonthLabel
      }
    })

    return {
      dates: uniqueDates,
      latestDate,
      prevDate,
      keywords,
      stats
    }
  }, [rawRows])

  return {
    rawRows,
    dates: processed.dates,
    latestDate: processed.latestDate,
    prevDate: processed.prevDate,
    keywords: processed.keywords,
    stats: processed.stats,
    loading,
    refreshing,
    error,
    isMock,
    fallbackReason,
    lastUpdated,
    refresh: () => loadData(true)
  }
}
