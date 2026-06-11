// app/leads/source-quality/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import LiveDataBadge from '@/components/leads/LiveDataBadge'
import RefreshBar from '@/components/leads/RefreshBar'
import CourseSelector from '@/components/leads/CourseSelector'
import { SourceQualityRanking, QualityVolumeScatter } from '@/components/leads/intelligence/SourceQualityComponents'
import { Info } from 'lucide-react'

export default function SourceQualityPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState('all')

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const headers: Record<string, string> = {}
      if (typeof window !== 'undefined') {
        const t = localStorage.getItem('client-telecrm-api-token')
        const e = localStorage.getItem('client-telecrm-enterprise-id')
        if (t) headers['x-telecrm-api-token'] = t
        if (e) headers['x-telecrm-enterprise-id'] = e
      }
      const refreshParam = isRefresh ? 'refresh=true' : ''
      const courseParam = selectedCourse !== 'all' ? `course=${encodeURIComponent(selectedCourse)}` : ''
      const queryParams = [refreshParam, courseParam].filter(Boolean).join('&')
      const queryStr = queryParams ? `?${queryParams}` : ''

      const res = await fetch(`/api/leads/source-quality${queryStr}`, { headers })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `Status ${res.status}`)
      }
      setData(await res.json())
    } catch (err: any) {
      setError(err?.message || 'Error loading source quality data')
    } finally {
      setLoading(false);
      setRefreshing(false)
    }
  }, [selectedCourse])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const h = () => fetchData()
      window.addEventListener('active-config-updated', h)
      return () => window.removeEventListener('active-config-updated', h)
    }
  }, [fetchData])

  if (loading) return <SkeletonLoader />
  if (error || !data) return (
    <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-red-100 shadow-xl flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-6 shadow-sm">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Connection Failed</h2>
        <p className="text-slate-400 text-sm mt-3">{error || 'Unable to load lead source quality data.'}</p>
        <button onClick={() => fetchData()} className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all w-full">Retry Connection</button>
      </div>
    </div>
  )

  const { leaderboard, scatterData } = data

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 lg:space-y-8 min-h-screen bg-slate-50">
      <Header title="🎯 Source Quality Score" currentMonth="Lead Source Performance" onRefresh={() => fetchData(true)} isRefreshing={refreshing} />

      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <LiveDataBadge />
          <p className="text-xs text-slate-400">Scorecard rankings of marketing channels based on volume, speed, high-potential proportion, and conversions</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RefreshBar loading={loading} refreshing={refreshing} lastUpdated={new Date().toISOString()} onRefresh={() => fetchData(true)} />
          <CourseSelector selectedCourse={selectedCourse} onChange={setSelectedCourse} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-800">Marketing Channels Quality Leaderboard</h3>
          <SourceQualityRanking leaderboard={leaderboard || []} />
        </div>
        <QualityVolumeScatter scatterData={scatterData || []} />
      </div>
    </div>
  )
}
