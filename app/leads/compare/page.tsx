// app/leads/compare/page.tsx
'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { useLeadsData } from '@/hooks/useLeadsData'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import LeadsMonthSelector from '@/components/leads/LeadsMonthSelector'
import LeadsMonthComparison from '@/components/leads/LeadsMonthComparison'
import LeadsQuarterSelector from '@/components/leads/LeadsQuarterSelector'
import LeadsQuarterComparisonTable from '@/components/leads/LeadsQuarterComparisonTable'
import LeadsQuarterlySummary from '@/components/leads/LeadsQuarterlySummary'
import LeadsYearSelector from '@/components/leads/LeadsYearSelector'
import LeadsYearComparisonTable from '@/components/leads/LeadsYearComparisonTable'
import LeadsYearlySummary from '@/components/leads/LeadsYearlySummary'
import LeadsKPICard from '@/components/leads/LeadsKPICard'
import CourseSelector from '@/components/leads/CourseSelector'
import {
  getAvailableLeadsMonths,
  getLeadsQuarterlyDetails,
  getLeadsYearlyDetails
} from '@/lib/sheets'
import { Info, BarChart3, TrendingUp, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LeadsComparePage() {
  const [selectedCourse, setSelectedCourse] = useState('all')

  const {
    monthly,
    loading,
    refreshing,
    error,
    isMock,
    fallbackReason,
    lastUpdated,
    refresh
  } = useLeadsData(selectedCourse)

  const [activeTab, setActiveTab] = useState<'mom' | 'quarterly' | 'yearly'>('mom')
  const [monthA, setMonthA] = useState('')
  const [monthB, setMonthB] = useState('')
  const [quarterA, setQuarterA] = useState('')
  const [quarterB, setQuarterB] = useState('')
  const [yearA, setYearA] = useState('')
  const [yearB, setYearB] = useState('')

  const availableMonths = useMemo(() => getAvailableLeadsMonths(monthly), [monthly])
  const quarterlyDetails = useMemo(() => getLeadsQuarterlyDetails(monthly), [monthly])
  const yearlyDetails = useMemo(() => getLeadsYearlyDetails(monthly), [monthly])

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
        setQuarterA(availableQuarters[0]) // latest quarter first
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
        setYearA(availableYears[0]) // latest year first
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

  // Active records for Monthly MoM metrics
  const activeMonthRow = useMemo(() => {
    if (!monthA || monthly.length === 0) return null
    return monthly.find(r => r.month.toLowerCase() === monthA.toLowerCase()) || null
  }, [monthA, monthly])

  const compMonthRow = useMemo(() => {
    if (!monthB || monthly.length === 0) return null
    return monthly.find(r => r.month.toLowerCase() === monthB.toLowerCase()) || null
  }, [monthB, monthly])

  // Active records for Quarterly QoQ metrics
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

  // Active records for Yearly YoY metrics
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
          <h2 className="text-xl font-bold text-slate-800">No leads data yet</h2>
          <p className="text-slate-400 text-sm mt-3">
            {error || 'Please fill in the Leads Monthly tab in Google Sheets to load the comparison reports.'}
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
        title="🎯 Leads Compare & Reports"
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
                ? "border-violet-650 bg-white text-violet-600 shadow-sm"
                : "border-transparent text-slate-450 hover:text-slate-655 hover:bg-slate-100/50"
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
                ? "border-violet-650 bg-white text-violet-600 shadow-sm"
                : "border-transparent text-slate-450 hover:text-slate-655 hover:bg-slate-100/50"
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
                ? "border-violet-650 bg-white text-violet-600 shadow-sm"
                : "border-transparent text-slate-450 hover:text-slate-655 hover:bg-slate-100/50"
            )}
          >
            <TrendingUp className="w-4 h-4" />
            Yearly Financials
          </button>
        </div>
        <div className="pb-2 md:pb-0">
          <CourseSelector selectedCourse={selectedCourse} onChange={setSelectedCourse} />
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
              <LeadsMonthSelector
                months={availableMonths}
                selected={monthA}
                onChange={setMonthA}
                selectedCompare={monthB}
                onChangeCompare={setMonthB}
                label="Primary Month"
              />
            </div>

            {/* MoM KPI Grid */}
            {monthA && activeMonthRow && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <LeadsKPICard
                    title="Total Leads"
                    value={activeMonthRow.totalLeads}
                    prevValue={compMonthRow?.totalLeads ?? 0}
                    icon="📋"
                    variant="blue"
                    subtitle="All channels combined"
                  />
                  <LeadsKPICard
                    title="Website Leads"
                    value={activeMonthRow.websiteLeads}
                    prevValue={compMonthRow?.websiteLeads ?? 0}
                    icon="🌐"
                    variant="indigo"
                    subtitle="From website & chatbots"
                  />
                  <LeadsKPICard
                    title="Organic Leads"
                    value={activeMonthRow.organicLeads}
                    prevValue={compMonthRow?.organicLeads ?? 0}
                    icon="🔍"
                    variant="green"
                    subtitle="From search & referrals"
                  />
                  <LeadsKPICard
                    title="LLM Leads"
                    value={activeMonthRow.llmLeads || 0}
                    prevValue={compMonthRow?.llmLeads ?? 0}
                    icon="🤖"
                    variant="pink"
                    subtitle="ChatGPT & Perplexity"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <LeadsKPICard
                    title="Enrolled"
                    value={activeMonthRow.enrolled}
                    prevValue={compMonthRow?.enrolled ?? 0}
                    icon="🏆"
                    variant="emerald"
                    subtitle="Paid & confirmed students"
                  />
                  <LeadsKPICard
                    title="High Potential"
                    value={activeMonthRow.highPotential}
                    prevValue={compMonthRow?.highPotential ?? 0}
                    icon="🔥"
                    variant="amber"
                    subtitle="Ready to enroll soon"
                  />
                  <LeadsKPICard
                    title="Conv. Rate"
                    value={activeMonthRow.convRate}
                    prevValue={compMonthRow?.convRate ?? 0}
                    icon="📈"
                    variant="purple"
                    isPercent={true}
                    subtitle="Leads → Enrollment rate"
                  />
                </div>
              </div>
            )}

            {/* Side-by-side MoM details */}
            {monthA && monthB && (
              <LeadsMonthComparison
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
                <p className="text-xs text-slate-400 mt-0.5">Select two quarters to contrast and calculate QoQ delta metrics</p>
              </div>
              {availableQuarters.length > 0 && (
                <LeadsQuarterSelector
                  quarters={availableQuarters}
                  selected={quarterA}
                  onChange={setQuarterA}
                  selectedCompare={quarterB}
                  onChangeCompare={setQuarterB}
                  label="Primary Quarter"
                />
              )}
            </div>

            {/* QoQ KPI Grid */}
            {quarterA && activeQuarterRow && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <LeadsKPICard
                    title="Total Leads"
                    value={activeQuarterRow.totalLeads}
                    prevValue={compQuarterRow?.totalLeads ?? 0}
                    icon="📋"
                    variant="blue"
                    subtitle="All channels combined"
                  />
                  <LeadsKPICard
                    title="Website Leads"
                    value={activeQuarterRow.websiteLeads}
                    prevValue={compQuarterRow?.websiteLeads ?? 0}
                    icon="🌐"
                    variant="indigo"
                    subtitle="From website & chatbots"
                  />
                  <LeadsKPICard
                    title="Organic Leads"
                    value={activeQuarterRow.organicLeads}
                    prevValue={compQuarterRow?.organicLeads ?? 0}
                    icon="🔍"
                    variant="green"
                    subtitle="From search & referrals"
                  />
                  <LeadsKPICard
                    title="LLM Leads"
                    value={activeQuarterRow.llmLeads || 0}
                    prevValue={compQuarterRow?.llmLeads ?? 0}
                    icon="🤖"
                    variant="pink"
                    subtitle="ChatGPT & Perplexity"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <LeadsKPICard
                    title="Enrolled"
                    value={activeQuarterRow.enrolled}
                    prevValue={compQuarterRow?.enrolled ?? 0}
                    icon="🏆"
                    variant="emerald"
                    subtitle="Paid & confirmed students"
                  />
                  <LeadsKPICard
                    title="High Potential"
                    value={activeQuarterRow.highPotential}
                    prevValue={compQuarterRow?.highPotential ?? 0}
                    icon="🔥"
                    variant="amber"
                    subtitle="Ready to enroll soon"
                  />
                  <LeadsKPICard
                    title="Conv. Rate"
                    value={activeQuarterRow.convRate}
                    prevValue={compQuarterRow?.convRate ?? 0}
                    icon="📈"
                    variant="purple"
                    isPercent={true}
                    subtitle="Leads → Enrollment rate"
                  />
                </div>
              </div>
            )}

            {/* Side-by-side Metric Comparison Table */}
            {quarterA && quarterB && (
              <LeadsQuarterComparisonTable
                rows={quarterlyDetails}
                quarterA={quarterA}
                quarterB={quarterB}
              />
            )}

            {/* General chronological table */}
            <div className="mt-8 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-800 mb-3 px-1">📊 All Quarters Summary</h4>
              <LeadsQuarterlySummary rows={monthly} />
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
                <LeadsYearSelector
                  years={availableYears}
                  selected={yearA}
                  onChange={setYearA}
                  selectedCompare={yearB}
                  onChangeCompare={setYearB}
                  label="Primary Year"
                />
              )}
            </div>

            {/* YoY KPI Grid */}
            {yearA && activeYearRow && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <LeadsKPICard
                    title="Total Leads"
                    value={activeYearRow.totalLeads}
                    prevValue={compYearRow?.totalLeads ?? 0}
                    icon="📋"
                    variant="blue"
                    subtitle="All channels combined"
                  />
                  <LeadsKPICard
                    title="Website Leads"
                    value={activeYearRow.websiteLeads}
                    prevValue={compYearRow?.websiteLeads ?? 0}
                    icon="🌐"
                    variant="indigo"
                    subtitle="From website & chatbots"
                  />
                  <LeadsKPICard
                    title="Organic Leads"
                    value={activeYearRow.organicLeads}
                    prevValue={compYearRow?.organicLeads ?? 0}
                    icon="🔍"
                    variant="green"
                    subtitle="From search & referrals"
                  />
                  <LeadsKPICard
                    title="LLM Leads"
                    value={activeYearRow.llmLeads || 0}
                    prevValue={compYearRow?.llmLeads ?? 0}
                    icon="🤖"
                    variant="pink"
                    subtitle="ChatGPT & Perplexity"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <LeadsKPICard
                    title="Enrolled"
                    value={activeYearRow.enrolled}
                    prevValue={compYearRow?.enrolled ?? 0}
                    icon="🏆"
                    variant="emerald"
                    subtitle="Paid & confirmed students"
                  />
                  <LeadsKPICard
                    title="High Potential"
                    value={activeYearRow.highPotential}
                    prevValue={compYearRow?.highPotential ?? 0}
                    icon="🔥"
                    variant="amber"
                    subtitle="Ready to enroll soon"
                  />
                  <LeadsKPICard
                    title="Conv. Rate"
                    value={activeYearRow.convRate}
                    prevValue={compYearRow?.convRate ?? 0}
                    icon="📈"
                    variant="purple"
                    isPercent={true}
                    subtitle="Leads → Enrollment rate"
                  />
                </div>
              </div>
            )}

            {/* Side-by-side Metric Comparison Table */}
            {yearA && yearB && (
              <LeadsYearComparisonTable
                rows={yearlyDetails}
                yearA={yearA}
                yearB={yearB}
              />
            )}

            {/* General chronological table */}
            <div className="mt-8 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-800 mb-3 px-1">📊 All Years Summary</h4>
              <LeadsYearlySummary rows={yearlyDetails} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
