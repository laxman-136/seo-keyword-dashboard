// app/leads/page.tsx
'use client';

import React, { useState, useEffect } from 'react'
import { useLeadsData } from '@/hooks/useLeadsData'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import LeadsKPICard from '@/components/leads/LeadsKPICard'
import LeadsChannelTable from '@/components/leads/LeadsChannelTable'
import LeadsFunnelCard from '@/components/leads/LeadsFunnelCard'
import LeadsTrendChart from '@/components/leads/LeadsTrendChart'
import LeadsCourseTable from '@/components/leads/LeadsCourseTable'
import LeadsConvTrendChart from '@/components/leads/LeadsConvTrendChart'
import LeadsMonthSelector from '@/components/leads/LeadsMonthSelector'
import { getLeadsKPI, getLeadsFunnel, getLeadsCourseBreakdown, getLeadsChannelSplit, getAvailableLeadsMonths } from '@/lib/sheets'
import { Info } from 'lucide-react'

export default function LeadsOverviewPage() {
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
            {error || 'Please fill in the Leads Monthly sheet in Google Sheets to populate the dashboard.'}
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

  const availableMonths = getAvailableLeadsMonths(monthly)
  const currentMonth = selectedMonth || monthly[monthly.length - 1].month
  const currentIndex = availableMonths.indexOf(currentMonth)
  const prevMonth = currentIndex > 0 ? availableMonths[currentIndex - 1] : 'N/A'
  const activeRows = monthly.slice(0, currentIndex + 1)
  const kpi = getLeadsKPI(activeRows)
  const funnel = getLeadsFunnel(monthly, currentMonth)
  const channelSplit = getLeadsChannelSplit(monthly, currentMonth)
  const courseBreakdown = getLeadsCourseBreakdown(detail, currentMonth)

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 lg:space-y-8 min-h-screen bg-slate-50">

      {/* ── HEADER ── */}
      <Header
        title="🎯 Leads Report"
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
          <p className="text-xs text-slate-400 mt-0.5">Select a month to drill into its performance metrics</p>
        </div>
        <LeadsMonthSelector
          months={availableMonths}
          selected={currentMonth}
          onChange={setSelectedMonth}
          label="Analyze Month"
        />
      </div>

      {/* ── SECTION A: KPI GRID (3 + 3 layout) ── */}
      <div className="space-y-3">
        {/* Row 1 — Volume Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <LeadsKPICard
            title="Total Leads"
            value={kpi.totalLeads}
            prevValue={kpi.prevTotalLeads}
            icon="📋"
            variant="blue"
            subtitle="All channels combined"
          />
          <LeadsKPICard
            title="Website Leads"
            value={kpi.websiteLeads}
            prevValue={kpi.totalLeads > 0 ? Math.round(kpi.prevTotalLeads * 0.72) : 0}
            icon="🌐"
            variant="indigo"
            subtitle="From website & paid ads"
          />
          <LeadsKPICard
            title="Organic Leads"
            value={kpi.organicLeads}
            prevValue={kpi.totalLeads > 0 ? Math.round(kpi.prevTotalLeads * 0.28) : 0}
            icon="🔍"
            variant="green"
            subtitle="From search & referrals"
          />
        </div>

        {/* Row 2 — Conversion Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <LeadsKPICard
            title="Enrolled"
            value={kpi.enrolled}
            prevValue={kpi.prevEnrolled}
            icon="🏆"
            variant="emerald"
            subtitle="Paid & confirmed students"
          />
          <LeadsKPICard
            title="High Potential"
            value={kpi.highPotential}
            prevValue={kpi.prevHighPotential}
            icon="🔥"
            variant="amber"
            subtitle="Ready to enroll soon"
          />
          <LeadsKPICard
            title="Conv. Rate"
            value={kpi.convRate}
            prevValue={kpi.prevConvRate}
            icon="📈"
            variant="purple"
            isPercent={true}
            subtitle="Leads → Enrollment rate"
          />
        </div>
      </div>

      {/* ── SECTION B: Channel Split + Funnel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7">
          <LeadsChannelTable split={channelSplit} />
        </div>
        <div className="lg:col-span-5">
          <LeadsFunnelCard funnel={funnel} />
        </div>
      </div>

      {/* ── SECTION C: Trend Chart ── */}
      <LeadsTrendChart rows={monthly} />

      {/* ── SECTION D: Course Breakdown ── */}
      {detail.length > 0 ? (
        <LeadsCourseTable courses={courseBreakdown} />
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p className="text-slate-400 text-sm">Add Leads Detail sheet to display course breakdowns</p>
        </div>
      )}

      {/* ── SECTION E: Conversion Trend ── */}
      <LeadsConvTrendChart rows={monthly} />
    </div>
  )
}
