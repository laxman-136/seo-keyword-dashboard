'use client';

import React, { useState, useEffect, useCallback } from 'react'
import { SiteStatusPageRow } from '@/lib/types'

interface SiteStatusDataResult {
  rows: SiteStatusPageRow[]
  months: string[]
  loading: boolean
  refreshing: boolean
  error: string | null
  isMock: boolean
  fallbackReason: string | null
  lastUpdated: string
  refresh: () => Promise<void>
}

let globalSiteStatusCache: { rows: SiteStatusPageRow[]; months: string[]; isMock: boolean; lastUpdated: string } | null = null

export function useSiteStatusData(): SiteStatusDataResult {
  const [rows, setRows] = useState<SiteStatusPageRow[]>(globalSiteStatusCache?.rows || [])
  const [months, setMonths] = useState<string[]>(globalSiteStatusCache?.months || [])
  const [isMock, setIsMock] = useState(globalSiteStatusCache?.isMock || false)
  const [fallbackReason, setFallbackReason] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(globalSiteStatusCache?.lastUpdated || '')
  const [loading, setLoading] = useState(globalSiteStatusCache ? false : true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else if (rows.length === 0) setLoading(true)
    setError(null)

    try {
      let url = isManualRefresh ? '/api/site-status?refresh=true' : '/api/site-status'

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
      if (!res.ok) throw new Error(`Failed to load site status: ${res.statusText}`)
      const payload = await res.json()

      // payload for grouped parser: { rows: SiteStatusPageRow[], months: string[] }
      const parsedRows = payload.rows || []

      globalSiteStatusCache = { rows: parsedRows, months: payload.months || [], isMock: payload.isMock, lastUpdated: payload.lastUpdated }
      setRows(parsedRows)
      setMonths(payload.months || [])
      setIsMock(payload.isMock)
      setFallbackReason(payload.fallbackReason ?? null)
      setLastUpdated(payload.lastUpdated)
    } catch (err: any) {
      console.error('Error fetching site status hook:', err)
      setError(err?.message || 'Unknown network error loading site status')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [rows.length])

  useEffect(() => { if (rows.length === 0) loadData() }, [loadData, rows.length])

  useEffect(() => {
    const handleConfigChange = () => {
      globalSiteStatusCache = null
      setRows([])
      setMonths([])
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
    months,
    loading,
    refreshing,
    error,
    isMock,
    fallbackReason,
    lastUpdated,
    refresh: () => loadData(true)
  }
}
