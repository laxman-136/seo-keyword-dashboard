// hooks/useDailyTrafficData.ts
'use client';

import React, { useState, useEffect, useCallback } from 'react'

export interface DailyTrafficRow {
  date: string
  totalUsers: number
  newUsers: number
  sources: {
    Organic: number
    Direct: number
    Social: number
    Video: number
    Referral: number
    'Paid Search': number
    'Cross Network': number
    Display: number
    Email: number
    Unassigned: number
  }
  countries: {
    India: number
    USA: number
    UAE: number
    'Saudi Arabia': number
    Canada: number
    Pakistan: number
    UK: number
    Poland: number
    Others: number
  }
}

interface DailyTrafficResult {
  rows: DailyTrafficRow[]
  loading: boolean
  refreshing: boolean
  error: string | null
  isMock: boolean
  fallbackReason: string | null
  lastUpdated: string
  refresh: () => Promise<void>
}

let globalDailyTrafficCache: {
  rows: DailyTrafficRow[]
  isMock: boolean
  lastUpdated: string
} | null = null

function parseDailyTrafficValues(values: string[][]): DailyTrafficRow[] {
  if (!values || values.length <= 1) return []

  const rows: DailyTrafficRow[] = []

  for (let i = 1; i < values.length; i++) {
    const row = values[i]
    if (!row || row.length === 0 || !row[0]) continue

    const date = row[0].trim()
    const totalUsers = parseInt(row[1] || '0', 10)
    const newUsers = parseInt(row[2] || '0', 10)

    const sources = {
      Organic: parseInt(row[3] || '0', 10),
      Direct: parseInt(row[4] || '0', 10),
      Social: parseInt(row[5] || '0', 10),
      Video: parseInt(row[6] || '0', 10),
      Referral: parseInt(row[7] || '0', 10),
      'Paid Search': parseInt(row[8] || '0', 10),
      'Cross Network': parseInt(row[9] || '0', 10),
      Display: parseInt(row[10] || '0', 10),
      Email: parseInt(row[11] || '0', 10),
      Unassigned: parseInt(row[12] || '0', 10)
    }

    const countries = {
      India: parseInt(row[13] || '0', 10),
      USA: parseInt(row[14] || '0', 10),
      UAE: parseInt(row[15] || '0', 10),
      'Saudi Arabia': parseInt(row[16] || '0', 10),
      Canada: parseInt(row[17] || '0', 10),
      Pakistan: parseInt(row[18] || '0', 10),
      UK: parseInt(row[19] || '0', 10),
      Poland: parseInt(row[20] || '0', 10),
      Others: parseInt(row[21] || '0', 10)
    }

    rows.push({
      date,
      totalUsers,
      newUsers,
      sources,
      countries
    })
  }

  // Sort dates chronologically
  return rows.sort((a, b) => a.date.localeCompare(b.date))
}

export function useDailyTrafficData(): DailyTrafficResult {
  const [rows, setRows] = useState<DailyTrafficRow[]>(globalDailyTrafficCache?.rows || [])
  const [isMock, setIsMock] = useState(globalDailyTrafficCache?.isMock || false)
  const [fallbackReason, setFallbackReason] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(globalDailyTrafficCache?.lastUpdated || '')
  const [loading, setLoading] = useState(globalDailyTrafficCache ? false : true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false)

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true)
    } else if (rows.length === 0) {
      setLoading(true)
    }
    setError(null)

    try {
      let url = isManualRefresh ? '/api/traffic/daily?refresh=true' : '/api/traffic/daily'

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
        throw new Error(`Failed to load daily traffic data: ${res.statusText}`)
      }

      const payload = await res.json()
      const parsedRows = parseDailyTrafficValues(payload.values || [])

      globalDailyTrafficCache = {
        rows: parsedRows,
        isMock: payload.isMock,
        lastUpdated: payload.lastUpdated || ''
      }

      setRows(parsedRows)
      setIsMock(payload.isMock)
      setFallbackReason(payload.fallbackReason ?? null)
      setLastUpdated(payload.lastUpdated || '')
    } catch (err: any) {
      console.error('Error fetching daily traffic data hook:', err)
      setError(err?.message || 'Unknown network error loading daily traffic.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [rows.length])

  useEffect(() => {
    if (rows.length === 0 && !hasFetched) {
      setHasFetched(true)
      loadData()
    }
  }, [loadData, rows.length, hasFetched])

  useEffect(() => {
    const handleConfigChange = () => {
      globalDailyTrafficCache = null
      setRows([])
      setHasFetched(false)
      setLoading(true)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('active-config-updated', handleConfigChange)
      return () => {
        window.removeEventListener('active-config-updated', handleConfigChange)
      }
    }
  }, [])

  return {
    rows,
    loading,
    refreshing,
    error,
    isMock,
    fallbackReason,
    lastUpdated,
    refresh: () => loadData(true)
  }
}
