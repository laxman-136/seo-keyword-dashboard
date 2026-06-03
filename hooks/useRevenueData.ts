// hooks/useRevenueData.ts
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react'
import { RevenueMonthlyRow, RevenueCourseRow, RevenueKPI, AdSpendBreakdown } from '@/lib/types'
import { getRevenueKPI, getAdSpendBreakdown } from '@/lib/sheets'

interface RevenueDataResult {
  monthly: RevenueMonthlyRow[]
  courses: RevenueCourseRow[]
  loading: boolean
  refreshing: boolean
  error: string | null
  isMock: boolean
  fallbackReason: string | null
  lastUpdated: string
  refresh: () => Promise<void>
}

// Global cached state to avoid double-fetching across page switches
let globalRevenueCache: {
  monthly: RevenueMonthlyRow[]
  courses: RevenueCourseRow[]
  isMock: boolean
  lastUpdated: string
} | null = null

export function useRevenueData(): RevenueDataResult {
  const [monthly, setMonthly] = useState<RevenueMonthlyRow[]>(globalRevenueCache?.monthly || [])
  const [courses, setCourses] = useState<RevenueCourseRow[]>(globalRevenueCache?.courses || [])
  const [isMock, setIsMock] = useState(globalRevenueCache?.isMock || false)
  const [fallbackReason, setFallbackReason] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(globalRevenueCache?.lastUpdated || '')
  const [loading, setLoading] = useState(globalRevenueCache ? false : true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true)
    } else if (monthly.length === 0) {
      setLoading(true)
    }
    setError(null)

    try {
      let url = isManualRefresh ? '/api/revenue?refresh=true' : '/api/revenue'

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
        throw new Error(`Failed to load revenue data: ${res.statusText}`)
      }

      const payload = await res.json()

      globalRevenueCache = {
        monthly: payload.monthly || [],
        courses: payload.courses || [],
        isMock: payload.isMock,
        lastUpdated: payload.lastUpdated || ''
      }

      setMonthly(payload.monthly || [])
      setCourses(payload.courses || [])
      setIsMock(payload.isMock)
      setFallbackReason(payload.fallbackReason ?? null)
      setLastUpdated(payload.lastUpdated || '')
    } catch (err: any) {
      console.error('Error fetching revenue data hook:', err)
      setError(err?.message || 'Unknown network error loading revenue.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [monthly.length])

  useEffect(() => {
    if (monthly.length === 0) {
      loadData()
    }
  }, [loadData, monthly.length])

  return {
    monthly,
    courses,
    loading,
    refreshing,
    error,
    isMock,
    fallbackReason,
    lastUpdated,
    refresh: () => loadData(true)
  }
}

export function useRevenueKPI(rows: RevenueMonthlyRow[]): RevenueKPI | null {
  return useMemo(() => {
    if (!rows || rows.length === 0) return null
    return getRevenueKPI(rows)
  }, [rows])
}

export function useAdSpendAnalysis(courseRows: RevenueCourseRow[], month?: string): AdSpendBreakdown[] {
  return useMemo(() => {
    if (!courseRows || courseRows.length === 0) return []
    return getAdSpendBreakdown(courseRows, month)
  }, [courseRows, month])
}
