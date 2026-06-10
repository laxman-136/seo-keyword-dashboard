// app/leads/funnel/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import LeadsFunnelChart from '@/components/leads/LeadsFunnelChart'
import LeadsFunnelCard from '@/components/leads/LeadsFunnelCard'
import LiveDataBadge from '@/components/leads/LiveDataBadge'
import RefreshBar from '@/components/leads/RefreshBar'
import StageDrillDown from '@/components/leads/StageDrillDown'
import DateRangePicker from '@/components/ads/DateRangePicker'
import { useDateRange } from '@/hooks/useDateRange'
import { Info, TrendingUp, TrendingDown, Minus, Target, Activity, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

import { getClientCachedData, setClientCachedData } from '@/lib/client-cache'

export default function LeadsFunnelPage() {
  const { preset, from, to, label: rangeLabel } = useDateRange()

  const [funnel, setFunnel] = useState<any>(null)
  const [prevFunnel, setPrevFunnel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (isRefresh = false) => {
    const cacheKey = `funnel_${from}_${to}`

    if (!isRefresh) {
      const cached = getClientCachedData(cacheKey)
      if (cached) {
        setFunnel(cached.current)
        setPrevFunnel(cached.prev)
        setLoading(false)
        // Background revalidation (non-blocking)
        fetchFromNetwork(cacheKey, true)
        return
      }
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)

    await fetchFromNetwork(cacheKey, false)
  }, [from, to])

  const fetchFromNetwork = async (cacheKey: string, isBackground = false) => {
    try {
      const headers: Record<string, string> = {}
      if (typeof window !== 'undefined') {
        const clientToken = localStorage.getItem('client-telecrm-api-token')
        const clientEnterpriseId = localStorage.getItem('client-telecrm-enterprise-id')
        if (clientToken) headers['x-telecrm-api-token'] = clientToken
        if (clientEnterpriseId) headers['x-telecrm-enterprise-id'] = clientEnterpriseId
      }

      const durationMs = new Date(to).getTime() - new Date(from).getTime() + 1
      const prevFrom = new Date(new Date(from).getTime() - durationMs).toISOString().split('T')[0]
      const prevTo = new Date(new Date(to).getTime() - durationMs).toISOString().split('T')[0]

      const urlCurrent = `/api/leads/funnel?from=${from}&to=${to}`
      const urlPrev = `/api/leads/funnel?from=${prevFrom}&to=${prevTo}`

      const [resCurrent, resPrev] = await Promise.all([
        fetch(urlCurrent, { headers }),
        fetch(urlPrev, { headers })
      ])

      if (!resCurrent.ok) {
        const errorData = await resCurrent.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch current funnel metrics (Status: ${resCurrent.status})`)
      }
      if (!resPrev.ok) {
        const errorData = await resPrev.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch previous funnel metrics (Status: ${resPrev.status})`)
      }

      const payloadCurrent = await resCurrent.json()
      const payloadPrev = await resPrev.json()

      setFunnel(payloadCurrent)
      setPrevFunnel(payloadPrev)
      setClientCachedData(cacheKey, { current: payloadCurrent, prev: payloadPrev })
    } catch (err: any) {
      console.error(err)
      if (!isBackground) {
        setError(err?.message || 'Error loading funnel details')
      }
    } finally {
      if (!isBackground) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const handleConfigChange = () => {
      fetchData()
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('active-config-updated', handleConfigChange)
      return () => {
        window.removeEventListener('active-config-updated', handleConfigChange)
      }
    }
  }, [fetchData])

  // Computed metrics
  const convRateVal = useMemo(() => {
    if (!funnel || funnel.total === 0) return 0
    return (funnel.enrolled / funnel.total) * 100
  }, [funnel])

  const leadsPerEnroll = useMemo(() => {
    if (!funnel || funnel.enrolled === 0) return 0
    return Math.round(funnel.total / funnel.enrolled)
  }, [funnel])

  const highPotRate = useMemo(() => {
    if (!funnel || funnel.total === 0) return 0
    return (funnel.highPotential / funnel.total) * 100
  }, [funnel])

  const qualityScore = useMemo(() => {
    if (!funnel || funnel.total === 0) return 0
    return ((funnel.enrolled + funnel.highPotential) / funnel.total) * 100
  }, [funnel])

  const pipelineHealthLabel = highPotRate >= 30 ? 'Strong' : highPotRate >= 15 ? 'Average' : 'Weak'
  const pipelineHealthStyle = highPotRate >= 30
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : highPotRate >= 15
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-red-50 text-red-700 border-red-200'

  // Status action map
  const statusActions: Record<string, { action: string; desc: string }> = {
    'Enrolled':          { action: '— Closed Won',          desc: 'Transfer to LMS / learning portal immediately.' },
    'High Potential':    { action: 'Follow up within 24 hrs', desc: 'Send pricing & class schedules. Arrange direct call.' },
    'Medium Potential':  { action: 'Nurture & demo',          desc: 'Share demo class recordings. Offer free trial.' },
    'Fresh/Unqualified': { action: 'Re-engage / call again',  desc: 'Filter contacts. Set callback schedule.' },
    'Low/Cold':          { action: 'Review & drop',           desc: 'Low-priority newsletter. Re-evaluate source quality.' },
  }

  const tableRows = useMemo(() => {
    if (!funnel) return []
    return [
      { name: 'Enrolled',          emoji: '🏆', count: funnel.enrolled,         pct: funnel.enrolledPct,         prevCount: prevFunnel?.enrolled,         isPositive: true,  color: 'text-emerald-600' },
      { name: 'High Potential',    emoji: '🔥', count: funnel.highPotential,    pct: funnel.highPotentialPct,    prevCount: prevFunnel?.highPotential,    isPositive: true,  color: 'text-blue-600'    },
      { name: 'Medium Potential',  emoji: '⚡', count: funnel.mediumPotential,  pct: funnel.mediumPotentialPct,  prevCount: prevFunnel?.mediumPotential,  isPositive: true,  color: 'text-amber-600'   },
      { name: 'Fresh/Unqualified', emoji: '❄️', count: funnel.freshUnqualified, pct: funnel.freshUnqualifiedPct, prevCount: prevFunnel?.freshUnqualified, isPositive: false, color: 'text-slate-500'   },
      { name: 'Low/Cold',          emoji: '🗑️', count: funnel.lowCold,          pct: funnel.lowColdPct,          prevCount: prevFunnel?.lowCold,          isPositive: false, color: 'text-red-600'     },
    ]
  }, [funnel, prevFunnel])

  if (loading) return <SkeletonLoader />

  if (error || !funnel) {
    return (
      <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-red-100 shadow-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-6 shadow-sm">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Connection Failed</h2>
          <p className="text-slate-400 text-sm mt-3">
            {error || 'Unable to retrieve funnel statistics from TeleCRM API.'}
          </p>
          <button onClick={() => fetchData()} className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all w-full">
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-h-screen bg-slate-50">

      {/* ── HEADER ── */}
      <Header
        title="📊 Funnel & Conversion"
        currentMonth={rangeLabel}
        onRefresh={() => fetchData(true)}
        isRefreshing={refreshing}
      />

      {/* ── LIVE BADGE & SELECTORS ROW ── */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <LiveDataBadge />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RefreshBar
            loading={loading}
            refreshing={refreshing}
            lastUpdated={new Date().toISOString()}
            onRefresh={() => fetchData(true)}
          />
          <DateRangePicker />
        </div>
      </div>

      {/* ── SECTION A: 3 Score Cards + Funnel Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Score cards stacked on left */}
        <div className="flex flex-col gap-5">
          {/* Conversion Rate */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Conversion Rate</p>
                <p className="text-[10px] text-slate-400">Lead → Enrollment</p>
              </div>
            </div>
            <p className="text-4xl font-extrabold text-emerald-700 tracking-tight">{convRateVal.toFixed(1)}%</p>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Team needs <span className="font-bold text-slate-800">{leadsPerEnroll} leads</span> to secure 1 enrollment
            </p>
          </div>

          {/* Pipeline Health */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pipeline Health</p>
                <p className="text-[10px] text-slate-400">High-intent lead ratio</p>
              </div>
            </div>
            <p className="text-4xl font-extrabold text-blue-700 tracking-tight">{highPotRate.toFixed(1)}%</p>
            <div className="mt-3">
              <span className={cn('px-3 py-1.5 rounded-xl text-xs font-bold border inline-block', pipelineHealthStyle)}>
                {pipelineHealthLabel} pipeline
              </span>
            </div>
          </div>

          {/* Quality Index */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quality Index</p>
                <p className="text-[10px] text-slate-400">Enrolled + High Potential</p>
              </div>
            </div>
            <p className="text-4xl font-extrabold text-violet-700 tracking-tight">{qualityScore.toFixed(1)}%</p>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Share of pipeline at <span className="font-bold text-slate-800">high quality</span> stages
            </p>
          </div>
        </div>

        {/* Funnel card — takes 2 cols */}
        <div className="lg:col-span-2">
          <LeadsFunnelCard
            funnel={funnel}
            compareWith={prevFunnel}
            compareLabel="Prev Period"
          />
        </div>
      </div>

      {/* ── SECTION B: Visual SVG Funnel ── */}
      <LeadsFunnelChart funnel={funnel} />

      {/* ── SECTION C: Detailed Action Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <h3 className="font-bold text-slate-800 text-sm">📋 Stage Breakdown & Action Plan</h3>
          <p className="text-xs text-slate-400 mt-0.5">Period-over-Period comparison with recommended team actions per funnel stage</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-900 text-slate-200 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5">Stage</th>
                <th className="px-4 py-3.5 text-right">Count</th>
                <th className="px-4 py-3.5 text-right">Share</th>
                {prevFunnel && <th className="px-4 py-3.5 text-center">vs Prev Period</th>}
                <th className="px-4 py-3.5">Recommended Action</th>
                <th className="px-6 py-3.5 hidden lg:table-cell">Next Step</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableRows.map(row => {
                const delta = row.prevCount !== undefined ? row.count - row.prevCount : null
                const isGood = row.isPositive ? (delta !== null && delta >= 0) : (delta !== null && delta <= 0)
                const action = statusActions[row.name]

                return (
                  <tr key={row.name} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <span className={cn('flex items-center gap-2.5 font-bold', row.color)}>
                        <span className="text-base">{row.emoji}</span>
                        {row.name}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-slate-800">{row.count}</td>
                    <td className="px-4 py-4 text-right font-mono text-slate-500">{row.pct.toFixed(1)}%</td>
                    {prevFunnel && (
                      <td className="px-4 py-4 text-center">
                        {delta !== null ? (
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold',
                            delta === 0
                              ? 'bg-slate-50 border-slate-200 text-slate-500'
                              : isGood
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                          )}>
                            {delta > 0
                              ? <TrendingUp className="w-3 h-3" />
                              : delta < 0
                                ? <TrendingDown className="w-3 h-3" />
                                : <Minus className="w-3 h-3" />}
                            {delta > 0 ? `+${delta}` : delta === 0 ? 'Flat' : delta}
                          </span>
                        ) : '—'}
                      </td>
                    )}
                    <td className="px-4 py-4 font-semibold text-slate-700">{action?.action}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 hidden lg:table-cell">{action?.desc}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECTION D: Accordion Drilldown ── */}
      <StageDrillDown stageBreakdown={funnel.stageBreakdown} />
    </div>
  )
}
