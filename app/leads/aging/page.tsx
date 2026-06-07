// app/leads/aging/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import LiveDataBadge from '@/components/leads/LiveDataBadge'
import RefreshBar from '@/components/leads/RefreshBar'
import { AgingBucketCards, AgingBarChart, CourseAgingTable, ActionPanel } from '@/components/leads/intelligence/AgingComponents'
import { Info } from 'lucide-react'

export default function LeadAgingPage() {
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
      const res = await fetch(`/api/leads/aging${isRefresh ? '?refresh=true' : ''}`, { headers })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Status ${res.status}`) }
      setData(await res.json())
    } catch (err: any) { setError(err?.message || 'Error loading aging data') }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
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
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-6 shadow-sm"><Info className="w-8 h-8" /></div>
        <h2 className="text-xl font-bold text-slate-800">Connection Failed</h2>
        <p className="text-slate-400 text-sm mt-3">{error || 'Unable to load lead aging data.'}</p>
        <button onClick={() => fetchData()} className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all w-full">Retry Connection</button>
      </div>
    </div>
  )

  const { buckets, chartData, pieData, coursesAging, summary } = data

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 lg:space-y-8 min-h-screen bg-slate-50">
      <Header title="📉 Lead Decay & Aging" currentMonth="Live Pipeline" onRefresh={() => fetchData(true)} isRefreshing={refreshing} />

      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <LiveDataBadge />
          <p className="text-xs text-slate-400">Showing all non-enrolled pending leads by decay timeline — older = more urgent</p>
        </div>
        <RefreshBar loading={loading} refreshing={refreshing} lastUpdated={new Date().toISOString()} onRefresh={() => fetchData(true)} />
      </div>

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Pending', value: summary.totalPending, sub: 'Non-enrolled active leads', color: 'text-slate-800' },
            { label: 'Hot Leads', value: summary.hotCount, sub: '< 7 days old', color: 'text-emerald-600' },
            { label: 'At Risk', value: summary.coldCount + summary.deadCount, sub: '> 90 days sitting', color: 'text-red-600' },
            { label: 'Avg Age', value: `${summary.avgAgeDays?.toFixed(0) || 0}d`, sub: 'Across all pending leads', color: 'text-indigo-600' },
          ].map(k => (
            <div key={k.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{k.label}</p>
              <p className={`text-3xl font-extrabold ${k.color}`}>{typeof k.value === 'number' ? k.value.toLocaleString() : k.value}</p>
              <p className="text-xs text-slate-400 mt-1">{k.sub}</p>
            </div>
          ))}
        </div>
      )}

      <AgingBucketCards buckets={buckets || []} />
      <AgingBarChart chartData={chartData || []} pieData={pieData || []} />
      <CourseAgingTable coursesAging={coursesAging || []} />
      <ActionPanel
        hotCount={summary?.hotCount || 0}
        warmCount={summary?.warmCount || 0}
        coolingCount={summary?.coolingCount || 0}
        coldCount={summary?.coldCount || 0}
        deadCount={summary?.deadCount || 0}
      />
    </div>
  )
}
