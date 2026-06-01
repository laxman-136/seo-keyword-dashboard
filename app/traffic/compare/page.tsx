// app/traffic/compare/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react'
import { useTrafficData } from '@/hooks/useTrafficData'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import ModeSelector from '@/components/traffic/ModeSelector'
import PeriodSelector from '@/components/traffic/PeriodSelector'
import TrafficMoMTable from '@/components/traffic/TrafficMoMTable'
import SourceComparisonChart from '@/components/charts/SourceComparisonChart'
import CountryComparisonChart from '@/components/charts/CountryComparisonChart'
import { getAvailableMonths, getAvailableYears, getTrafficPeriod, getMovementPercent } from '@/lib/calculations'
import { TrendingUp, TrendingDown, Minus, ArrowLeftRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type CompareMode = 'monthly' | 'quarterly' | 'yearly'

export default function PeriodComparisonView() {
  const { rows, loading, refreshing, error, isMock, fallbackReason, lastUpdated, refresh } = useTrafficData()

  const [mode, setMode] = useState<CompareMode>('monthly')
  const [periodA, setPeriodA] = useState('')
  const [periodB, setPeriodB] = useState('')

  const availableMonths = useMemo(() => getAvailableMonths(rows), [rows])
  const availableYears = useMemo(() => getAvailableYears(rows), [rows])

  // Automatically compute and reset Period A and B when mode or rows change
  useEffect(() => {
    if (rows.length === 0) return

    if (mode === 'monthly') {
      if (availableMonths.length >= 2) {
        setPeriodA(availableMonths[availableMonths.length - 1])
        setPeriodB(availableMonths[availableMonths.length - 2])
      } else if (availableMonths.length === 1) {
        setPeriodA(availableMonths[0])
        setPeriodB(availableMonths[0])
      }
    } else if (mode === 'quarterly') {
      const latestRow = [...rows].sort((a, b) => b.date.getTime() - a.date.getTime())[0]
      if (latestRow) {
        const y = latestRow.date.getFullYear()
        const q = Math.floor(latestRow.date.getMonth() / 3) + 1
        const curQ = `q${q}-${y}`
        const prevQ = q === 1 ? `q4-${y - 1}` : `q${q - 1}-${y}`
        setPeriodA(curQ)
        setPeriodB(prevQ)
      }
    } else if (mode === 'yearly') {
      if (availableYears.length >= 2) {
        setPeriodA(String(availableYears[availableYears.length - 1]))
        setPeriodB(String(availableYears[availableYears.length - 2]))
      } else if (availableYears.length === 1) {
        setPeriodA(String(availableYears[0]))
        setPeriodB(String(availableYears[0]))
      }
    }
  }, [rows, mode, availableMonths, availableYears])

  // Get aggregated results for Period A and Period B
  const comparisonResults = useMemo(() => {
    if (rows.length === 0 || !periodA || !periodB) return null
    
    // getTrafficPeriod treats first argument as "target/current" and second as "baseline/previous"
    // Let's pass periodA (e.g. latest) as current and periodB (e.g. compare) as previous
    return getTrafficPeriod(rows, mode, periodA, periodB)
  }, [rows, mode, periodA, periodB])

  if (loading) {
    return <SkeletonLoader />
  }

  if (error || !comparisonResults) {
    return (
      <div className="p-4 sm:p-6 flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen">
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-red-100 shadow-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-6 shadow-md shadow-red-100">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Connection Failure</h2>
          <p className="text-slate-400 text-sm mt-3">
            Unable to establish connection with Google Sheets API.
          </p>
          <button
            onClick={() => refresh()}
            className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all w-full"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  const { current: dataA, previous: dataB, currentLabel: labelA, previousLabel: labelB } = comparisonResults

  // Calculate top-level user changes
  const totalUsersDiff = dataA.totalUsers - dataB.totalUsers
  const totalUsersPct = getMovementPercent(dataA.totalUsers, dataB.totalUsers)

  const newUsersDiff = dataA.newUsers - dataB.newUsers
  const newUsersPct = getMovementPercent(dataA.newUsers, dataB.newUsers)

  const RenderSummaryCard = ({
    title,
    valA,
    valB,
    pct,
    diff
  }: {
    title: string
    valA: number
    valB: number
    pct: number
    diff: number
  }) => {
    const isPositive = diff > 0
    const isNegative = diff < 0
    
    return (
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-150">
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-black text-slate-800">{valA.toLocaleString()}</h4>
            <span className="text-xs text-slate-400">vs {valB.toLocaleString()}</span>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 shadow-sm",
          isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
          isNegative ? 'bg-red-50 text-red-700 border-red-100' :
          'bg-slate-50 text-slate-500 border-slate-200'
        )}>
          {isPositive ? (
            <>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>+{pct.toFixed(1)}%</span>
            </>
          ) : isNegative ? (
            <>
              <TrendingDown className="w-3.5 h-3.5 text-red-600" />
              <span>{pct.toFixed(1)}%</span>
            </>
          ) : (
            <>
              <Minus className="w-3.5 h-3.5 text-slate-450" />
              <span>Flat</span>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 min-h-screen">
      {/* Header Panel */}
      <Header
        title="Traffic Period Comparison"
        currentMonth={labelA}
        previousMonth={labelB}
        lastUpdated={lastUpdated}
        isMock={isMock}
        warningText={fallbackReason}
        onRefresh={refresh}
        isRefreshing={refreshing}
      />

      {/* Mode & Period selectors */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-emerald-500" />
              Comparison Settings
            </h3>
            <p className="text-xs text-slate-400">
              Toggle comparison scales between months, quarters, and full years.
            </p>
          </div>
          <ModeSelector value={mode} onChange={setMode} />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <PeriodSelector
            mode={mode}
            value={periodA}
            onChange={setPeriodA}
            months={availableMonths}
            years={availableYears}
            label={`Target Period A`}
          />
          <div className="pt-4 font-bold text-slate-300 select-none">vs</div>
          <PeriodSelector
            mode={mode}
            value={periodB}
            onChange={setPeriodB}
            months={availableMonths}
            years={availableYears}
            label={`Baseline Period B`}
          />
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RenderSummaryCard
          title="Total Users Shift"
          valA={dataA.totalUsers}
          valB={dataB.totalUsers}
          pct={totalUsersPct}
          diff={totalUsersDiff}
        />
        <RenderSummaryCard
          title="New Users Shift"
          valA={dataA.newUsers}
          valB={dataB.newUsers}
          pct={newUsersPct}
          diff={newUsersDiff}
        />
      </div>

      {/* COMPARISON TABLE */}
      <TrafficMoMTable 
        current={dataA} 
        previous={dataB} 
        labelA={`Period A: ${labelA}`} 
        labelB={`Period B: ${labelB}`} 
      />

      {/* COMPARISON CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SourceComparisonChart
          sourcesA={dataA.sources}
          sourcesB={dataB.sources}
          labelA={labelA}
          labelB={labelB}
        />
        <CountryComparisonChart
          countriesA={dataA.countries}
          countriesB={dataB.countries}
          labelA={labelA}
          labelB={labelB}
        />
      </div>
    </div>
  )
}
