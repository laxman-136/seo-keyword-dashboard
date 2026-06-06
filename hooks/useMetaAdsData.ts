// hooks/useMetaAdsData.ts
'use client';

import { useState, useEffect, useCallback } from 'react'
import { 
  MetaAccountOverview, MetaCampaign, MetaAdSet, MetaAd, 
  MetaPlacementBreakdown, MetaDemographicBreakdown, MetaDailyTrend 
} from '@/lib/types'
import { useDateRange } from './useDateRange'

function appendMetaCredentials(url: string): string {
  if (typeof window === 'undefined') return url
  const hasActiveConfig = localStorage.getItem('active-sheet-config') !== null
  if (hasActiveConfig) {
    const metaAdAccountId = localStorage.getItem('client-meta-ad-account-id')
    const metaAccessToken = localStorage.getItem('client-meta-access-token')
    let res = url
    if (metaAdAccountId) res += `&metaAdAccountId=${encodeURIComponent(metaAdAccountId)}`
    if (metaAccessToken) res += `&metaAccessToken=${encodeURIComponent(metaAccessToken)}`
    return res
  }
  return url
}

// 1. Meta Account Overview Hook
export function useMetaOverview() {
  const { preset, from, to } = useDateRange()
  const [data, setData] = useState<MetaAccountOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      let url = `/api/ads/meta/overview?preset=${preset}`
      if (preset === 'custom' && from && to) {
        url += `&from=${from}&to=${to}`
      }
      if (isRefresh) url += `&refresh=true`
      url = appendMetaCredentials(url)

      const res = await fetch(url)
      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to fetch Meta Overview')
      }
      const payload = await res.json()
      setData(payload)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Error loading Meta Account Overview.')
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

// 2. Meta Campaigns List Hook
export function useMetaCampaigns() {
  const { preset, from, to } = useDateRange()
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      let url = `/api/ads/meta/campaigns?preset=${preset}`
      if (preset === 'custom' && from && to) {
        url += `&from=${from}&to=${to}`
      }
      if (isRefresh) url += `&refresh=true`
      url = appendMetaCredentials(url)

      const res = await fetch(url)
      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to fetch Meta Campaigns')
      }
      const payload = await res.json()
      setCampaigns(payload.campaigns || [])
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Error loading Meta Campaigns.')
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

// 3. Meta Ad Sets Hook (Lazy loaded per Campaign)
export function useMetaAdSets(campaignId: string | null) {
  const { preset, from, to } = useDateRange()
  const [adSets, setAdSets] = useState<MetaAdSet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!campaignId) {
      setAdSets([])
      return
    }

    let active = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        let url = `/api/ads/meta/adsets?campaignId=${campaignId}&preset=${preset}`
        if (preset === 'custom' && from && to) {
          url += `&from=${from}&to=${to}`
        }
        url = appendMetaCredentials(url)
        const res = await fetch(url)
        if (!res.ok) {
          const errJson = await res.json()
          throw new Error(errJson.error || 'Failed to fetch ad sets')
        }
        const payload = await res.json()
        if (active) {
          setAdSets(payload.adSets || [])
        }
      } catch (err: any) {
        console.error(err)
        if (active) setError(err?.message || 'Error loading Ad Sets.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [campaignId, preset, from, to])

  return { adSets, loading, error }
}

// 4. Meta Ads Hook (Lazy loaded per Ad Set)
export function useMetaAds(adSetId: string | null) {
  const { preset, from, to } = useDateRange()
  const [ads, setAds] = useState<MetaAd[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adSetId) {
      setAds([])
      return
    }

    let active = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        let url = `/api/ads/meta/ads?adSetId=${adSetId}&preset=${preset}`
        if (preset === 'custom' && from && to) {
          url += `&from=${from}&to=${to}`
        }
        url = appendMetaCredentials(url)
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
        if (active) setError(err?.message || 'Error loading Ads.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [adSetId, preset, from, to])

  return { ads, loading, error }
}

// 5. Meta Breakdowns and Trends Hook (Placements + Demographics + Daily Trend)
export function useMetaDetails() {
  const { preset, from, to } = useDateRange()
  const [placements, setPlacements] = useState<MetaPlacementBreakdown | null>(null)
  const [demographics, setDemographics] = useState<MetaDemographicBreakdown | null>(null)
  const [trend, setTrend] = useState<MetaDailyTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const suffix = `?preset=${preset}${preset === 'custom' && from && to ? `&from=${from}&to=${to}` : ''}${isRefresh ? '&refresh=true' : ''}`
      const placementsUrl = appendMetaCredentials(`/api/ads/meta/placements${suffix}`)
      const demographicsUrl = appendMetaCredentials(`/api/ads/meta/demographics${suffix}`)
      const trendUrl = appendMetaCredentials(`/api/ads/meta/trend${suffix}`)
      
      const [placementsRes, demographicsRes, trendRes] = await Promise.all([
        fetch(placementsUrl),
        fetch(demographicsUrl),
        fetch(trendUrl)
      ])

      if (!placementsRes.ok || !demographicsRes.ok || !trendRes.ok) {
        throw new Error('Failed to load some Meta detail endpoints')
      }

      const [pData, dData, tData] = await Promise.all([
        placementsRes.json(),
        demographicsRes.json(),
        trendRes.json()
      ])

      setPlacements(pData.placements)
      setDemographics(dData.demographics)
      setTrend(tData.trend || [])
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Error loading Meta breakdown details.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [preset, from, to])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { placements, demographics, trend, loading, refreshing, error, refresh: () => loadData(true) }
}
