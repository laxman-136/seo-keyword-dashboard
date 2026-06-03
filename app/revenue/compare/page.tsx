// app/revenue/compare/page.tsx
'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { useRevenueData } from '@/hooks/useRevenueData'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import RevenueMonthSelector from '@/components/revenue/RevenueMonthSelector'
import RevenueMonthComparison from '@/components/revenue/RevenueMonthComparison'
import RevenueQuarterlySummary from '@/components/revenue/RevenueQuarterlySummary'
import RevenueYearlySummary from '@/components/revenue/RevenueYearlySummary'
import RevenueQuarterSelector from '@/components/revenue/RevenueQuarterSelector'
import RevenueQuarterOrganicPaidCard from '@/components/revenue/RevenueQuarterOrganicPaidCard'
import RevenueQuarterComparisonTable from '@/components/revenue/RevenueQuarterComparisonTable'
import RevenueYearSelector from '@/components/revenue/RevenueYearSelector'
import RevenueYearOrganicPaidCard from '@/components/revenue/RevenueYearOrganicPaidCard'
import RevenueYearComparisonTable from '@/components/revenue/RevenueYearComparisonTable'
import RevenueKPICard from '@/components/revenue/RevenueKPICard'
import {
  getAvailableRevenueMonths,
  getRevenueQuarterlySummary,
  getRevenueYearlySummary,
  getRevenueQuarterlyDetails,
  getRevenueYearlyDetails
} from '@/lib/sheets'
import { Info, BarChart3, TrendingUp, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RevenueComparePage() {
  const {
    monthly,
    loading,
    refreshing,
    error,
    isMock,
    fallbackReason,
    lastUpdated,
    refresh
  } = useRevenueData()

  const [activeTab, setActiveTab] = useState<'mom' | 'quarterly' | 'yearly'>('mom')
  const [monthA, setMonthA] = useState('')
  const [monthB, setMonthB] = useState('')
  const [quarterA, setQuarterA] = useState('')
  const [quarterB, setQuarterB] = useState('')
  const [yearA, setYearA] = useState('')
  const [yearB, setYearB] = useState('')

  const availableMonths = useMemo(() => getAvailableRevenueMonths(monthly), [monthly])
  const quarterlySummary = useMemo(() => getRevenueQuarterlySummary(monthly), [monthly])
  const yearlySummary = useMemo(() => getRevenueYearlySummary(monthly), [monthly])
  const quarterlyDetails = useMemo(() => getRevenueQuarterlyDetails(monthly), [monthly])
  const yearlyDetails = useMemo(() => getRevenueYearlyDetails(monthly), [monthly])

  const availableQuarters = useMemo(() => {
    return quarterlyDetails.map(q => `${q.year} ${q.quarter}`)
  }, [quarterlyDetails])

  const availableYears = useMemo(() => {
    return yearlyDetails.map(y => y.year.toString())
  }, [yearlyDetails])

  // Initialize Monthly selectors
  useEffect(() => {
    if (availableMonths.length > 0) {
      if (!monthA) {
        setMonthA(availableMonths[availableMonths.length - 1])
      }
      if (!monthB) {
        const prev = availableMonths.length >= 2 ? availableMonths[availableMonths.length - 2] : availableMonths[0]
        setMonthB(prev)
      }
    }
  }, [availableMonths, monthA, monthB])

  // Initialize Quarterly selectors
  useEffect(() => {
    if (availableQuarters.length > 0) {
      if (!quarterA) {
        setQuarterA(availableQuarters[0]) // latest quarter is first
      }
      if (!quarterB) {
        const prev = availableQuarters.length >= 2 ? availableQuarters[1] : availableQuarters[0]
        setQuarterB(prev)
      }
    }
  }, [availableQuarters, quarterA, quarterB])

  // Initialize Yearly selectors
  useEffect(() => {
    if (availableYears.length > 0) {
      if (!yearA) {
        setYearA(availableYears[0]) // latest year is first
      }
      if (!yearB) {
        const prev = availableYears.length >= 2 ? availableYears[1] : availableYears[0]
        setYearB(prev)
      }
    }
  }, [availableYears, yearA, yearB])

  const currentMonth = monthA || (availableMonths.length > 0 ? availableMonths[availableMonths.length - 1] : '')
  const currentIndex = availableMonths.indexOf(currentMonth)
  const prevMonth = currentIndex > 0 ? availableMonths[currentIndex - 1] : undefined

  const activeQuarterRow = useMemo(() => {
    if (!quarterA || quarterlyDetails.length === 0) return null
    const parts = quarterA.split(' ')
    const yr = parseInt(parts[0], 10)
    const qtr = parts[1]
    return quarterlyDetails.find(r => r.year === yr && r.quarter.toLowerCase() === qtr.toLowerCase()) || null
  }, [quarterA, quarterlyDetails])

  const compQuarterRow = useMemo(() => {
    if (!quarterB || quarterlyDetails.length === 0) return null
    const parts = quarterB.split(' ')
    const yr = parseInt(parts[0], 10)
    const qtr = parts[1]
    return quarterlyDetails.find(r => r.year === yr && r.quarter.toLowerCase() === qtr.toLowerCase()) || null
  }, [quarterB, quarterlyDetails])

  const activeYearRow = useMemo(() => {
    if (!yearA || yearlyDetails.length === 0) return null
    const yr = parseInt(yearA, 10)
    return yearlyDetails.find(r => r.year === yr) || null
  }, [yearA, yearlyDetails])

  const compYearRow = useMemo(() => {
    if (!yearB || yearlyDetails.length === 0) return null
    const yr = parseInt(yearB, 10)
    return yearlyDetails.find(r => r.year === yr) || null
  }, [yearB, yearlyDetails])

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
            {error || 'Please populate the Revenue Monthly tab in Google Sheets to load the comparison reports.'}
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
        title="💰 Compare & Reports"
        currentMonth={currentMonth}
        previousMonth={prevMonth}
        lastUpdated={lastUpdated}
        isMock={isMock}
        warningText={fallbackReason}
        onRefresh={refresh}
        isRefreshing={refreshing}
      />

      {/* ── TAB BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-1">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('mom')}
            className={cn(
              "px-5 py-3 rounded-t-xl font-semibold text-sm transition-all border-b-2 flex items-center gap-2 outline-none",
              activeTab === 'mom'
                ? "border-violet-600 bg-white text-violet-600 shadow-sm"
                : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
            )}
          >
            <CalendarDays className="w-4 h-4" />
            Month-vs-Month Comparison
          </button>
          <button
            onClick={() => setActiveTab('quarterly')}
            className={cn(
              "px-5 py-3 rounded-t-xl font-semibold text-sm transition-all border-b-2 flex items-center gap-2 outline-none",
              activeTab === 'quarterly'
                ? "border-violet-600 bg-white text-violet-600 shadow-sm"
                : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Quarterly Reports
          </button>
          <button
            onClick={() => setActiveTab('yearly')}
            className={cn(
              "px-5 py-3 rounded-t-xl font-semibold text-sm transition-all border-b-2 flex items-center gap-2 outline-none",
              activeTab === 'yearly'
                ? "border-violet-600 bg-white text-violet-600 shadow-sm"
                : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
            )}
          >
            <TrendingUp className="w-4 h-4" />
            Yearly Financials
          </button>
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="space-y-6">
        {activeTab === 'mom' && (
          <>
            {/* MoM Period Selector Controls */}
            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-700">Audit Period Selection</p>
                <p className="text-xs text-slate-400 mt-0.5">Select two months to contrast and calculate delta metrics</p>
              </div>
              <RevenueMonthSelector
                months={availableMonths}
                selected={monthA}
                onChange={setMonthA}
                selectedCompare={monthB}
                onChangeCompare={setMonthB}
                label="Primary Month"
              />
            </div>

            {/* Side-by-side MoM details */}
            {monthA && monthB && (
              <RevenueMonthComparison
                rows={monthly}
                monthA={monthA}
                monthB={monthB}
              />
            )}
          </>
        )}

        {activeTab === 'quarterly' && (
          <>
            {/* Quarter selector controls */}
            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-700">Quarter Audit Selection</p>
                <p className="text-xs text-slate-400 mt-0.5">Select two quarters to contrast and calculate delta metrics</p>
              </div>
              {availableQuarters.length > 0 && (
                <RevenueQuarterSelector
                  quarters={availableQuarters}
                  selected={quarterA}
                  onChange={setQuarterA}
                  selectedCompare={quarterB}
                  onChangeCompare={setQuarterB}
                  label="Primary Quarter"
                />
              )}
            </div>

            {/* KPI cards comparing Quarter A vs Quarter B */}
            {quarterA && activeQuarterRow && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <RevenueKPICard
                    title="Gross Revenue"
                    value={activeQuarterRow.totalRevenue}
                    prevValue={compQuarterRow?.totalRevenue ?? 0}
                    icon="💰"
                    variant="emerald"
                    isCurrency={true}
                    subtitle="Total quarter yield"
                  />
                  <RevenueKPICard
                    title="Conversions"
                    value={activeQuarterRow.conversions}
                    prevValue={compQuarterRow?.conversions ?? 0}
                    icon="🎓"
                    variant="blue"
                    subtitle="Quarter acquisitions"
                  />
                  <RevenueKPICard
                    title="Average Fee"
                    value={activeQuarterRow.avgFee}
                    prevValue={compQuarterRow?.avgFee ?? 0}
                    icon="🎫"
                    variant="gray"
                    isCurrency={true}
                    subtitle="Avg per conversion"
                  />
                  <RevenueKPICard
                    title="Organic Revenue"
                    value={activeQuarterRow.organicRevenue}
                    prevValue={compQuarterRow?.organicRevenue ?? 0}
                    icon="🔍"
                    variant="green"
                    isCurrency={true}
                    subtitle="Organic acquisitions"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <RevenueKPICard
                    title="Total Ad Spend"
                    value={activeQuarterRow.totalAdSpend}
                    prevValue={compQuarterRow?.totalAdSpend ?? 0}
                    icon="📢"
                    variant="red"
                    isCurrency={true}
                    subtitle="Quarter ad spend"
                  />
                  <RevenueKPICard
                    title="Paid Ads Revenue"
                    value={activeQuarterRow.paidRevenue}
                    prevValue={compQuarterRow?.paidRevenue ?? 0}
                    icon="🔥"
                    variant="orange"
                    isCurrency={true}
                    subtitle="Paid conversions yield"
                  />
                  <RevenueKPICard
                    title="Overall ROAS"
                    value={activeQuarterRow.overallROAS}
                    prevValue={compQuarterRow?.overallROAS ?? 0}
                    icon="📈"
                    variant="amber"
                    subtitle="Paid revenue / spend ratio"
                  />
                </div>

                {/* Stream Breakdown */}
                <RevenueQuarterOrganicPaidCard row={activeQuarterRow} />

                {/* Side-by-side Metric Comparison Table */}
                {quarterB && (
                  <RevenueQuarterComparisonTable
                    rows={quarterlyDetails}
                    quarterA={quarterA}
                    quarterB={quarterB}
                  />
                )}
              </div>
            )}

            {/* General chronological table */}
            <div className="mt-8 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-800 mb-3 px-1">📊 All Quarters Summary</h4>
              <RevenueQuarterlySummary rows={quarterlySummary} />
            </div>
          </>
        )}

        {activeTab === 'yearly' && (
          <>
            {/* Year selector controls */}
            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-700">Year Audit Selection</p>
                <p className="text-xs text-slate-400 mt-0.5">Select two years to contrast and calculate YoY delta metrics</p>
              </div>
              {availableYears.length > 0 && (
                <RevenueYearSelector
                  years={availableYears}
                  selected={yearA}
                  onChange={setYearA}
                  selectedCompare={yearB}
                  onChangeCompare={setYearB}
                  label="Primary Year"
                />
              )}
            </div>

            {/* KPI cards comparing Year A vs Year B */}
            {yearA && activeYearRow && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <RevenueKPICard
                    title="Gross Revenue"
                    value={activeYearRow.totalRevenue}
                    prevValue={compYearRow?.totalRevenue ?? 0}
                    icon="💰"
                    variant="emerald"
                    isCurrency={true}
                    subtitle="Total year yield"
                  />
                  <RevenueKPICard
                    title="Conversions"
                    value={activeYearRow.conversions}
                    prevValue={compYearRow?.conversions ?? 0}
                    icon="🎓"
                    variant="blue"
                    subtitle="Year acquisitions"
                  />
                  <RevenueKPICard
                    title="Average Fee"
                    value={activeYearRow.avgFee}
                    prevValue={compYearRow?.avgFee ?? 0}
                    icon="🎫"
                    variant="gray"
                    isCurrency={true}
                    subtitle="Avg per conversion"
                  />
                  <RevenueKPICard
                    title="Organic Revenue"
                    value={activeYearRow.organicRevenue}
                    prevValue={compYearRow?.organicRevenue ?? 0}
                    icon="🔍"
                    variant="green"
                    isCurrency={true}
                    subtitle="Organic acquisitions"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <RevenueKPICard
                    title="Total Ad Spend"
                    value={activeYearRow.totalAdSpend}
                    prevValue={compYearRow?.totalAdSpend ?? 0}
                    icon="📢"
                    variant="red"
                    isCurrency={true}
                    subtitle="Year ad spend"
                  />
                  <RevenueKPICard
                    title="Paid Ads Revenue"
                    value={activeYearRow.paidRevenue}
                    prevValue={compYearRow?.paidRevenue ?? 0}
                    icon="🔥"
                    variant="orange"
                    isCurrency={true}
                    subtitle="Paid conversions yield"
                  />
                  <RevenueKPICard
                    title="Overall ROAS"
                    value={activeYearRow.overallROAS}
                    prevValue={compYearRow?.overallROAS ?? 0}
                    icon="📈"
                    variant="amber"
                    subtitle="Paid revenue / spend ratio"
                  />
                </div>

                {/* Stream Breakdown */}
                <RevenueYearOrganicPaidCard row={activeYearRow} />

                {/* Side-by-side Metric Comparison Table */}
                {yearB && (
                  <RevenueYearComparisonTable
                    rows={yearlyDetails}
                    yearA={yearA}
                    yearB={yearB}
                  />
                )}
              </div>
            )}

            {/* General chronological table */}
            <div className="mt-8 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-800 mb-3 px-1">📊 All Years Summary</h4>
              <RevenueYearlySummary rows={yearlySummary} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
