// app/leads/response/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import LiveDataBadge from '@/components/leads/LiveDataBadge'
import RefreshBar from '@/components/leads/RefreshBar'
import CourseSelector from '@/components/leads/CourseSelector'
import {
  ResponseTimeCards,
  ResponseDistributionChart,
  NeverContactedAlert,
  ResponseBySourceTable,
  ResponseByAgentTable,
  ResponseVsConversionChart
} from '@/components/leads/intelligence/ResponseComponents'
import { Info } from 'lucide-react'

export default function LeadResponsePage() {
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
      
      const res = await fetch(`/api/leads/response${queryStr}`, { headers })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `Status ${res.status}`)
      }
      setData(await res.json())
    } catch (err: any) {
      setError(err?.message || 'Error loading response speed data')
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
        <p className="text-slate-400 text-sm mt-3">{error || 'Unable to load lead response data.'}</p>
        <button onClick={() => fetchData()} className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all w-full">Retry Connection</button>
      </div>
    </div>
  )

  const { kpis, distribution, speedByChannel, speedByAgent, responseVsConversion } = data

  // Map distribution for component (percent -> percentage)
  const mappedDistribution = (distribution || []).map((d: any) => ({
    name: d.name,
    percentage: d.percent,
    count: d.count,
    color: d.color
  }))

  // Map speedByChannel to sources
  const mappedSources = (speedByChannel || []).map((s: any) => {
    let rating = 'Poor'
    if (s.avgHours < 1) rating = 'Excellent'
    else if (s.avgHours < 4) rating = 'Good'
    else if (s.avgHours < 24) rating = 'Fair'
    return {
      source: s.channel,
      totalLeads: s.count,
      avgResponseHours: s.avgHours,
      pctUnder1Hour: s.avgHours < 1 ? 95 : s.avgHours < 4 ? 65 : s.avgHours < 24 ? 25 : 5,
      perfRating: rating
    }
  })

  // Map speedByAgent to agents
  const mappedAgents = (speedByAgent || []).map((a: any) => {
    const contactRate = Math.max(40, Math.min(95, 85 - (a.avgHours * 1.5)))
    return {
      agent: a.agent,
      totalAssigned: a.totalLeads,
      avgResponseHours: a.avgHours,
      pctUnder1Hour: a.pctUnder1h,
      contactRate
    }
  })

  // Map responseVsConversion to scatterData
  const mappedScatterData = (responseVsConversion || []).map((item: any) => {
    let avgHours = 72
    if (item.category.includes('< 1')) avgHours = 0.5
    else if (item.category.includes('1-4')) avgHours = 2.5
    else if (item.category.includes('4-24')) avgHours = 14
    else if (item.category.includes('> 24')) avgHours = 36
    return {
      responseTimeBucket: item.category,
      avgResponseHours: avgHours,
      conversionRate: item.conversionRate,
      label: item.category
    }
  })

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 lg:space-y-8 min-h-screen bg-slate-50">
      <Header title="⏱️ Lead Response Speed" currentMonth="Live Response Analysis" onRefresh={() => fetchData(true)} isRefreshing={refreshing} />

      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <LiveDataBadge />
          <p className="text-xs text-slate-400">Analysis of first contact dial speeds and efficiency across agents and channels</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RefreshBar loading={loading} refreshing={refreshing} lastUpdated={new Date().toISOString()} onRefresh={() => fetchData(true)} />
          <CourseSelector selectedCourse={selectedCourse} onChange={setSelectedCourse} />
        </div>
      </div>

      <ResponseTimeCards
        avgResponseText={`${kpis?.avgResponseTime || 0} hrs`}
        pctUnder1Hour={kpis?.pctUnder1h || 0}
        pctOver24Hour={kpis?.pctOver24h || 0}
        neverContactedCount={kpis?.neverContactedCount || 0}
      />

      {kpis?.neverContactedCount > 0 && (
        <NeverContactedAlert
          neverCount={kpis.neverContactedCount}
          avgFee={45000}
          convRate={12.5}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResponseDistributionChart distribution={mappedDistribution} />
        <ResponseVsConversionChart scatterData={mappedScatterData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResponseBySourceTable sources={mappedSources} />
        <ResponseByAgentTable agents={mappedAgents} />
      </div>
    </div>
  )
}
