// app/leads/funnel/page.tsx
'use client';

import React, { useState, useEffect } from 'react'
import { useLeadsData } from '@/hooks/useLeadsData'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import LeadsFunnelChart from '@/components/leads/LeadsFunnelChart'
import LeadsFunnelCard from '@/components/leads/LeadsFunnelCard'
import LeadsMonthSelector from '@/components/leads/LeadsMonthSelector'
import { getAvailableLeadsMonths, getLeadsFunnel } from '@/lib/sheets'
import { Info, TrendingUp, TrendingDown, Minus, Target, Activity, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LeadsFunnelPage() {
  const {
    monthly,
    loading,
    refreshing,
    error,
    isMock,
    fallbackReason,
    lastUpdated,
    refresh
  } = useLeadsData()

  const [selectedMonth, setSelectedMonth] = useState('')

  useEffect(() => {
    if (monthly.length > 0 && !selectedMonth) {
      setSelectedMonth(monthly[monthly.length - 1].month)
    }
  }, [monthly, selectedMonth])

  if (loading) return <SkeletonLoader />

  if (error || monthly.length === 0) {
    return (
      <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-red-100 shadow-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-6 shadow-sm">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">No leads data yet</h2>
          <p className="text-slate-400 text-sm mt-3">
            {error || 'Please populate the leads sheets in your Google Sheet.'}
          </p>
          <button onClick={() => refresh()} className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all w-full">
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  const availableMonths = getAvailableLeadsMonths(monthly)
  const currentMonth = selectedMonth || monthly[monthly.length - 1].month
  const currentIndex = availableMonths.indexOf(currentMonth)
  const prevMonth = currentIndex > 0 ? availableMonths[currentIndex - 1] : 'N/A'

  const funnel = getLeadsFunnel(monthly, currentMonth)
  const prevFunnel = prevMonth !== 'N/A' ? getLeadsFunnel(monthly, prevMonth) : undefined

  // Computed metrics
  const convRateVal   = funnel.total > 0 ? (funnel.enrolled / funnel.total) * 100 : 0
  const leadsPerEnroll = funnel.enrolled > 0 ? Math.round(funnel.total / funnel.enrolled) : 0
  const highPotRate   = funnel.total > 0 ? (funnel.highPotential / funnel.total) * 100 : 0
  const qualityScore  = funnel.total > 0 ? ((funnel.enrolled + funnel.highPotential) / funnel.total) * 100 : 0

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

  const tableRows = [
    { name: 'Enrolled',          emoji: '🏆', count: funnel.enrolled,         pct: funnel.enrolledPct,         prevCount: prevFunnel?.enrolled,         isPositive: true,  color: 'text-emerald-600' },
    { name: 'High Potential',    emoji: '🔥', count: funnel.highPotential,    pct: funnel.highPotentialPct,    prevCount: prevFunnel?.highPotential,    isPositive: true,  color: 'text-blue-600'    },
    { name: 'Medium Potential',  emoji: '⚡', count: funnel.mediumPotential,  pct: funnel.mediumPotentialPct,  prevCount: prevFunnel?.mediumPotential,  isPositive: true,  color: 'text-amber-600'   },
    { name: 'Fresh/Unqualified', emoji: '❄️', count: funnel.freshUnqualified, pct: funnel.freshUnqualifiedPct, prevCount: prevFunnel?.freshUnqualified, isPositive: false, color: 'text-slate-500'   },
    { name: 'Low/Cold',          emoji: '🗑️', count: funnel.lowCold,          pct: funnel.lowColdPct,          prevCount: prevFunnel?.lowCold,          isPositive: false, color: 'text-red-600'     },
  ]

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-h-screen bg-slate-50">

      {/* ── HEADER ── */}
      <Header
        title="📊 Funnel & Conversion"
        currentMonth={currentMonth}
        previousMonth={prevMonth !== 'N/A' ? prevMonth : undefined}
        lastUpdated={lastUpdated}
        isMock={isMock}
        warningText={fallbackReason}
        onRefresh={refresh}
        isRefreshing={refreshing}
      />

      {/* ── MONTH SELECTOR ── */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-700">Funnel Analysis</p>
          <p className="text-xs text-slate-400 mt-0.5">Select a month to see pipeline distribution and conversion metrics</p>
        </div>
        <LeadsMonthSelector
          months={availableMonths}
          selected={currentMonth}
          onChange={setSelectedMonth}
          label="Analyze Month"
        />
      </div>

      {/* ── SECTION A: 3 Score Cards + Funnel Card (side by side) ── */}
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
            compareLabel={prevMonth !== 'N/A' ? prevMonth : undefined}
          />
        </div>
      </div>

      {/* ── SECTION B: Visual SVG Funnel ── */}
      <LeadsFunnelChart funnel={funnel} />

      {/* ── SECTION C: Detailed Action Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <h3 className="font-bold text-slate-800 text-sm">📋 Stage Breakdown & Action Plan</h3>
          <p className="text-xs text-slate-400 mt-0.5">MoM comparison with recommended team actions per funnel stage</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-900 text-slate-200 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5">Stage</th>
                <th className="px-4 py-3.5 text-right">Count</th>
                <th className="px-4 py-3.5 text-right">Share</th>
                {prevFunnel && <th className="px-4 py-3.5 text-center">vs {prevMonth}</th>}
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

    </div>
  )
}
