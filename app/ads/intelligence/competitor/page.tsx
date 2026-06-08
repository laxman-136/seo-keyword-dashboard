// app/ads/intelligence/competitor/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react'
import { useDateRange } from '@/hooks/useDateRange'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import { CompetitorThreatTable } from '@/components/ads/intelligence/AdsIntelComponents'
import { AlertCircle, Eye, Shield } from 'lucide-react'

export default function CompetitorPage() {
  const { preset, from, to, label, setDateRange } = useDateRange()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (bypassCache = false) => {
    try {
      if (bypassCache) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const query = new URLSearchParams()
      if (bypassCache) {
        query.set('refresh', 'true')
      }

      const res = await fetch(`/api/ads/intelligence/competitor?${query.toString()}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to fetch competitor data')
      }

      const resData = await res.json()
      setData(resData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while fetching competitor data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    fetchData(true)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">Monitored Competitor Scanner</h1>
            <p className="text-xs text-slate-400 mt-1">Live scan of Monitored Competitors running active ads in Meta Ad Library</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <RefreshBar
            loading={loading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>Error loading Competitors: {error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-[250px] bg-white border border-slate-200 rounded-2xl" />
          <div className="h-[300px] bg-white border border-slate-200 rounded-2xl" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <CompetitorThreatTable competitors={data.competitors} />

          {/* Active ads detailed catalog */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <div>
              <h4 className="text-base font-extrabold text-slate-800">Scanned Competitor Ad Angling Gaps</h4>
              <p className="text-xs text-slate-400">Angles and opportunities not actively targeted by competitors</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {data.gaps.map((gap: string, idx: number) => (
                <span key={idx} className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm">
                  💡 {gap}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <div>
              <h4 className="text-base font-extrabold text-slate-800">Active Competitor Creative Ad Copy Catalog</h4>
              <p className="text-xs text-slate-400">Active competitor primary body texts detected during last archive scan</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.activeAds.map((ad: any) => (
                <div key={ad.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{ad.pageName}</span>
                    <span className="text-[10px] text-slate-450 font-medium">{ad.angleDetected}</span>
                  </div>
                  <h5 className="text-xs font-extrabold text-slate-800 mt-2">{ad.linkTitle || 'ERP Certification Training'}</h5>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">{ad.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
