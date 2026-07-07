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
  searchVolumes?: Record<string, any>
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
  const [searchVolumes, setSearchVolumes] = useState<Record<string, any>>(globalDailyKeywordCache?.searchVolumes || {})
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
        lastUpdated: payload.lastUpdated || '',
        searchVolumes: payload.searchVolumes || {}
      }

      setRawRows(parsedRows)
      setSearchVolumes(payload.searchVolumes || {})
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
      setSearchVolumes({})
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

    // 1. Find all unique dates sorted chronologically
    const uniqueDates = Array.from(new Set(rawRows.map(r => r.date))).sort((a, b) => {
      const timeA = new Date(a).getTime()
      const timeB = new Date(b).getTime()
      if (isNaN(timeA) && isNaN(timeB)) return 0
      if (isNaN(timeA)) return 1
      if (isNaN(timeB)) return -1
      return timeA - timeB
    })
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

    // 3. Compute stats for latest date using standard getPageBand
    let p1Top = 0
    let p1Good = 0
    let page2 = 0
    let page3 = 0
    let page4Plus = 0
    let notRanking = 0

    latestKeywords.forEach(k => {
      const band = getPageBand(k.page, k.position)
      if (band === 'P1 Top (1-4)') p1Top++
      else if (band === 'P1 Good (5-10)') p1Good++
      else if (band === 'Page 2') page2++
      else if (band === 'Page 3') page3++
      else if (band === 'Page 4+') page4Plus++
      else notRanking++
    })

    // Compute stats for previous date
    let prevP1Top = 0
    let prevP1Good = 0
    let prevPage2 = 0
    let prevPage3 = 0
    let prevPage4Plus = 0
    let prevNotRanking = 0

    prevKeywords.forEach(k => {
      const band = getPageBand(k.page, k.position)
      if (band === 'P1 Top (1-4)') prevP1Top++
      else if (band === 'P1 Good (5-10)') prevP1Good++
      else if (band === 'Page 2') prevPage2++
      else if (band === 'Page 3') prevPage3++
      else if (band === 'Page 4+') prevPage4Plus++
      else prevNotRanking++
    })

    // 4. Calculate day-over-day movement trends using standard getMovement
    let improved = 0
    let neutral = 0
    let dropped = 0
    let newEntries = 0
    let lostRankings = 0

    latestKeywords.forEach(k => {
      const prev = prevMap.get(k.keyword)
      const prevPage = prev?.page || 0
      const prevPos = prev?.position || 0

      const movement = getMovement(k.page, k.position, prevPage, prevPos)

      if (movement === 'Improved') improved++
      else if (movement === 'Dropped') dropped++
      else if (movement === 'Neutral') neutral++
      else if (movement === 'New Entry') {
        newEntries++
        improved++
      } else if (movement === 'Lost Ranking') {
        lostRankings++
        dropped++
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

      const svData = searchVolumes?.[k.keyword] || {}

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
        vsLastMonthLabel,
        searchVolume: svData.searchVolume,
        competition: svData.competition,
        competitionIndex: svData.competitionIndex,
        monthlySearchVolumes: svData.monthlySearchVolumes
      }
    })

    return {
      dates: uniqueDates,
      latestDate,
      prevDate,
      keywords,
      stats
    }
  }, [rawRows, searchVolumes])

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
