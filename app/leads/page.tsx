// app/leads/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react'
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

  // --- SESSION & ACCESS CONTROL STATE ---
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [viewerGrants, setViewerGrants] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async res => {
        if (!res.ok) return
        const data = await res.json()
        setCurrentUser(data.user || null)
        setViewerGrants(data.viewerAccess || [])
      })
      .catch((err) => console.error('Failed to fetch user:', err))
  }, [])

  const hasOverviewAccess = React.useMemo(() => {
    if (!currentUser) return false
    const role = currentUser.role
    if (role === 'superadmin' || role === 'admin' || role === 'ceo') return true
    if (role === 'user') return false
    if (role === 'viewer') {
      const activeGrant = viewerGrants[0]
      if (activeGrant && activeGrant.label) {
        const label = activeGrant.label
        if (label.includes('| allowed:')) {
          const parts = label.split('| allowed:')
          const allowedStr = parts[1] || ''
          const allowedSections = allowedStr.split(',').map((s: string) => s.trim())
          return allowedSections.includes('leads')
        }
      }
      return true
    }
    return false
  }, [currentUser, viewerGrants])

  const hasRoiAccess = React.useMemo(() => {
    if (!currentUser) return false
    const role = currentUser.role
    if (role === 'superadmin' || role === 'admin' || role === 'ceo') return true
    if (role === 'user') return false
    if (role === 'viewer') {
      const activeGrant = viewerGrants[0]
      if (activeGrant && activeGrant.label) {
        const label = activeGrant.label
        if (label.includes('| allowed:')) {
          const parts = label.split('| allowed:')
          const allowedStr = parts[1] || ''
          const allowedSections = allowedStr.split(',').map((s: string) => s.trim())
          return allowedSections.includes('roi')
        }
      }
      return true
    }
    return false
  }, [currentUser, viewerGrants])

  const hasBatchAccess = React.useMemo(() => {
    if (!currentUser) return false
    const role = currentUser.role
    if (role === 'superadmin' || role === 'admin' || role === 'ceo') return true
    if (role === 'user') return false
    if (role === 'viewer') {
      const activeGrant = viewerGrants[0]
      if (activeGrant && activeGrant.label) {
        const label = activeGrant.label
        if (label.includes('| allowed:')) {
          const parts = label.split('| allowed:')
          const allowedStr = parts[1] || ''
          const allowedSections = allowedStr.split(',').map((s: string) => s.trim())
          return allowedSections.includes('batch')
        }
      }
      return true
    }
    return false
  }, [currentUser, viewerGrants])

  // --- ROI & FINANCIALS STATE & EFFECTS ---
  const [activeTab, setActiveTab] = useState<'overview' | 'roi' | 'batch'>('overview')

  useEffect(() => {
    if (currentUser) {
      if (activeTab === 'overview' && !hasOverviewAccess) {
        if (hasRoiAccess) {
          setActiveTab('roi')
        } else if (hasBatchAccess) {
          setActiveTab('batch')
        }
      } else if (activeTab === 'roi' && !hasRoiAccess) {
        if (hasOverviewAccess) {
          setActiveTab('overview')
        } else if (hasBatchAccess) {
          setActiveTab('batch')
        }
      } else if (activeTab === 'batch' && !hasBatchAccess) {
        if (hasOverviewAccess) {
          setActiveTab('overview')
        } else if (hasRoiAccess) {
          setActiveTab('roi')
        }
      }
    }
  }, [currentUser, hasOverviewAccess, hasRoiAccess, hasBatchAccess, activeTab])
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
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [batchSearch, setBatchSearch] = useState('')

  const filteredBatches = useMemo(() => {
    if (!batchSearch.trim()) return batchRevenue
    const lower = batchSearch.toLowerCase()
    return batchRevenue.filter(b => 
      b.courseName.toLowerCase().includes(lower) || 
      b.batchNo.toLowerCase().includes(lower)
    )
  }, [batchRevenue, batchSearch])

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

  const fetchBatchRevenue = useCallback(async (isRefresh = false, yearVal = selectedYear, courseVal = selectedCourse) => {
    setBatchRevenueLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (typeof window !== 'undefined') {
        const clientToken = localStorage.getItem('client-telecrm-api-token')
        const clientEnterpriseId = localStorage.getItem('client-telecrm-enterprise-id')
        if (clientToken) headers['x-telecrm-api-token'] = clientToken
        if (clientEnterpriseId) headers['x-telecrm-enterprise-id'] = clientEnterpriseId
      }
      const refreshParam = isRefresh ? '&refresh=true' : ''
      const res = await fetch(`/api/leads/batch-revenue?year=${yearVal}&course=${encodeURIComponent(courseVal)}${refreshParam}`, { headers })
      if (!res.ok) {
        throw new Error('Failed to fetch batch revenue')
      }
      const payload = await res.json()
      setBatchRevenue(payload.batches || [])
    } catch (err) {
      console.error('Error fetching batch revenue:', err)
    } finally {
      setBatchRevenueLoading(false)
    }
  }, [selectedYear, selectedCourse])

  useEffect(() => {
    if (activeTab === 'batch') {
      fetchBatchRevenue(false, selectedYear, selectedCourse)
    }
  }, [activeTab, selectedYear, selectedCourse, fetchBatchRevenue])

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
            <>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500">Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold outline-none"
                >
                  <option value="all">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>
              <CourseSelector selectedCourse={selectedCourse} onChange={setSelectedCourse} />
              <RefreshBar
                loading={batchRevenueLoading}
                refreshing={batchRevenueLoading}
                lastUpdated={new Date().toISOString()}
                onRefresh={() => fetchBatchRevenue(true)}
              />
            </>
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
        {hasOverviewAccess && (
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
        )}
        {hasRoiAccess && (
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
        )}
        {hasBatchAccess && (
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
        )}
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
                  const cleanCourseShortName = b.courseName.replace('Oracle Fusion ', '')
                  return (
                    <div key={`${b.courseName}-${b.batchNo}`} className="flex-1 min-w-[90px] flex flex-col items-center group relative h-full justify-end">
                      {/* Tooltip */}
                      <div className="absolute bottom-[calc(100%-8px)] mb-2 hidden group-hover:flex flex-col items-center z-10">
                        <div className="bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg shadow-xl font-medium whitespace-nowrap">
                          <p className="font-bold text-indigo-400">{b.courseName}</p>
                          <p className="font-semibold text-slate-200">{b.batchNo}</p>
                          <p className="text-slate-300 mt-1">Revenue: ₹{b.revenue.toLocaleString()}</p>
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
                      <span className="text-[9px] text-slate-500 font-bold mt-2 truncate w-full text-center" title={`${cleanCourseShortName} - ${b.batchNo}`}>
                        {cleanCourseShortName}
                      </span>
                      <span className="text-[8px] text-slate-400 font-semibold truncate w-full text-center">
                        {b.batchNo}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Detailed Course Batch Cards */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-700">Detailed Batch Performance Breakdown</h3>
                <p className="text-xs text-slate-400 mt-0.5">Aggregated student conversions, average fee ticket size, and revenue yield per course batch</p>
              </div>
              <div className="relative min-w-[240px]">
                <input
                  type="text"
                  placeholder="Search course or batch..."
                  value={batchSearch}
                  onChange={(e) => setBatchSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                />
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
              </div>
            </div>

            {batchRevenueLoading ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-slate-400 text-xs mt-2 font-medium">Aggregating batch revenue...</p>
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
                <p className="text-slate-400 text-xs font-medium">
                  {batchSearch ? 'No matching batch or course found.' : 'No batch revenue data found in TeleCRM.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredBatches.map((b) => {
                  const isSCM = b.courseName.includes('SCM') || b.courseName.includes('TMS');
                  const isHCM = b.courseName.includes('HCM');
                  const isFinancial = b.courseName.includes('Financials') || b.courseName.includes('PPM') || b.courseName.includes('EBS');
                  const isTechnical = b.courseName.includes('Technical') || b.courseName.includes('Apex') || b.courseName.includes('Integration');
                  
                  let cardAccentStyle = 'border-slate-200 focus-within:ring-slate-500';
                  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                  let textAccentStyle = 'text-slate-700';
                  let iconEmoji = '📦';

                  if (isSCM) {
                    cardAccentStyle = 'border-indigo-100 hover:border-indigo-200 hover:shadow-indigo-50/50';
                    badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-100';
                    textAccentStyle = 'text-indigo-600';
                    iconEmoji = '🚛';
                  } else if (isHCM) {
                    cardAccentStyle = 'border-emerald-100 hover:border-emerald-200 hover:shadow-emerald-50/50';
                    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                    textAccentStyle = 'text-emerald-600';
                    iconEmoji = '👥';
                  } else if (isFinancial) {
                    cardAccentStyle = 'border-amber-100 hover:border-amber-200 hover:shadow-amber-50/50';
                    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-100';
                    textAccentStyle = 'text-amber-600';
                    iconEmoji = '💰';
                  } else if (isTechnical) {
                    cardAccentStyle = 'border-blue-100 hover:border-blue-200 hover:shadow-blue-50/50';
                    badgeStyle = 'bg-blue-50 text-blue-700 border-blue-100';
                    textAccentStyle = 'text-blue-600';
                    iconEmoji = '💻';
                  }

                  return (
                    <div 
                      key={`${b.courseName}-${b.batchNo}`} 
                      className={`bg-white border p-5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[200px] ${cardAccentStyle}`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-[9px] font-extrabold tracking-wide uppercase px-2.5 py-1 rounded-full border ${badgeStyle}`}>
                            {b.courseName.replace('Oracle Fusion ', '')}
                          </span>
                          <span className="text-sm">{iconEmoji}</span>
                        </div>
                        <h4 className="text-base font-extrabold text-slate-800 tracking-tight mt-4">
                          {b.batchNo}
                        </h4>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Enrollments</p>
                          <p className="text-sm font-extrabold text-slate-700 mt-0.5">{b.conversions} Students</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Avg Fee</p>
                          <p className="text-sm font-extrabold text-slate-700 mt-0.5">₹{b.avgFee.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="mt-4 bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Revenue</span>
                        <span className={`text-base font-black ${textAccentStyle}`}>
                          ₹{b.revenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
