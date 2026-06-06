// hooks/useAdsOverview.ts
'use client';

import { useState, useEffect, useCallback } from 'react'
import { AdsCombinedOverview } from '@/lib/types'
import { useDateRange } from './useDateRange'

interface AdsOverviewResult {
  data: AdsCombinedOverview | null
  loading: boolean
  refreshing: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdsOverview(): AdsOverviewResult {
  const { preset, from, to } = useDateRange()
  const [data, setData] = useState<AdsCombinedOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      let url = `/api/ads/overview?preset=${preset}`
      if (preset === 'custom' && from && to) {
        url += `&from=${from}&to=${to}`
      }
      if (isRefresh) {
        url += `&refresh=true`
      }

      if (typeof window !== 'undefined') {
        const hasActiveConfig = localStorage.getItem('active-sheet-config') !== null
        if (hasActiveConfig) {
          const metaAdAccountId = localStorage.getItem('client-meta-ad-account-id')
          const metaAccessToken = localStorage.getItem('client-meta-access-token')
          const googleDevToken = localStorage.getItem('client-google-developer-token')
          const googleClientId = localStorage.getItem('client-google-client-id')
          const googleClientSecret = localStorage.getItem('client-google-client-secret')
          const googleRefreshToken = localStorage.getItem('client-google-refresh-token')
          const googleCustomerId = localStorage.getItem('client-google-customer-id')
          const googleManagerId = localStorage.getItem('client-google-manager-id')

          if (metaAdAccountId) url += `&metaAdAccountId=${encodeURIComponent(metaAdAccountId)}`
          if (metaAccessToken) url += `&metaAccessToken=${encodeURIComponent(metaAccessToken)}`
          if (googleDevToken) url += `&googleDeveloperToken=${encodeURIComponent(googleDevToken)}`
          if (googleClientId) url += `&googleClientId=${encodeURIComponent(googleClientId)}`
          if (googleClientSecret) url += `&googleClientSecret=${encodeURIComponent(googleClientSecret)}`
          if (googleRefreshToken) url += `&googleRefreshToken=${encodeURIComponent(googleRefreshToken)}`
          if (googleCustomerId) url += `&googleCustomerId=${encodeURIComponent(googleCustomerId)}`
          if (googleManagerId) url += `&googleManagerId=${encodeURIComponent(googleManagerId)}`
        }
      }

      const res = await fetch(url)
      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || `Failed to fetch ads overview: ${res.statusText}`)
      }

      const payload = await res.json()
      setData(payload)
    } catch (err: any) {
      console.error('Error fetching ads overview:', err)
      setError(err?.message || 'Failed to load ads overview data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [preset, from, to])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    data,
    loading,
    refreshing,
    error,
    refresh: () => loadData(true)
  }
}
