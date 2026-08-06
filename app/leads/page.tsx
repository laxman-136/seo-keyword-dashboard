// app/leads/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import LeadsKPICard from '@/components/leads/LeadsKPICard'
import LeadsChannelTable from '@/components/leads/LeadsChannelTable'
import LeadsFunnelCard from '@/components/leads/LeadsFunnelCard'
import LeadsTrendChart from '@/components/leads/LeadsTrendChart'
import LeadsCourseTable from '@/components/leads/LeadsCourseTable'
import LeadsConvTrendChart from '@/components/leads/LeadsConvTrendChart'
import LiveDataBadge from '@/components/leads/LiveDataBadge'
import RefreshBar from '@/components/leads/RefreshBar'
import StageDrillDown from '@/components/leads/StageDrillDown'
import DateRangePicker from '@/components/ads/DateRangePicker'
import CourseSelector from '@/components/leads/CourseSelector'
import { useDateRange } from '@/hooks/useDateRange'
import { Info } from 'lucide-react'

export default function LeadsOverviewPage() {
  const { preset, from, to, label: rangeLabel } = useDateRange()

  const [data, setData] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [trend, setTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState('all')

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const headers: Record<string, string> = {}
      if (typeof window !== 'undefined') {
        const clientToken = localStorage.getItem('client-telecrm-api-token')
        const clientEnterpriseId = localStorage.getItem('client-telecrm-enterprise-id')
        if (clientToken) headers['x-telecrm-api-token'] = clientToken
        if (clientEnterpriseId) headers['x-telecrm-enterprise-id'] = clientEnterpriseId
      }

      const refreshParam = isRefresh ? '&refresh=true' : ''
      const courseParam = selectedCourse !== 'all' ? `&course=${encodeURIComponent(selectedCourse)}` : ''
      const urlMain = `/api/leads?from=${from}&to=${to}${refreshParam}${courseParam}`
      const urlCourses = `/api/leads/courses?from=${from}&to=${to}${refreshParam}${courseParam}`
      const urlTrend = `/api/leads/trend?months=6${refreshParam}${courseParam}`

      const [resMain, resCourses, resTrend] = await Promise.all([
        fetch(urlMain, { headers }),
        fetch(urlCourses, { headers }),
        fetch(urlTrend, { headers })
      ])

      if (!resMain.ok) {
        const errorData = await resMain.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch leads overview (Status: ${resMain.status})`)
      }
      if (!resCourses.ok) {
        const errorData = await resCourses.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch course breakdown (Status: ${resCourses.status})`)
      }
      if (!resTrend.ok) {
        const errorData = await resTrend.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch monthly trend (Status: ${resTrend.status})`)
      }

      const payloadMain = await resMain.json()
      const payloadCourses = await resCourses.json()
      const payloadTrend = await resTrend.json()

      setData(payloadMain)
      setCourses(payloadCourses)
      setTrend(payloadTrend)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Error loading leads details')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [from, to, selectedCourse])

  // --- ROI & FINANCIALS STATE & EFFECTS ---
  const [activeTab, setActiveTab] = useState<'overview' | 'roi' | 'batch'>('overview')
  const [financials, setFinancials] = useState<any[] | null>(null)
  const [financialsLoading, setFinancialsLoading] = useState(false)
  const [budgetMonth, setBudgetMonth] = useState('')
  const [budgetChannel, setBudgetChannel] = useState('Organic')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [savingBudget, setSavingBudget] = useState(false)
  const [budgetFeedback, setBudgetFeedback] = useState<string | null>(null)

  // --- BATCH REVENUE STATE ---
  const [batchRevenue, setBatchRevenue] = useState<any[]>([])
  const [batchRevenueLoading, setBatchRevenueLoading] = useState(false)

  const fetchFinancials = useCallback(async (isRefresh = false) => {
    setFinancialsLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (typeof window !== 'undefined') {
        const clientToken = localStorage.getItem('client-telecrm-api-token')
        const clientEnterpriseId = localStorage.getItem('client-telecrm-enterprise-id')
        if (clientToken) headers['x-telecrm-api-token'] = clientToken
        if (clientEnterpriseId) headers['x-telecrm-enterprise-id'] = clientEnterpriseId
      }
      const refreshParam = isRefresh ? '&refresh=true' : ''
      const courseParam = selectedCourse !== 'all' ? `&course=${encodeURIComponent(selectedCourse)}` : ''
      const res = await fetch(`/api/leads/financials?from=${from}&to=${to}${refreshParam}${courseParam}`, { headers })
      if (!res.ok) {
        throw new Error('Failed to fetch financials')
      }
      const payload = await res.json()
      setFinancials(payload)
    } catch (err) {
      console.error(err)
    } finally {
      setFinancialsLoading(false)
    }
  }, [from, to, selectedCourse])

  const fetchBatchRevenue = useCallback(async (isRefresh = false) => {
    setBatchRevenueLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (isRefresh) {
        queryParams.set('refresh', 'true')
      }
      
      const clientSeoSheetId = localStorage.getItem('client-seo-sheet-id')
      const clientApiKey = localStorage.getItem('client-api-key')
      
      if (clientSeoSheetId) {
        queryParams.set('sheetId', clientSeoSheetId === 'mock' ? 'mock' : clientSeoSheetId)
        if (clientApiKey) {
          queryParams.set('apiKey', clientApiKey)
        }
      }

      const res = await fetch(`/api/revenue?${queryParams.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to fetch batch revenue')
      }
      const data = await res.json()
      
      const coursesRows: any[] = data.courses || []
      const batchMap: Record<string, any> = {}
      
      coursesRows.forEach(row => {
        const batch = (row.batchNo || '').trim()
        if (!batch) return
        
        if (!batchMap[batch]) {
          batchMap[batch] = {
            batchNo: batch,
            faculty: new Set(),
            conversions: 0,
            revenue: 0,
            adSpend: 0,
            paidRevenue: 0
          }
        }
        
        batchMap[batch].conversions += row.conversions || 0
        batchMap[batch].revenue += row.revenue || 0
        batchMap[batch].adSpend += row.totalAdSpend || 0
        batchMap[batch].paidRevenue += row.paidRevenue || 0
        if (row.faculty) {
          row.faculty.split(',').forEach((f: string) => {
            const trimmed = f.trim()
            if (trimmed) batchMap[batch].faculty.add(trimmed)
          })
        }
      })
      
      const aggregated = Object.values(batchMap).map((b: any) => ({
        batchNo: b.batchNo,
        faculty: Array.from(b.faculty).join(', '),
        conversions: b.conversions,
        revenue: b.revenue,
        adSpend: b.adSpend,
        avgFee: b.conversions > 0 ? Math.round(b.revenue / b.conversions) : 0,
        roas: b.adSpend > 0 ? parseFloat((b.paidRevenue / b.adSpend).toFixed(2)) : 0
      }))
      
      aggregated.sort((a, b) => a.batchNo.localeCompare(b.batchNo, undefined, { numeric: true, sensitivity: 'base' }))
      setBatchRevenue(aggregated)
    } catch (err) {
      console.error('Error fetching batch revenue:', err)
    } finally {
      setBatchRevenueLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'batch') {
      fetchBatchRevenue()
    }
  }, [activeTab, fetchBatchRevenue])

  const getMonthsList = useCallback(() => {
    if (!from || !to) return []
    const months: string[] = []
    const start = new Date(from)
    const end = new Date(to)
    const current = new Date(start.getFullYear(), start.getMonth(), 1)
    
    while (current <= end) {
      months.push(current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
      current.setMonth(current.getMonth() + 1)
    }
    return months
  }, [from, to])

  useEffect(() => {
    if (from) {
      const d = new Date(from)
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      setBudgetMonth(label)
    }
  }, [from])

  useEffect(() => {
    if (activeTab === 'roi') {
      fetchFinancials()
    }
  }, [activeTab, fetchFinancials])

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!budgetMonth || !budgetChannel || !budgetAmount) return
    
    setSavingBudget(true)
    setBudgetFeedback(null)
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (typeof window !== 'undefined') {
        const clientToken = localStorage.getItem('client-telecrm-api-token')
        const clientEnterpriseId = localStorage.getItem('client-telecrm-enterprise-id')
        if (clientToken) headers['x-telecrm-api-token'] = clientToken
        if (clientEnterpriseId) headers['x-telecrm-enterprise-id'] = clientEnterpriseId
      }
      
      const res = await fetch('/api/leads/budgets', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          month: budgetMonth,
          channel: budgetChannel,
          budget: parseFloat(budgetAmount)
        })
      })
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to save budget')
      }
      
      setBudgetFeedback(`Successfully saved budget for ${budgetChannel} in ${budgetMonth}!`)
      setBudgetAmount('')
      
      fetchFinancials(true)
    } catch (err: any) {
      console.error(err)
      setBudgetFeedback(`Error: ${err.message}`)
    } finally {
      setSavingBudget(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const handleConfigChange = () => {
      fetchData()
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('active-config-updated', handleConfigChange)
      return () => {
        window.removeEventListener('active-config-updated', handleConfigChange)
      }
    }
  }, [fetchData])

  if (loading) return <SkeletonLoader />

  if (error || !data) {
    return (
      <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-red-100 shadow-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-6 shadow-sm">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Connection Failed</h2>
          <p className="text-slate-400 text-sm mt-3">
            {error || 'Unable to connect to TeleCRM Live API. Check your Settings credentials.'}
          </p>
          <button
            onClick={() => fetchData()}
            className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all w-full"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  const { kpi, funnel, channels } = data

  const channelSplit = channels.map((c: any) => ({
    channel: c.channel,
    leads: c.total,
    enrolled: c.enrolled,
    highPotential: c.highPotential,
    sharePercent: c.sharePercent,
    convRate: c.convRate
  }))

  const mappedCourses = courses.map((c: any) => ({
    ...c,
    organic: c.organicLeads,
    website: c.websiteLeads,
    ads: c.adsLeads,
    llm: c.llmLeads
  }))

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 lg:space-y-8 min-h-screen bg-slate-50">

      {/* ── HEADER ── */}
      <Header
        title="🎯 Leads Report"
        currentMonth={rangeLabel}
        onRefresh={() => fetchData(true)}
        isRefreshing={refreshing}
      />

      {/* ── LIVE BADGE & SELECTORS ROW ── */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <LiveDataBadge />
          <div>
            <p className="text-xs text-slate-400 mt-0.5">Showing live CRM statistics synced with TeleCRM Enterprise</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {activeTab === 'batch' ? (
            <RefreshBar
              loading={batchRevenueLoading}
              refreshing={batchRevenueLoading}
              lastUpdated={new Date().toISOString()}
              onRefresh={() => fetchBatchRevenue(true)}
            />
          ) : (
            <>
              <RefreshBar
                loading={loading}
                refreshing={refreshing}
                lastUpdated={data?.kpi?.lastRefreshedAt || new Date().toISOString()}
                onRefresh={() => fetchData(true)}
              />
              <DateRangePicker />
              <CourseSelector selectedCourse={selectedCourse} onChange={setSelectedCourse} />
            </>
          )}
        </div>
      </div>

      {/* ── TABS SELECTOR ── */}
      <div className="flex border-b border-slate-200 gap-6 mt-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 font-semibold text-sm transition-all relative ${
            activeTab === 'overview' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          📈 Overview & Funnel
        </button>
        <button
          onClick={() => {
            setActiveTab('roi')
            fetchFinancials()
          }}
          className={`pb-3 font-semibold text-sm transition-all relative ${
            activeTab === 'roi' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          💸 ROI & Financials
        </button>
        <button
          onClick={() => {
            setActiveTab('batch')
          }}
          className={`pb-3 font-semibold text-sm transition-all relative ${
            activeTab === 'batch' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          📦 Batch-wise Revenue
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* ── SECTION A: KPI GRID ── */}
          <div className="space-y-3">
            {/* Row 1 — Volume Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <LeadsKPICard
                title="Total Leads"
                value={kpi.totalLeads}
                prevValue={kpi.prevTotalLeads}
                icon="📋"
                variant="blue"
                subtitle="All channels combined"
              />
          <LeadsKPICard
            title="Paid Ads Leads"
            value={kpi.adsLeads}
            prevValue={kpi.prevAdsLeads}
            icon="💰"
            variant="indigo"
            subtitle="Google Ads & Meta Ads"
          />
          <LeadsKPICard
            title="Website Leads"
            value={kpi.websiteLeads}
            prevValue={kpi.prevWebsiteLeads}
            icon="🌐"
            variant="gray"
            subtitle="Direct website inquiries"
          />
          <LeadsKPICard
            title="Organic Leads"
            value={kpi.organicLeads}
            prevValue={kpi.prevOrganicLeads}
            icon="🔍"
            variant="green"
            subtitle="From search & referrals"
          />
          <LeadsKPICard
            title="LLM Leads"
            value={kpi.llmLeads || 0}
            prevValue={kpi.prevLLMLeads || 0}
            icon="🤖"
            variant="pink"
            subtitle="ChatGPT & Perplexity"
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

      {/* ── SECTION C: Accordion Drilldown ── */}
      <StageDrillDown stageBreakdown={funnel.stageBreakdown} />

      {/* ── SECTION D: Trend Chart ── */}
      <LeadsTrendChart rows={trend} />

      {/* ── SECTION E: Course Breakdown ── */}
      {mappedCourses.length > 0 ? (
        <LeadsCourseTable courses={mappedCourses} />
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p className="text-slate-400 text-sm">No courses recorded in this period</p>
        </div>
      )}

      {/* ── SECTION F: Conversion Trend ── */}
      <LeadsConvTrendChart rows={trend} />
        </>
      )}

      {activeTab === 'roi' && (
        <div className="space-y-6">
          {/* Budget Entry Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">💼 Add Custom Monthly Budget (Organic & Non-Paid Channels)</h3>
            <p className="text-xs text-slate-400">
              Input operational budgets spent on SEO content, tools, chatbot services, or social campaigns to calculate ROI and CPL.
            </p>
            <form onSubmit={handleSaveBudget} className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Target Month</label>
                <select
                  value={budgetMonth}
                  onChange={(e) => setBudgetMonth(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none min-w-[150px]"
                >
                  {getMonthsList().map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Marketing Channel</label>
                <select
                  value={budgetChannel}
                  onChange={(e) => setBudgetChannel(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none min-w-[150px]"
                >
                  <option value="Organic">Organic</option>
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="LLM">LLM</option>
                  <option value="SOT">SOT</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Budget Amount (INR)</label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none max-w-[150px]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingBudget}
                className="mt-5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all self-end"
              >
                {savingBudget ? 'Saving...' : 'Save Budget'}
              </button>
            </form>
            {budgetFeedback && (
              <p className={`text-xs ${budgetFeedback.startsWith('Error') ? 'text-red-500' : 'text-emerald-500'}`}>
                {budgetFeedback}
              </p>
            )}
          </div>

          {/* Financial KPIs */}
          {financialsLoading ? (
            <SkeletonLoader />
          ) : financials ? (
            <>
              {/* Financial KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <LeadsKPICard
                  title="Total Spend"
                  value={financials.reduce((sum: number, f: any) => sum + f.spend, 0) || 0}
                  isCurrency={true}
                  icon="💸"
                  variant="blue"
                  subtitle="Google, Meta & custom budgets"
                />
                <LeadsKPICard
                  title="Cash Collected"
                  value={financials.reduce((sum: number, f: any) => sum + f.revenueCash, 0) || 0}
                  isCurrency={true}
                  icon="💰"
                  variant="emerald"
                  subtitle="Actual cash received so far"
                />
                <LeadsKPICard
                  title="Contract Value"
                  value={financials.reduce((sum: number, f: any) => sum + f.revenueContract, 0) || 0}
                  isCurrency={true}
                  icon="📄"
                  variant="indigo"
                  subtitle="Total contract value of courses"
                />
                <LeadsKPICard
                  title="Due Amount"
                  value={
                    (financials.reduce((sum: number, f: any) => sum + f.revenueContract, 0) || 0) -
                    (financials.reduce((sum: number, f: any) => sum + f.revenueCash, 0) || 0)
                  }
                  isCurrency={true}
                  icon="⚠️"
                  variant="amber"
                  subtitle="Pending collections from students"
                />
                <LeadsKPICard
                  title="Blended Cash ROAS"
                  value={
                    financials.reduce((sum: number, f: any) => sum + f.spend, 0) > 0
                      ? financials.reduce((sum: number, f: any) => sum + f.revenueCash, 0) /
                        financials.reduce((sum: number, f: any) => sum + f.spend, 0)
                      : 0
                  }
                  isMultiplier={true}
                  icon="🚀"
                  variant="purple"
                  subtitle="Cash collected vs spend"
                />
              </div>

              {/* Financial Performance Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">💰 Channel ROI & Financial Performance</h3>
                    <p className="text-xs text-slate-400 mt-1">ROI / ROAS performance metrics mapped per lead channel</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                        <th className="px-6 py-4">Channel</th>
                        <th className="px-6 py-4 text-center">Leads</th>
                        <th className="px-6 py-4 text-center">Enrolled</th>
                        <th className="px-6 py-4 text-right">Spend / Budget</th>
                        <th className="px-6 py-4 text-right">Cash Received</th>
                        <th className="px-6 py-4 text-right">Contract Value</th>
                        <th className="px-6 py-4 text-right text-amber-600 font-semibold">Due Amount</th>
                        <th className="px-6 py-4 text-center">Cash ROAS</th>
                        <th className="px-6 py-4 text-right">CPL</th>
                        <th className="px-6 py-4 text-right">CPA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                      {financials.map((f: any) => (
                        <tr key={f.channel} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">{f.channel}</td>
                          <td className="px-6 py-4 text-center">{f.leads}</td>
                          <td className="px-6 py-4 text-center">{f.enrolled}</td>
                          <td className="px-6 py-4 text-right font-medium">₹{f.spend.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 text-right font-medium text-emerald-600">₹{f.revenueCash.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 text-right font-medium text-indigo-600">₹{f.revenueContract.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 text-right font-semibold text-amber-600">₹{(f.revenueContract - f.revenueCash).toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 text-center font-bold">
                            {f.spend > 0 ? (
                              <span className={f.roasCash >= 2 ? 'text-emerald-600' : f.roasCash >= 1 ? 'text-amber-600' : 'text-slate-500'}>
                                {f.roasCash.toFixed(2)}x
                              </span>
                            ) : f.revenueCash > 0 ? (
                              <span className="text-emerald-600 text-xs px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                                100% Margin
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-500">₹{f.cpl.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 text-right text-slate-500">₹{f.cpa.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
              <p className="text-slate-400 text-sm">Failed to load financials</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'batch' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">Revenue</span>
                <h3 className="text-slate-400 text-xs font-semibold mt-2">Total Batch Revenue</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
                ₹{batchRevenue.reduce((sum, b) => sum + b.revenue, 0).toLocaleString()}
              </p>
            </div>
            
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">Students</span>
                <h3 className="text-slate-400 text-xs font-semibold mt-2">Total Enrollments</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
                {batchRevenue.reduce((sum, b) => sum + b.conversions, 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">Batches</span>
                <h3 className="text-slate-400 text-xs font-semibold mt-2">Total Batches</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
                {batchRevenue.length}
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Performance</span>
                <h3 className="text-slate-400 text-xs font-semibold mt-2">Average Batch Yield</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
                ₹{batchRevenue.length > 0 
                  ? Math.round(batchRevenue.reduce((sum, b) => sum + b.revenue, 0) / batchRevenue.length).toLocaleString()
                  : '0'}
              </p>
            </div>
          </div>

          {/* Simple Premium Bar Chart of Batch Revenues */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Batch-wise Revenue Performance Chart</h3>
            <div className="h-[250px] w-full flex items-end gap-2 pt-6 pb-2 px-4 border-b border-slate-100 overflow-x-auto">
              {batchRevenue.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                  No data to display in chart
                </div>
              ) : (
                batchRevenue.map((b, idx) => {
                  const maxRevenue = Math.max(...batchRevenue.map(item => item.revenue), 1)
                  const heightPercent = (b.revenue / maxRevenue) * 100
                  return (
                    <div key={b.batchNo} className="flex-1 min-w-[60px] flex flex-col items-center group relative h-full justify-end">
                      {/* Tooltip */}
                      <div className="absolute bottom-[calc(100%-8px)] mb-2 hidden group-hover:flex flex-col items-center z-10">
                        <div className="bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg shadow-xl font-medium whitespace-nowrap">
                          <p className="font-bold">{b.batchNo}</p>
                          <p className="text-slate-300">Revenue: ₹{b.revenue.toLocaleString()}</p>
                          <p className="text-slate-300">Enrolled: {b.conversions} students</p>
                        </div>
                        <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1"></div>
                      </div>
                      
                      {/* Bar */}
                      <div 
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                        className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg group-hover:from-indigo-600 group-hover:to-indigo-500 transition-all duration-300 shadow-sm"
                      />
                      
                      {/* Label */}
                      <span className="text-[10px] text-slate-400 font-bold mt-2 truncate w-full text-center">
                        {b.batchNo}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Detailed Batch-wise Revenue Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-700">Detailed Batch Performance Breakdown</h3>
                <p className="text-xs text-slate-400 mt-0.5">Aggregated student conversions, average fee ticket size, and revenue yield per batch</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Batch Name</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Faculty</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Student Conversions</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Revenue</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Avg Fee per Student</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batchRevenueLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <p className="text-slate-400 text-xs mt-2 font-medium">Aggregating batch revenue...</p>
                      </td>
                    </tr>
                  ) : batchRevenue.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400 text-xs font-medium">
                        No batch revenue data found in spreadsheet.
                      </td>
                    </tr>
                  ) : (
                    batchRevenue.map((b) => (
                      <tr key={b.batchNo} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-slate-800">{b.batchNo}</td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-medium">{b.faculty || '—'}</td>
                        <td className="px-6 py-4 text-xs text-slate-700 font-semibold text-right">{b.conversions}</td>
                        <td className="px-6 py-4 text-xs text-slate-900 font-extrabold text-right">₹{b.revenue.toLocaleString()}</td>
                        <td className="px-6 py-4 text-xs text-slate-700 font-semibold text-right">₹{b.avgFee.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
