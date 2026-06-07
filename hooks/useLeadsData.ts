// hooks/useLeadsData.ts
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react'
import { LeadsMonthlyRow, LeadsDetailRow, LeadsKPI, LeadsFunnelData } from '@/lib/types'
import { getLeadsKPI, getLeadsFunnel } from '@/lib/sheets'

interface LeadsDataResult {
  monthly: LeadsMonthlyRow[]
  detail: LeadsDetailRow[]
  loading: boolean
  refreshing: boolean
  error: string | null
  isMock: boolean
  fallbackReason: string | null
  lastUpdated: string
  refresh: () => Promise<void>
}

// Global cached state to avoid double-fetching across page switches
let globalLeadsCache: {
  monthly: LeadsMonthlyRow[]
  detail: LeadsDetailRow[]
  isMock: boolean
  lastUpdated: string
} | null = null

export function useLeadsData(): LeadsDataResult {
  const [monthly, setMonthly] = useState<LeadsMonthlyRow[]>(globalLeadsCache?.monthly || [])
  const [detail, setDetail] = useState<LeadsDetailRow[]>(globalLeadsCache?.detail || [])
  const [isMock, setIsMock] = useState(globalLeadsCache?.isMock || false)
  const [fallbackReason, setFallbackReason] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(globalLeadsCache?.lastUpdated || '')
  const [loading, setLoading] = useState(globalLeadsCache ? false : true)
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
      const isTelecrm = typeof window !== 'undefined' 
        && localStorage.getItem('client-telecrm-api-token') 
        && localStorage.getItem('client-telecrm-enterprise-id')

      let url = ''
      const headers: Record<string, string> = {}

      if (isTelecrm) {
        url = isManualRefresh ? '/api/leads/trend?months=12&refresh=true' : '/api/leads/trend?months=12'
        const clientToken = localStorage.getItem('client-telecrm-api-token')
        const clientEnterpriseId = localStorage.getItem('client-telecrm-enterprise-id')
        if (clientToken) headers['x-telecrm-api-token'] = clientToken
        if (clientEnterpriseId) headers['x-telecrm-enterprise-id'] = clientEnterpriseId
      } else {
        url = isManualRefresh ? '/api/leads?refresh=true' : '/api/leads'
        if (typeof window !== 'undefined') {
          const clientLeadsSheetId = localStorage.getItem('client-leads-sheet-id')
          const clientApiKey = localStorage.getItem('client-api-key')
          const hasActiveConfig = localStorage.getItem('active-sheet-config') !== null

          if (hasActiveConfig) {
            url += (url.includes('?') ? '&' : '?') + `sheetId=${encodeURIComponent(clientLeadsSheetId || 'mock')}`
            if (clientApiKey) {
              url += `&apiKey=${encodeURIComponent(clientApiKey)}`
            }
          }
        }
      }

      const res = await fetch(url, { headers })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to load leads data: status ${res.status}`)
      }

      const payload = await res.json()

      let monthlyRows: LeadsMonthlyRow[] = []
      let detailRows: LeadsDetailRow[] = []
      let mockStatus = false
      let updatedTime = ''

      if (isTelecrm) {
        monthlyRows = Array.isArray(payload) ? payload : []
        detailRows = []
        mockStatus = false
        updatedTime = new Date().toISOString()
      } else {
        monthlyRows = payload.monthly || []
        detailRows = payload.detail || []
        mockStatus = payload.isMock || false
        updatedTime = payload.lastUpdated || ''
      }

      globalLeadsCache = {
        monthly: monthlyRows,
        detail: detailRows,
        isMock: mockStatus,
        lastUpdated: updatedTime
      }

      setMonthly(monthlyRows)
      setDetail(detailRows)
      setIsMock(mockStatus)
      setFallbackReason(payload.fallbackReason ?? null)
      setLastUpdated(updatedTime)
    } catch (err: any) {
      console.error('Error fetching leads data hook:', err)
      setError(err?.message || 'Unknown network error loading leads.')
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

  useEffect(() => {
    const handleConfigChange = () => {
      globalLeadsCache = null
      setMonthly([])
      setDetail([])
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
    monthly,
    detail,
    loading,
    refreshing,
    error,
    isMock,
    fallbackReason,
    lastUpdated,
    refresh: () => loadData(true)
  }
}

export function useLeadsKPI(monthlyRows: LeadsMonthlyRow[]): LeadsKPI | null {
  return useMemo(() => {
    if (!monthlyRows || monthlyRows.length === 0) return null
    return getLeadsKPI(monthlyRows)
  }, [monthlyRows])
}

export function useLeadsFunnel(monthlyRows: LeadsMonthlyRow[], month?: string): LeadsFunnelData | null {
  return useMemo(() => {
    if (!monthlyRows || monthlyRows.length === 0) return null
    return getLeadsFunnel(monthlyRows, month)
  }, [monthlyRows, month])
}
