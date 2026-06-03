// app/revenue/ads/page.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { useRevenueData, useAdSpendAnalysis } from '@/hooks/useRevenueData'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import RevenueMonthSelector from '@/components/revenue/RevenueMonthSelector'
import RevenueAdSpendCard from '@/components/revenue/RevenueAdSpendCard'
import RevenueAdSpendTable from '@/components/revenue/RevenueAdSpendTable'
import RevenueROASChart from '@/components/revenue/RevenueROASChart'
import { getAvailableRevenueMonths } from '@/lib/sheets'
import { Info } from 'lucide-react'

export default function RevenueAdsPage() {
  const {
    courses,
    monthly,
    loading,
    refreshing,
    error,
    isMock,
    fallbackReason,
    lastUpdated,
    refresh
  } = useRevenueData()

  const [selectedMonth, setSelectedMonth] = useState('')

  useEffect(() => {
    if (monthly.length > 0 && !selectedMonth) {
      setSelectedMonth(monthly[monthly.length - 1].month)
    }
  }, [monthly, selectedMonth])

  const availableMonths = getAvailableRevenueMonths(monthly)
  const currentMonth = selectedMonth || (monthly.length > 0 ? monthly[monthly.length - 1].month : '')
  const currentIndex = availableMonths.indexOf(currentMonth)
  const prevMonth = currentIndex > 0 ? availableMonths[currentIndex - 1] : 'N/A'

  const activeMonthRow = monthly.length > 0 && currentIndex >= 0 ? monthly[currentIndex] : null
  const adSpendAnalysis = useAdSpendAnalysis(courses, currentMonth)

  if (loading) return <SkeletonLoader />

  if (error || monthly.length === 0 || courses.length === 0) {
    return (
      <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-red-100 shadow-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-6 shadow-sm">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">No ad campaign data</h2>
          <p className="text-slate-400 text-sm mt-3">
            {error || 'Please fill in the Google and Meta spend fields in the Sheets to run ROAS analyses.'}
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
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 lg:space-y-8 min-h-screen bg-slate-50">
      {/* ── HEADER ── */}
      <Header
        title="📢 Ad Spend & ROAS Analysis"
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
          <p className="text-sm font-bold text-slate-700">Campaign Analysis Month</p>
          <p className="text-xs text-slate-400 mt-0.5">Select a month to evaluate campaign spend channels and return efficiency ratios</p>
        </div>
        <RevenueMonthSelector
          months={availableMonths}
          selected={currentMonth}
          onChange={setSelectedMonth}
          label="Analyze Month"
        />
      </div>

      {/* ── SECTION A: SUMMARY & ROAS CHART ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-5">
          {activeMonthRow && (
            <RevenueAdSpendCard row={activeMonthRow} />
          )}
        </div>
        <div className="lg:col-span-7">
          <RevenueROASChart data={adSpendAnalysis} />
        </div>
      </div>

      {/* ── SECTION B: DETAILED TABLE ── */}
      <RevenueAdSpendTable data={adSpendAnalysis} />
    </div>
  )
}
