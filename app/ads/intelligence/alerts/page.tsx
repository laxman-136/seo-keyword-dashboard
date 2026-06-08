// app/ads/intelligence/alerts/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react'
import RefreshBar from '@/components/ads/RefreshBar'
import { BadgeAlert, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react'

export default function AlertsPage() {
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

      const res = await fetch(`/api/ads/intelligence/alerts?${query.toString()}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to fetch alerts data')
      }

      const resData = await res.json()
      setData(resData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while fetching alerts')
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
            <BadgeAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">Alerts & Anomalies</h1>
            <p className="text-xs text-slate-400 mt-1">Real-time warning alerts for budget exhausts, CPA spikes, and landing page drop-offs</p>
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
          <span>Error loading Alerts: {error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-24 bg-white border border-slate-200 rounded-2xl" />
          <div className="h-24 bg-white border border-slate-200 rounded-2xl" />
        </div>
      ) : data ? (
        <div className="space-y-4">
          {data.alerts.length > 0 ? (
            data.alerts.map((alert: any) => (
              <div 
                key={alert.id} 
                className={`p-5 rounded-2xl border shadow-sm flex gap-4 bg-white ${
                  alert.level === 'critical' 
                    ? 'border-rose-100 text-rose-700 bg-rose-50/10' 
                    : 'border-amber-100 text-amber-700 bg-amber-50/10'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {alert.level === 'critical' ? (
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      alert.level === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                    }`}>{alert.level}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{alert.time}</span>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-800 mt-1.5">{alert.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{alert.detail}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl text-xs font-bold shadow-sm">
              <CheckCircle className="w-4.5 h-4.5" />
              <span>All ad parameters are healthy! No anomaly warnings detected.</span>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
