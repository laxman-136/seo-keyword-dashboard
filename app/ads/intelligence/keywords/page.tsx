// app/ads/intelligence/keywords/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react'
import { useDateRange } from '@/hooks/useDateRange'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import { AlertCircle, Target, ShieldAlert } from 'lucide-react'

export default function KeywordsPage() {
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

      const query = new URLSearchParams({ preset })
      if (preset === 'custom' && from && to) {
        query.set('from', from)
        query.set('to', to)
      }
      if (bypassCache) {
        query.set('refresh', 'true')
      }

      const res = await fetch(`/api/ads/intelligence/keywords?${query.toString()}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to fetch keywords data')
      }

      const resData = await res.json()
      setData(resData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while fetching keyword data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [preset, from, to])

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
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">Keyword Quality Intelligence</h1>
            <p className="text-xs text-slate-400 mt-1">Audit Google Ads keywords by Quality Score and student conversions</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker />
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
          <span>Error loading Keyword Quality: {error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-[300px] bg-white border border-slate-200 rounded-2xl" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Keywords Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-800">Search Keywords Performance Matrix</h4>
              <p className="text-xs text-slate-400">Comparing search volumes and enrollment values to exclude waste search queries</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                    <th className="py-2.5 px-4">Search Keyword</th>
                    <th className="py-2.5 px-4 text-center">Quality Score</th>
                    <th className="py-2.5 px-4 text-center">Spend</th>
                    <th className="py-2.5 px-4 text-center">Leads</th>
                    <th className="py-2.5 px-4 text-center text-emerald-600">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {data.keywords.map((kw: any) => (
                    <tr key={kw.text} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono text-slate-800">{kw.text}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                          kw.qualityScore >= 8 ? 'bg-emerald-50 text-emerald-700' :
                          kw.qualityScore >= 6 ? 'bg-blue-50 text-blue-700' :
                          'bg-rose-50 text-rose-600'
                        }`}>{kw.qualityScore}/10</span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">₹{Math.round(kw.spend).toLocaleString()}</td>
                      <td className="py-3 px-4 text-center text-slate-550">{kw.leads}</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-extrabold">{kw.enrolled}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
