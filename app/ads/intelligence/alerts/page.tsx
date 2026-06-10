// app/ads/intelligence/alerts/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react'
import RefreshBar from '@/components/ads/RefreshBar'
import { 
  BadgeAlert, AlertCircle, AlertTriangle, CheckCircle, Info, 
  ShieldAlert, Activity, Filter, ArrowRight, ShieldCheck, 
  Wallet, RefreshCw, BarChart2, Shield, Settings, Globe
} from 'lucide-react'
import Link from 'next/link'

interface AlertItem {
  id: string
  level: 'critical' | 'warning'
  channel: 'meta' | 'google' | 'system'
  title: string
  detail: string
  time: string
  metric?: string
  value?: string
  expected?: string
  recommendation?: string
}

interface AlertsResponse {
  alerts: AlertItem[]
  isReal: boolean
}

export default function AlertsPage() {
  const [data, setData] = useState<AlertsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all')

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

  // Calculate statistics
  const criticalCount = data?.alerts?.filter(a => a.level === 'critical').length || 0
  const warningCount = data?.alerts?.filter(a => a.level === 'warning').length || 0
  const totalAlerts = criticalCount + warningCount

  // Health Score Calculation: starts at 100, -25 for critical, -10 for warning, min is 10
  const healthScore = Math.max(10, 100 - (criticalCount * 25) - (warningCount * 10))

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: 'Optimal Health', color: 'text-emerald-400', barColor: 'bg-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' }
    if (score >= 50) return { label: 'Warning Status', color: 'text-amber-400', barColor: 'bg-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' }
    return { label: 'Critical Action Needed', color: 'text-rose-400', barColor: 'bg-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' }
  }

  const healthStatus = getHealthStatus(healthScore)

  const filteredAlerts = data?.alerts?.filter(a => {
    if (filter === 'all') return true
    return a.level === filter
  }) || []

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-100px] left-[-200px] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Header Bar */}
      <div className="relative z-30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BadgeAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Anomaly Scan & Account Alerts
              <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                Real-Time audits
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-semibold">
              Warning alerts for Google & Meta billing limits, CPL anomalies, tracking script failures, and creative fatigue
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <RefreshBar
            loading={loading}
            refreshing={refreshing}
            lastUpdated={data?.alerts ? new Date().toISOString() : undefined}
            onRefresh={handleRefresh}
            dark
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-300 text-xs font-semibold max-w-2xl relative z-10">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Error loading Anomaly Engine logs</p>
            <p className="text-rose-300/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-6 animate-pulse relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-900/60 border border-slate-800/85 rounded-3xl" />
            ))}
          </div>
          <div className="h-[250px] bg-slate-900/60 border border-slate-800/85 rounded-3xl" />
        </div>
      ) : data ? (
        <div className="relative z-10 space-y-8">
          
          {/* Authenticity Notice Banner */}
          <div className={`flex items-start gap-3.5 p-4 rounded-2xl border text-xs leading-relaxed max-w-4xl ${
            data.isReal 
              ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300/90' 
              : 'bg-amber-950/20 border-amber-500/25 text-amber-300/90'
          }`}>
            {data.isReal ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 animate-pulse" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold uppercase tracking-wide text-[10px]">
                  {data.isReal ? 'API Live Connection Active' : 'Viewing Sandbox Demo Mode'}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-950/80 border border-slate-850 text-slate-450">
                  {data.isReal ? 'Meta & Google API' : 'Simulated data'}
                </span>
              </div>
              <p className="font-semibold text-slate-350">
                {data.isReal 
                  ? 'Real-time campaign anomalies, prepaid balance warnings, and tracking audits are calculated dynamically using your active Meta & Google Ads developer credentials.' 
                  : 'No active advertising credentials are configured in Settings. Currently displaying simulated ad account warnings and anomalies. Configure credentials under Settings to start real-time health scanning.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Health Index Card */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-slate-450 uppercase font-black tracking-wider">System Health Index</p>
                <Activity className={`w-5 h-5 ${healthStatus.color}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-white">{healthScore}%</p>
                <p className={`text-xs font-bold ${healthStatus.color}`}>{healthStatus.label}</p>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2">
                <div className={`${healthStatus.barColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${healthScore}%` }} />
              </div>
            </div>

            {/* Total Warnings Card */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-slate-450 uppercase font-black tracking-wider">Active Anomalies</p>
                <ShieldAlert className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-black text-rose-400">{criticalCount}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">Critical Issues</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-amber-400">{warningCount}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">Minor Warnings</p>
                </div>
              </div>
            </div>

            {/* Scanned Channels Card */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl space-y-3.5 shadow-xl">
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-slate-450 uppercase font-black tracking-wider">Scanned Integrations</p>
                <Globe className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="space-y-1.5 text-xs font-bold">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Meta Ads API</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${data.isReal ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    {data.isReal ? 'Active Live' : 'Sandbox Mode'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Google Ads API</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${data.isReal ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    {data.isReal ? 'Active Live' : 'Sandbox Mode'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Anomaly list panel */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  Detected Account Anomalies
                  <span className="text-[10px] px-2 py-0.5 bg-slate-950/80 border border-slate-800 text-slate-450 rounded-full font-bold">
                    {filteredAlerts.length} issues
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">Active warning reports resolved by the Ad Anomaly Engine</p>
              </div>

              {/* Filtering tab bar */}
              <div className="flex items-center gap-2.5 bg-slate-950 p-1 rounded-xl border border-slate-850">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === 'all'
                      ? 'bg-slate-900 text-white shadow-sm border border-slate-800'
                      : 'text-slate-450 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  All Alerts
                </button>
                <button
                  onClick={() => setFilter('critical')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    filter === 'critical'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'text-slate-450 hover:text-rose-400 border border-transparent'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Critical
                </button>
                <button
                  onClick={() => setFilter('warning')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    filter === 'warning'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-slate-450 hover:text-amber-400 border border-transparent'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Warning
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-12 border border-slate-850 border-dashed rounded-3xl">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-md shadow-emerald-500/5">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-black text-slate-200">No anomalies detected!</h4>
                  <p className="text-[11px] text-slate-500 mt-1 font-semibold max-w-sm">
                    All scanned ad parameters are completely healthy for the selected filters.
                  </p>
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const isCritical = alert.level === 'critical'
                  
                  // Icon mapping based on channel/type
                  let ChannelIcon = Wallet
                  if (alert.channel === 'meta') ChannelIcon = Globe
                  else if (alert.channel === 'google') ChannelIcon = Globe
                  else if (alert.channel === 'system') ChannelIcon = Activity

                  return (
                    <div 
                      key={alert.id}
                      className={`p-5 rounded-3xl border transition-all duration-300 shadow-md ${
                        isCritical 
                          ? 'border-rose-500/10 bg-rose-950/5 hover:border-rose-500/20' 
                          : 'border-amber-500/10 bg-amber-950/5 hover:border-amber-500/20'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row gap-5 items-start">
                        
                        {/* Status Icon Indicator */}
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md border ${
                          isCritical 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}>
                          {isCritical ? <AlertCircle className="w-5 h-5 animate-pulse" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>

                        {/* Text and details */}
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                                isCritical 
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}>
                                {alert.level}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-slate-950/80 border border-slate-850 text-indigo-400 flex items-center gap-1">
                                <ChannelIcon className="w-2.5 h-2.5" />
                                {alert.channel}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-semibold">{alert.time}</span>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-slate-100">{alert.title}</h4>
                            <p className="text-xs text-slate-400 leading-relaxed font-semibold">{alert.detail}</p>
                          </div>

                          {/* Metric box */}
                          {alert.metric && (
                            <div className="grid grid-cols-3 gap-4 p-3 bg-slate-950/80 border border-slate-850 rounded-2xl max-w-lg text-[11px] font-semibold">
                              <div>
                                <span className="text-slate-500 text-[9px] uppercase tracking-wider font-extrabold block">Metric</span>
                                <span className="text-slate-300 block mt-0.5">{alert.metric}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[9px] uppercase tracking-wider font-extrabold block">Current Value</span>
                                <span className={`block mt-0.5 font-bold ${isCritical ? 'text-rose-400' : 'text-amber-400'}`}>{alert.value}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[9px] uppercase tracking-wider font-extrabold block">Expected</span>
                                <span className="text-emerald-400 block mt-0.5 font-bold">{alert.expected}</span>
                              </div>
                            </div>
                          )}

                          {/* Recommendation */}
                          {alert.recommendation && (
                            <div className="p-3.5 bg-slate-900 border border-slate-850/60 rounded-2xl text-xs space-y-1 leading-relaxed font-semibold text-slate-350">
                              <h5 className="font-extrabold text-slate-200 uppercase tracking-wide text-[9px]">Action Guide Recommendation:</h5>
                              <p className="text-[11px] text-slate-400">{alert.recommendation}</p>
                            </div>
                          )}

                        </div>

                        {/* Action buttons */}
                        <div className="shrink-0 pt-1">
                          <Link 
                            href="/settings"
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-[10px] font-bold border border-slate-700 hover:border-slate-600 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-sm"
                          >
                            <Settings className="w-3.5 h-3.5" /> Configure Credentials
                          </Link>
                        </div>

                      </div>
                    </div>
                  )
                })
              )}
            </div>

          </div>

        </div>
      ) : null}
    </div>
  )
}
