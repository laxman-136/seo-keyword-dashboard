// hooks/useKeywordData.ts
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { KeywordRow, ProcessedKeyword, DashboardStats, GroupSummary } from '@/lib/types'
import { processKeywords, calculateDashboardStats, calculateGroupSummaries } from '@/lib/calculations'

interface KeywordDataResult {
  keywords: ProcessedKeyword[]
  rawKeywords: KeywordRow[]
  months: string[]
  stats: DashboardStats | null
  groupSummaries: GroupSummary[]
  isMock: boolean
  fallbackReason: string | null
  lastUpdated: string
  loading: boolean
  refreshing: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useKeywordData(): KeywordDataResult {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [rawKeywords, setRawKeywords] = useState<KeywordRow[]>([])
  const [months, setMonths] = useState<string[]>([])
  const [isMock, setIsMock] = useState(false)
  const [fallbackReason, setFallbackReason] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState('')

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      let url = isManualRefresh ? '/api/keywords?refresh=true' : '/api/keywords'
      
      if (typeof window !== 'undefined') {
        const clientSheetId = localStorage.getItem('client-sheet-id')
        const clientApiKey = localStorage.getItem('client-api-key')
        
        if (clientSheetId) {
          url += (url.includes('?') ? '&' : '?') + `sheetId=${encodeURIComponent(clientSheetId)}`
        }
        if (clientApiKey) {
          url += (url.includes('?') ? '&' : '?') + `apiKey=${encodeURIComponent(clientApiKey)}`
        }
      }

      const res = await fetch(url)
      
      if (!res.ok) {
        throw new Error(`Failed to load keyword data: ${res.statusText}`)
      }

      const payload = await res.json()
      
      setRawKeywords(payload.rows)
      setMonths(payload.months)
      setIsMock(payload.isMock)
      setFallbackReason(payload.fallbackReason ?? null)
      setLastUpdated(payload.lastUpdated)
    } catch (err: any) {
      console.error('Error fetching keyword data hook:', err)
      setError(err?.message || 'Unknown network error loading rankings.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Process the raw data based on current detected months
  const processed = useMemoData(rawKeywords, months)

  return {
    keywords: processed.keywords,
    rawKeywords,
    months,
    stats: processed.stats,
    groupSummaries: processed.groupSummaries,
    isMock,
    fallbackReason,
    lastUpdated,
    loading,
    refreshing,
    error,
    refresh: () => loadData(true)
  }
}

// Internal helper memo to avoid recalculating stats on every render
function useMemoData(rawKeywords: KeywordRow[], months: string[]) {
  return useMemo(() => {
    if (rawKeywords.length === 0 || months.length < 2) {
      return { keywords: [], stats: null, groupSummaries: [] }
    }

    const currentMonth = months[months.length - 1]
    const previousMonth = months[months.length - 2]

    const keywords = processKeywords(rawKeywords, currentMonth, previousMonth)
    const stats = calculateDashboardStats(keywords, currentMonth, previousMonth)
    const groupSummaries = calculateGroupSummaries(keywords)

    return { keywords, stats, groupSummaries }
  }, [rawKeywords, months])
}
