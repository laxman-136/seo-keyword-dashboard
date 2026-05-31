// hooks/useTrafficData.ts
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { TrafficRow } from '@/lib/types'
import { getTrafficPeriod } from '@/lib/calculations'

interface TrafficDataResult {
  rows: TrafficRow[]
  loading: boolean
  refreshing: boolean
  error: string | null
  isMock: boolean
  lastUpdated: string
  refresh: () => Promise<void>
}

// Global cached state to avoid double-fetching across page switches
let globalTrafficCache: {
  rows: TrafficRow[]
  isMock: boolean
  lastUpdated: string
} | null = null

export function useTrafficData(): TrafficDataResult {
  const [rows, setRows] = useState<TrafficRow[]>(globalTrafficCache?.rows || [])
  const [isMock, setIsMock] = useState(globalTrafficCache?.isMock || false)
  const [lastUpdated, setLastUpdated] = useState(globalTrafficCache?.lastUpdated || '')
  const [loading, setLoading] = useState(globalTrafficCache ? false : true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true)
    } else if (rows.length === 0) {
      setLoading(true)
    }
    setError(null)

    try {
      let url = isManualRefresh ? '/api/traffic?refresh=true' : '/api/traffic'

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
        throw new Error(`Failed to load traffic data: ${res.statusText}`)
      }

      const payload = await res.json()
      
      // Parse ISO dates back to Date objects
      const parsedRows = payload.rows.map((r: any) => ({
        ...r,
        date: new Date(r.date)
      }))

      globalTrafficCache = {
        rows: parsedRows,
        isMock: payload.isMock,
        lastUpdated: payload.lastUpdated
      }

      setRows(parsedRows)
      setIsMock(payload.isMock)
      setLastUpdated(payload.lastUpdated)
    } catch (err: any) {
      console.error('Error fetching traffic data hook:', err)
      setError(err?.message || 'Unknown network error loading traffic.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [rows.length])

  useEffect(() => {
    if (rows.length === 0) {
      loadData()
    }
  }, [loadData, rows.length])

  return {
    rows,
    loading,
    refreshing,
    error,
    isMock,
    lastUpdated,
    refresh: () => loadData(true)
  }
}

export function useTrafficPeriod(
  mode: 'monthly' | 'quarterly' | 'yearly',
  current?: string,
  compare?: string
) {
  const { rows, loading, refreshing, error, isMock, lastUpdated, refresh } = useTrafficData()

  const period = useMemo(() => {
    if (rows.length === 0) return null
    return getTrafficPeriod(rows, mode, current, compare)
  }, [rows, mode, current, compare])

  return {
    period,
    rows,
    loading,
    refreshing,
    error,
    isMock,
    lastUpdated,
    refresh
  }
}
