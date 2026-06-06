// hooks/useGoogleAdsData.ts
'use client';

import { useState, useEffect, useCallback } from 'react'
import { 
  GoogleAccountOverview, GoogleCampaign, GoogleAdGroup, GoogleAd,
  GoogleKeyword, GoogleSearchTerm, GoogleDeviceBreakdown, GoogleGeoBreakdown, GoogleDailyTrend 
} from '@/lib/types'
import { useDateRange } from './useDateRange'

function appendGoogleCredentials(url: string): string {
  if (typeof window === 'undefined') return url
  const hasActiveConfig = localStorage.getItem('active-sheet-config') !== null
  if (hasActiveConfig) {
    const devToken = localStorage.getItem('client-google-developer-token')
    const clientId = localStorage.getItem('client-google-client-id')
    const clientSecret = localStorage.getItem('client-google-client-secret')
    const refreshToken = localStorage.getItem('client-google-refresh-token')
    const customerId = localStorage.getItem('client-google-customer-id')
    const managerId = localStorage.getItem('client-google-manager-id')

    let res = url
    if (devToken) res += `&googleDeveloperToken=${encodeURIComponent(devToken)}`
    if (clientId) res += `&googleClientId=${encodeURIComponent(clientId)}`
    if (clientSecret) res += `&googleClientSecret=${encodeURIComponent(clientSecret)}`
    if (refreshToken) res += `&googleRefreshToken=${encodeURIComponent(refreshToken)}`
    if (customerId) res += `&googleCustomerId=${encodeURIComponent(customerId)}`
    if (managerId) res += `&googleManagerId=${encodeURIComponent(managerId)}`
    return res
  }
  return url
}

// 1. Google Account Overview Hook
export function useGoogleOverview() {
  const { preset, from, to } = useDateRange()
  const [data, setData] = useState<GoogleAccountOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      let url = `/api/ads/google/overview?preset=${preset}`
      if (preset === 'custom' && from && to) {
        url += `&from=${from}&to=${to}`
      }
      if (isRefresh) url += `&refresh=true`
      url = appendGoogleCredentials(url)

      const res = await fetch(url)
      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to fetch Google Overview')
      }
      const payload = await res.json()
      setData(payload)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Error loading Google Account Overview.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [preset, from, to])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { data, loading, refreshing, error, refresh: () => loadData(true) }
}

// 2. Google Campaigns Hook
export function useGoogleCampaigns() {
  const { preset, from, to } = useDateRange()
  const [campaigns, setCampaigns] = useState<GoogleCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      let url = `/api/ads/google/campaigns?preset=${preset}`
      if (preset === 'custom' && from && to) {
        url += `&from=${from}&to=${to}`
      }
      if (isRefresh) url += `&refresh=true`
      url = appendGoogleCredentials(url)

      const res = await fetch(url)
      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to fetch Google Campaigns')
      }
      const payload = await res.json()
      setCampaigns(payload.campaigns || [])
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Error loading Google Campaigns.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [preset, from, to])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { campaigns, loading, refreshing, error, refresh: () => loadData(true) }
}

