// app/leads/course-demand/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import LiveDataBadge from '@/components/leads/LiveDataBadge'
import RefreshBar from '@/components/leads/RefreshBar'
import { BatchReadinessCards, CourseDemandTable } from '@/components/leads/intelligence/CourseDemandComponents'
import { Info } from 'lucide-react'

export default function CourseDemandPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const res = await fetch(`/api/leads/course-demand${isRefresh ? '?refresh=true' : ''}`, { headers })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `Status ${res.status}`)
      }
      setData(await res.json())
    } catch (err: any) {
      setError(err?.message || 'Error loading course demand data')
    } finally {
      setLoading(false);
      setRefreshing(false)
    }
  }, [])

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
        <p className="text-slate-400 text-sm mt-3">{error || 'Unable to load course demand & capacity data.'}</p>
        <button onClick={() => fetchData()} className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all w-full">Retry Connection</button>
      </div>
    </div>
  )

  const { batchReadiness } = data

  const totalCourses = batchReadiness?.length || 0
  const batchReady = batchReadiness?.filter((b: any) => b.status === '✅ BATCH READY').length || 0
  const building = batchReadiness?.filter((b: any) => b.status === '🟡 BUILDING').length || 0
  const insufficient = batchReadiness?.filter((b: any) => b.status === '🔴 INSUFFICIENT').length || 0

  const mappedCourses = (batchReadiness || []).map((c: any) => {
    let batchStatus: 'Batch Ready' | 'Building' | 'Insufficient' | 'Active' = 'Insufficient'
    if (c.status === '✅ BATCH READY') batchStatus = 'Batch Ready'
    else if (c.status === '🟡 BUILDING') batchStatus = 'Building'

    let demandTrend: 'Rising' | 'Stable' | 'Falling' = 'Stable'
    if (c.expectedEnrollments >= 10) demandTrend = 'Rising'
    else if (c.expectedEnrollments < 4) demandTrend = 'Falling'

    return {
      course: c.course,
      totalLeads: c.totalPipeline,
      enrolled: c.expectedEnrollments,
      highPotential: c.highPotential,
      pipelineSize: c.highPotential + c.mediumPotential,
      batchStatus,
      estimatedStartWindow: c.estStart,
      demandTrend
    }
  })

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 lg:space-y-8 min-h-screen bg-slate-50">
      <Header title="📚 Course Demand vs Capacity" currentMonth="Batch Readiness Analysis" onRefresh={() => fetchData(true)} isRefreshing={refreshing} />

      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <LiveDataBadge />
          <p className="text-xs text-slate-400">Evaluate course batch readiness, warm pipelines, and estimated launch timelines per course category</p>
        </div>
        <RefreshBar loading={loading} refreshing={refreshing} lastUpdated={new Date().toISOString()} onRefresh={() => fetchData(true)} />
      </div>

      <BatchReadinessCards
        totalCourses={totalCourses}
        batchReady={batchReady}
        building={building}
        insufficient={insufficient}
      />

      <CourseDemandTable courses={mappedCourses} />
    </div>
  )
}
