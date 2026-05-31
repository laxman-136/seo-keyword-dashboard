// app/traffic/sources/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react'
import { useTrafficData } from '@/hooks/useTrafficData'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import PeriodSelector from '@/components/traffic/PeriodSelector'
import TrafficSourceTable from '@/components/traffic/TrafficSourceTable'
import SourceTrendChart from '@/components/charts/SourceTrendChart'
import { getAvailableMonths, aggregateTrafficRows, filterByMonth, getMovementPercent } from '@/lib/calculations'
import { TRAFFIC_SOURCES } from '@/lib/calculations'
import { 
  Search, Compass, Link2, Share2, Video, DollarSign, 
  Layers, BarChart2, Mail, HelpCircle, ArrowUp, ArrowDown, Minus, Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TrafficSource } from '@/lib/types'

const SOURCE_ICONS: Record<TrafficSource, React.ComponentType<{ className?: string }>> = {
  'Organic':       Search,
  'Direct':        Compass,
  'Social':        Share2,
  'Video':         Video,
  'Referral':      Link2,
  'Paid Search':   DollarSign,
  'Cross Network': Layers,
  'Display':       BarChart2,
  'Email':         Mail,
  'Unassigned':    HelpCircle,
}

export default function SourceDetailView() {
  const { rows, loading, refreshing, error, isMock, lastUpdated, refresh } = useTrafficData()

  const availableMonths = useMemo(() => getAvailableMonths(rows), [rows])
  const years = useMemo(() => Array.from(new Set(rows.map(r => r.date.getFullYear()))), [rows])

  const [currentMonth, setCurrentMonth] = useState('')
  const [compareMonth, setCompareMonth] = useState('')

  // Initialize selected periods
  useEffect(() => {
    if (availableMonths.length >= 2) {
      setCurrentMonth(availableMonths[availableMonths.length - 1])
      setCompareMonth(availableMonths[availableMonths.length - 2])
    }
  }, [availableMonths])

  // Aggregate selected month data
  const monthData = useMemo(() => {
    if (!currentMonth || rows.length === 0) return null

    const curRows = filterByMonth(rows, currentMonth)
    const prevRows = compareMonth ? filterByMonth(rows, compareMonth) : []

    const currentAgg = aggregateTrafficRows(curRows)
    const previousAgg = aggregateTrafficRows(prevRows)

    return {
      current: currentAgg,
      previous: previousAgg
    }
  }, [rows, currentMonth, compareMonth])

  if (loading) {
    return <SkeletonLoader />
  }

  if (error || !monthData) {
    return (
      <div className="p-8 flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen">
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

  return (
    <div className="w-full max-w-[1600px] mx-auto p-8 space-y-8">
      {/* Header Panel */}
      <Header
        title="Traffic by Source"
        currentMonth={currentMonth}
        previousMonth={compareMonth}
        lastUpdated={lastUpdated}
        isMock={isMock}
        onRefresh={refresh}
        isRefreshing={refreshing}
      />

      {/* Selectors Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex flex-wrap items-center gap-4">
          <PeriodSelector
            mode="monthly"
            value={currentMonth}
            onChange={setCurrentMonth}
            months={availableMonths}
            years={years}
            label="Target Month"
          />
          <div className="pt-4 font-bold text-slate-350 select-none">vs</div>
          <PeriodSelector
            mode="monthly"
            value={compareMonth}
            onChange={setCompareMonth}
            months={availableMonths}
            years={years}
            label="Comparison Month"
          />
        </div>
      </div>

      {/* Breakdown Table */}
      <TrafficSourceTable
        currentSources={monthData.current.sources}
        previousSources={monthData.previous.sources}
      />

      {/* All Sources Line Trend Chart */}
      <SourceTrendChart rows={rows} variant="all-lines" />

      {/* SOURCE CARDS (2x5 Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {TRAFFIC_SOURCES.map(source => {
          const curVal = monthData.current.sources[source] || 0
          const prevVal = monthData.previous.sources[source] || 0
          const pct = getMovementPercent(curVal, prevVal)
          const diff = curVal - prevVal
          const isPositive = diff > 0
          const isNegative = diff < 0
          
          const CardIcon = SOURCE_ICONS[source] || HelpCircle

          return (
            <div 
              key={source} 
              className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 truncate max-w-[100px]">{source}</span>
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                  <CardIcon className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-slate-800">{curVal.toLocaleString()}</span>
                
                {prevVal > 0 && (
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5",
                    isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    isNegative ? 'bg-red-50 text-red-700 border border-red-100' :
                    'bg-slate-50 text-slate-500 border border-slate-200'
                  )}>
                    {isPositive ? <ArrowUp className="w-2.5 h-2.5" /> : isNegative ? <ArrowDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                    {Math.abs(pct).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
