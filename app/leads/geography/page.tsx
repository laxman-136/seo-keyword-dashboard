// app/leads/geography/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import LiveDataBadge from '@/components/leads/LiveDataBadge'
import RefreshBar from '@/components/leads/RefreshBar'
import { IndiaStateMap, StatComparisonTable, StateMetric } from '@/components/leads/intelligence/GeographyComponents'
import { Info, MapPin } from 'lucide-react'

const STATE_TO_CODE: Record<string, string> = {
  'Maharashtra': 'MH',
  'Karnataka': 'KA',
  'Tamil Nadu': 'TN',
  'Telangana': 'TS',
  'Andhra Pradesh': 'AP',
  'Kerala': 'KL',
  'Gujarat': 'GJ',
  'Rajasthan': 'RJ',
  'Madhya Pradesh': 'MP',
  'Uttar Pradesh': 'UP',
  'Delhi': 'DL',
  'Haryana': 'HR',
  'Punjab': 'PB',
  'West Bengal': 'WB',
  'Odisha': 'OR',
  'Bihar': 'BR',
  'Jharkhand': 'JH',
  'Chhattisgarh': 'CH'
}

export default function GeographyPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metric, setMetric] = useState<'leads' | 'convRate' | 'revenue'>('leads')

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
      const res = await fetch(`/api/leads/geography${isRefresh ? '?refresh=true' : ''}`, { headers })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `Status ${res.status}`)
      }
      setData(await res.json())
    } catch (err: any) {
      setError(err?.message || 'Error loading geographic quality data')
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
        <p className="text-slate-400 text-sm mt-3">{error || 'Unable to load geographic quality data.'}</p>
        <button onClick={() => fetchData()} className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all w-full">Retry Connection</button>
      </div>
    </div>
  )

  const { highlights, stateTable, topCities } = data

  const mappedStateMetrics: StateMetric[] = (stateTable || []).map((s: any) => ({
    state: s.state,
    stateCode: STATE_TO_CODE[s.state] || s.state.substring(0, 2).toUpperCase(),
    totalLeads: s.leads,
    enrolled: s.enrolled,
    convRate: s.convRate,
    revenue: s.revenue,
    quality: s.convRate >= 12 ? 'High' : s.convRate >= 6 ? 'Medium' : 'Low'
  }))

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 lg:space-y-8 min-h-screen bg-slate-50">
      <Header title="📍 Geographic Quality" currentMonth="Geographic Quality Analysis" onRefresh={() => fetchData(true)} isRefreshing={refreshing} />

      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <LiveDataBadge />
          <p className="text-xs text-slate-400">Track lead distribution, enrollment metrics, and regional quality profiles across Indian states and cities</p>
        </div>
        <RefreshBar loading={loading} refreshing={refreshing} lastUpdated={new Date().toISOString()} onRefresh={() => fetchData(true)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Top Volume State', value: highlights?.topStateVolume || 'Telangana', sub: 'Most leads generated', color: 'text-slate-800' },
          { label: 'Top Quality State', value: highlights?.topStateQuality || 'Telangana', sub: 'Highest enrollment conversion %', color: 'text-emerald-600' },
          { label: 'Top City Hub', value: highlights?.topCity || 'Hyderabad', sub: 'Major city density', color: 'text-indigo-600' },
          { label: 'Untapped Opportunity', value: highlights?.untappedState || 'Gujarat', sub: 'Low volume but high potential', color: 'text-slate-400' },
        ].map(k => (
          <div key={k.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{k.label}</p>
            <p className="text-2xl font-extrabold text-slate-800 truncate" title={k.value}>{k.value}</p>
            <p className="text-xs text-slate-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Metric Selector Tabs */}
      <div className="flex border-b border-slate-200">
        {(['leads', 'convRate', 'revenue'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all ${metric === m ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            {m === 'leads' ? 'Lead Volume' : m === 'convRate' ? 'Conversion Rate' : 'Revenue'}
          </button>
        ))}
      </div>

      <IndiaStateMap stateMetrics={mappedStateMetrics} metric={metric} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StatComparisonTable stateMetrics={mappedStateMetrics} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100">
            <h4 className="text-base font-bold text-slate-800">Top 10 High Density Cities</h4>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                  <th className="py-3 px-5">City</th>
                  <th className="py-3 px-5 text-center">Leads</th>
                  <th className="py-3 px-5 text-center">Enrolled</th>
                  <th className="py-3 px-5 text-center">Conv%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                {topCities?.map((c: any) => (
                  <tr key={c.city} className="hover:bg-slate-50/50">
                    <td className="py-3 px-5 font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {c.city}
                    </td>
                    <td className="py-3 px-5 text-center">{c.count}</td>
                    <td className="py-3 px-5 text-center text-emerald-600">{c.enrolled}</td>
                    <td className="py-3 px-5 text-center text-indigo-600">{c.convRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
