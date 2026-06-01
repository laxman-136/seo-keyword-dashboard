// app/compare/page.tsx
'use client';

import React, { useState, useEffect } from 'react'
import { useKeywordData } from '@/hooks/useKeywordData'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import ComparisonTable from '@/components/tables/ComparisonTable'
import { ArrowLeftRight } from 'lucide-react'

export default function MonthComparisonView() {
  const {
    rawKeywords,
    months,
    stats,
    isMock,
    fallbackReason,
    lastUpdated,
    loading,
    refreshing,
    refresh
  } = useKeywordData()

  const [monthA, setMonthA] = useState('')
  const [monthB, setMonthB] = useState('')

  // Initialize Month A and B once months list loads
  useEffect(() => {
    if (months.length >= 2) {
      // Default Month B = latest month, Month A = second latest
      setMonthB(months[months.length - 1])
      setMonthA(months[months.length - 2])
    }
  }, [months])

  if (loading) {
    return <SkeletonLoader />
  }

  if (months.length < 2 || !stats) {
    return (
      <div className="p-8 text-center text-slate-400 font-semibold mt-12">
        Insufficient monthly historical data to run comparisons (minimum 2 months required).
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto p-8 space-y-8 min-h-screen">
      {/* Header Panel */}
      <Header
        title="Historical Month Comparison"
        currentMonth={stats.currentMonth}
        previousMonth={stats.previousMonth}
        lastUpdated={lastUpdated}
        isMock={isMock}
        warningText={fallbackReason}
        onRefresh={refresh}
        isRefreshing={refreshing}
      />

      {/* Month selectors toolbar card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-emerald-500" />
              Compare Historical Ranges
            </h3>
            <p className="text-xs text-slate-400">
              Select any two months to review performance trends side-by-side.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Month A Selector */}
            <div className="flex-1 sm:flex-initial min-w-[140px]">
              <label htmlFor="month-a-select" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Baseline Month A
              </label>
              <select
                id="month-a-select"
                value={monthA}
                onChange={(e) => setMonthA(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 text-slate-600 font-medium"
              >
                {months.map(m => (
                  <option key={m} value={m} disabled={m === monthB}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Separator Arrow */}
            <div className="pt-4 text-slate-300 font-bold hidden sm:block">
              vs
            </div>

            {/* Month B Selector */}
            <div className="flex-1 sm:flex-initial min-w-[140px]">
              <label htmlFor="month-b-select" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Target Month B
              </label>
              <select
                id="month-b-select"
                value={monthB}
                onChange={(e) => setMonthB(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 text-slate-600 font-medium"
              >
                {months.map(m => (
                  <option key={m} value={m} disabled={m === monthA}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison table populated with active Month A and B */}
      {monthA && monthB && (
        <ComparisonTable
          keywords={rawKeywords}
          monthA={monthA}
          monthB={monthB}
        />
      )}
    </div>
  )
}
