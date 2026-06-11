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
let globalLeadsCache: Record<string, {
  monthly: LeadsMonthlyRow[]
  detail: LeadsDetailRow[]
  isMock: boolean
  lastUpdated: string
}> = {}

export function useLeadsData(selectedCourse = 'all'): LeadsDataResult {
  const [monthly, setMonthly] = useState<LeadsMonthlyRow[]>([])
  const [detail, setDetail] = useState<LeadsDetailRow[]>([])
  const [isMock, setIsMock] = useState(false)
  const [fallbackReason, setFallbackReason] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cached = globalLeadsCache[selectedCourse]
    if (cached) {
      setMonthly(cached.monthly)
      setDetail(cached.detail)
      setIsMock(cached.isMock)
      setLastUpdated(cached.lastUpdated)
      setLoading(false)
    } else {
      setMonthly([])
      setDetail([])
      setLoading(true)
    }
  }, [selectedCourse])

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true)
    } else if (!globalLeadsCache[selectedCourse]) {
      setLoading(true)
    }
    setError(null)

    try {
      const clientLeadsSheetId = typeof window !== 'undefined' ? localStorage.getItem('client-leads-sheet-id') : null
      const hasSheetsLeads = !!(clientLeadsSheetId && clientLeadsSheetId !== 'mock' && clientLeadsSheetId.trim() !== '')

      const clientToken = typeof window !== 'undefined' ? localStorage.getItem('client-telecrm-api-token') : null
      const clientEnterpriseId = typeof window !== 'undefined' ? localStorage.getItem('client-telecrm-enterprise-id') : null
      const hasTelecrmLocal = !!(clientToken && clientEnterpriseId)

      const isTelecrm = hasTelecrmLocal || !hasSheetsLeads

      let url = ''
      const headers: Record<string, string> = {}

      if (isTelecrm) {
        const courseParam = selectedCourse !== 'all' ? `&course=${encodeURIComponent(selectedCourse)}` : ''
        url = isManualRefresh ? `/api/leads/trend?months=12&refresh=true${courseParam}` : `/api/leads/trend?months=12${courseParam}`
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

      globalLeadsCache[selectedCourse] = {
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
  }, [selectedCourse])

  useEffect(() => {
    if (!globalLeadsCache[selectedCourse]) {
      loadData()
    }
  }, [loadData, selectedCourse])

  useEffect(() => {
    const handleConfigChange = () => {
      globalLeadsCache = {}
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