// 3. Google Ad Groups Hook (Lazy loaded per Campaign)
export function useGoogleAdGroups(campaignId: string | null) {
  const { preset, from, to } = useDateRange()
  const [adGroups, setAdGroups] = useState<GoogleAdGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!campaignId) {
      setAdGroups([])
      return
    }

    let active = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        let url = `/api/ads/google/adgroups?campaignId=${campaignId}&preset=${preset}`
        if (preset === 'custom' && from && to) {
          url += `&from=${from}&to=${to}`
        }
        url = appendGoogleCredentials(url)
        const res = await fetch(url)
        if (!res.ok) {
          const errJson = await res.json()
          throw new Error(errJson.error || 'Failed to fetch ad groups')
        }
        const payload = await res.json()
        if (active) {
          setAdGroups(payload.adGroups || [])
        }
      } catch (err: any) {
        console.error(err)
        if (active) setError(err?.message || 'Error loading Ad Groups.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [campaignId, preset, from, to])

  return { adGroups, loading, error }
}

// 4. Google Ads Hook (Lazy loaded per Ad Group)
export function useGoogleAds(adGroupId: string | null) {
  const { preset, from, to } = useDateRange()
  const [ads, setAds] = useState<GoogleAd[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adGroupId) {
      setAds([])
      return
    }

    let active = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        let url = `/api/ads/google/ads?adGroupId=${adGroupId}&preset=${preset}`
        if (preset === 'custom' && from && to) {
          url += `&from=${from}&to=${to}`
        }
        url = appendGoogleCredentials(url)
        const res = await fetch(url)
        if (!res.ok) {
          const errJson = await res.json()
          throw new Error(errJson.error || 'Failed to fetch ads')
        }
        const payload = await res.json()
        if (active) {
          setAds(payload.ads || [])
        }
      } catch (err: any) {
        console.error(err)
        if (active) setError(err?.message || 'Error loading Google Ads list.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [adGroupId, preset, from, to])

  return { ads, loading, error }
}

// 5. Google Keywords Hook
export function useGoogleKeywords() {
  const { preset, from, to } = useDateRange()
  const [keywords, setKeywords] = useState<GoogleKeyword[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      let url = `/api/ads/google/keywords?preset=${preset}`
      if (preset === 'custom' && from && to) {
        url += `&from=${from}&to=${to}`
      }
      if (isRefresh) url += `&refresh=true`
      url = appendGoogleCredentials(url)

      const res = await fetch(url)
      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to fetch Google Keywords')
      }
      const payload = await res.json()
      setKeywords(payload.keywords || [])
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Error loading Google Keywords.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [preset, from, to])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { keywords, loading, refreshing, error, refresh: () => loadData(true) }
}

// 6. Google Search Terms Hook
export function useGoogleSearchTerms() {
  const { preset, from, to } = useDateRange()
  const [searchTerms, setSearchTerms] = useState<GoogleSearchTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      let url = `/api/ads/google/searchterms?preset=${preset}`
      if (preset === 'custom' && from && to) {
        url += `&from=${from}&to=${to}`
      }
      if (isRefresh) url += `&refresh=true`
      url = appendGoogleCredentials(url)

      const res = await fetch(url)
      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to fetch Google Search Terms')
      }
      const payload = await res.json()
      setSearchTerms(payload.searchTerms || [])
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Error loading Google Search Terms.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [preset, from, to])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { searchTerms, loading, refreshing, error, refresh: () => loadData(true) }
}

// 7. Google Details and Breakdowns Hook (Devices + Geo + Trend)
export function useGoogleDetails() {
  const { preset, from, to } = useDateRange()
  const [devices, setDevices] = useState<GoogleDeviceBreakdown | null>(null)
  const [locations, setLocations] = useState<GoogleGeoBreakdown | null>(null)
  const [trend, setTrend] = useState<GoogleDailyTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const suffix = `?preset=${preset}${preset === 'custom' && from && to ? `&from=${from}&to=${to}` : ''}${isRefresh ? '&refresh=true' : ''}`
      const devicesUrl = appendGoogleCredentials(`/api/ads/google/devices${suffix}`)
      const geoUrl = appendGoogleCredentials(`/api/ads/google/geo${suffix}`)
      const trendUrl = appendGoogleCredentials(`/api/ads/google/trend${suffix}`)
      
      const [devicesRes, geoRes, trendRes] = await Promise.all([
        fetch(devicesUrl),
        fetch(geoUrl),
        fetch(trendUrl)
      ])

      if (!devicesRes.ok || !geoRes.ok || !trendRes.ok) {
        throw new Error('Failed to load Google breakdown details')
      }

      const [dData, gData, tData] = await Promise.all([
        devicesRes.json(),
        geoRes.json(),
        trendRes.json()
      ])

      setDevices({ devices: dData.devices })
      setLocations({ locations: gData.locations })
      setTrend(tData.trend || [])
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Error loading Google breakdown details.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [preset, from, to])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { devices, locations, trend, loading, refreshing, error, refresh: () => loadData(true) }
}
