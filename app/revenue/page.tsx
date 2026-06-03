// app/revenue/page.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { useRevenueData, useRevenueKPI } from '@/hooks/useRevenueData'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import RevenueMonthSelector from '@/components/revenue/RevenueMonthSelector'
import RevenueKPICard from '@/components/revenue/RevenueKPICard'
import RevenueOrganicPaidCard from '@/components/revenue/RevenueOrganicPaidCard'
import RevenueTrendChart from '@/components/revenue/RevenueTrendChart'
import { getAvailableRevenueMonths, getRevenueTrend } from '@/lib/sheets'
import { Info } from 'lucide-react'

export default function RevenueOverviewPage() {
  const {
    monthly,
    courses,
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
  
  // KPI calculated over cumulative array up to selected month for MoM comparison
  const activeRows = monthly.length > 0 && currentIndex >= 0 ? monthly.slice(0, currentIndex + 1) : []
  const kpi = useRevenueKPI(activeRows)
  const trendPoints = getRevenueTrend(monthly)
  const activeMonthRow = monthly.length > 0 && currentIndex >= 0 ? monthly[currentIndex] : null

  if (loading) return <SkeletonLoader />

  if (error || monthly.length === 0) {
    return (
      <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-red-100 shadow-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-6 shadow-sm">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">No revenue data yet</h2>
          <p className="text-slate-400 text-sm mt-3">
            {error || 'Please populate the Revenue Monthly tab in Google Sheets to load the dashboard.'}
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
        title="💰 Revenue Overview"
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
          <p className="text-sm font-bold text-slate-700">Monthly Analysis</p>
          <p className="text-xs text-slate-400 mt-0.5">Select a month to load revenue performance details</p>
        </div>
        <RevenueMonthSelector
          months={availableMonths}
          selected={currentMonth}
          onChange={setSelectedMonth}
          label="Analyze Month"
        />
      </div>

      {/* ── KPI GRID ── */}
      {kpi && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <RevenueKPICard
            title="Total Revenue"
            value={kpi.totalRevenue}
            prevValue={kpi.prevTotalRevenue}
            icon="💰"
            variant="emerald"
            isCurrency={true}
            subtitle="Gross monthly fee yield"
          />
          <RevenueKPICard
            title="Conversions"
            value={kpi.totalConversions}
            prevValue={kpi.prevTotalConversions}
            icon="🎓"
            variant="blue"
            subtitle="Total student enrollments"
          />
          <RevenueKPICard
            title="Average Ticket Size"
            value={kpi.avgFee}
            prevValue={kpi.prevAvgFee}
            icon="🎫"
            variant="gray"
            isCurrency={true}
            subtitle="Avg. revenue per student"
          />
          <RevenueKPICard
            title="Organic Revenue"
            value={kpi.organicRevenue}
            prevValue={kpi.prevTotalRevenue > 0 ? kpi.prevTotalRevenue - kpi.prevTotalAdSpend * 2 : 0} // visual trend fallback
            icon="🔍"
            variant="green"
            isCurrency={true}
            subtitle="Non-paid acquisition channels"
          />
        </div>
      )}

      {/* ── SECTION B: Ad Spend mini stats ── */}
      {kpi && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <RevenueKPICard
            title="Total Ad Spend"
            value={kpi.totalAdSpend}
            prevValue={kpi.prevTotalAdSpend}
            icon="📢"
            variant="red"
            isCurrency={true}
            subtitle="Google + Meta campaign budget"
          />
          <RevenueKPICard
            title="Paid Ads Revenue"
            value={kpi.paidRevenue}
            prevValue={kpi.prevTotalAdSpend * kpi.prevOverallROAS}
            icon="🔥"
            variant="orange"
            isCurrency={true}
            subtitle="Yield from paid traffic"
          />
          <RevenueKPICard
            title="Blended ROAS"
            value={kpi.overallROAS}
            prevValue={kpi.prevOverallROAS}
            icon="📈"
            variant="amber"
            isPercent={false}
            subtitle="Paid revenue / Ad spend ratio"
          />
        </div>
      )}

      {/* ── SECTION C: Stream Comparison ── */}
      {activeMonthRow && (
        <RevenueOrganicPaidCard row={activeMonthRow} />
      )}

      {/* ── SECTION D: Trend Composed Chart ── */}
      <RevenueTrendChart rows={trendPoints} />
    </div>
  )
}
