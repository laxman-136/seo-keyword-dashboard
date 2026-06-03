// app/leads/trends/page.tsx
'use client';

import React, { useState, useEffect } from 'react'
import { useLeadsData } from '@/hooks/useLeadsData'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import LeadsTrendChart from '@/components/leads/LeadsTrendChart'
import LeadsHeatmapTable from '@/components/leads/LeadsHeatmapTable'
import LeadsMonthComparison from '@/components/leads/LeadsMonthComparison'
import LeadsMonthSelector from '@/components/leads/LeadsMonthSelector'
import LeadsQuarterlySummary from '@/components/leads/LeadsQuarterlySummary'
import { getAvailableLeadsMonths } from '@/lib/sheets'
import { Info } from 'lucide-react'

export default function LeadsTrendsPage() {
  const {
    monthly,
    detail,
    loading,
    refreshing,
    error,
    isMock,
    fallbackReason,
    lastUpdated,
    refresh
  } = useLeadsData()

  const [monthA, setMonthA] = useState('')
  const [monthB, setMonthB] = useState('')

  // Set default selected months for comparison (latest vs previous)
  useEffect(() => {
    if (monthly.length > 0) {
      if (!monthA) setMonthA(monthly[monthly.length - 1].month)
      if (!monthB) {
        setMonthB(monthly.length >= 2 ? monthly[monthly.length - 2].month : monthly[0].month)
      }
    }
  }, [monthly, monthA, monthB])

  if (loading) {
    return <SkeletonLoader />
  }

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
  const currentMonthA = monthA || monthly[monthly.length - 1].month
  const currentMonthB = monthB || (monthly.length >= 2 ? monthly[monthly.length - 2].month : monthly[0].month)

  // SECTION: Trend KPI Calculations
  const bestMonthRow = [...monthly].sort((x, y) => y.totalLeads - x.totalLeads)[0]
  const avgMonthlyLeads = monthly.reduce((sum, r) => sum + r.totalLeads, 0) / monthly.length
  const totalLeadsYTD = monthly.reduce((sum, r) => sum + r.totalLeads, 0)
  const totalEnrolledYTD = monthly.reduce((sum, r) => sum + r.enrolled, 0)
  const ytdConvRate = totalLeadsYTD > 0 ? (totalEnrolledYTD / totalLeadsYTD) * 100 : 0

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 lg:space-y-8 min-h-screen bg-slate-50">
      {/* Header Panel */}
      <Header
        title="📅 Monthly Lead Trends"
        currentMonth={currentMonthA}
        previousMonth={currentMonthB}
        lastUpdated={lastUpdated}
        isMock={isMock}
        warningText={fallbackReason}
        onRefresh={refresh}
        isRefreshing={refreshing}
      />

      {/* Selector Row */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
          🔍 Comparing {currentMonthA} vs {currentMonthB}
        </div>
        <LeadsMonthSelector
          months={availableMonths}
          selected={currentMonthA}
          onChange={setMonthA}
          selectedCompare={currentMonthB}
          onChangeCompare={setMonthB}
          label="Month A"
        />
      </div>

      {/* SECTION A: Trend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🏆 Best Performing Month</h4>
          <div>
            <p className="text-xl font-extrabold text-slate-800 mt-2">{bestMonthRow.month}</p>
            <p className="text-xs text-slate-500 mt-0.5">{bestMonthRow.totalLeads} leads acquired</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">📊 Avg Monthly Leads</h4>
          <div>
            <p className="text-2xl font-extrabold text-slate-800 mt-2">{Math.round(avgMonthlyLeads)}</p>
            <p className="text-xs text-slate-500 mt-0.5">leads per month average</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">📋 Cumulative Leads YTD</h4>
          <div>
            <p className="text-2xl font-extrabold text-slate-800 mt-2">{totalLeadsYTD.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-0.5">YTD leads count</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">📈 YTD Avg Conversion Rate</h4>
          <div>
            <p className="text-2xl font-extrabold text-emerald-600 mt-2">{ytdConvRate.toFixed(1)}%</p>
            <p className="text-xs text-slate-500 mt-0.5">enrolled vs acquired total</p>
          </div>
        </div>
      </div>

      {/* SECTION B: Full Bar Chart */}
      <div className="grid grid-cols-1 gap-6">
        <LeadsTrendChart rows={monthly} />
      </div>

      {/* SECTION C: Heatmap Density */}
      {detail.length > 0 && availableMonths.length >= 2 ? (
        <div className="grid grid-cols-1 gap-6">
          <LeadsHeatmapTable detailRows={detail} />
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p className="text-slate-400 text-sm">Add Leads Detail sheet data for multiple months to view the course heatmap.</p>
        </div>
      )}

      {/* SECTION D: Month Comparison Table */}
      <div className="grid grid-cols-1 gap-6">
        <LeadsMonthComparison rows={monthly} monthA={currentMonthA} monthB={currentMonthB} />
      </div>

      {/* SECTION E: Quarterly aggregates */}
      <div className="grid grid-cols-1 gap-6">
        <LeadsQuarterlySummary rows={monthly} />
      </div>
    </div>
  )
}
