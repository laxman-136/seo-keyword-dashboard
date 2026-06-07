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
      const urlMain = `/api/leads?from=${from}&to=${to}${refreshParam}`
      const urlCourses = `/api/leads/courses?from=${from}&to=${to}${refreshParam}`
      const urlTrend = `/api/leads/trend?months=6${refreshParam}`

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
  }, [from, to])

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
    website: c.websiteLeads
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
          <RefreshBar
            loading={loading}
            refreshing={refreshing}
            lastUpdated={data?.kpi?.lastRefreshedAt || new Date().toISOString()}
            onRefresh={() => fetchData(true)}
          />
          <DateRangePicker />
        </div>
      </div>

      {/* ── SECTION A: KPI GRID ── */}
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
            prevValue={kpi.prevWebsiteLeads}
            icon="🌐"
            variant="indigo"
            subtitle="From website & paid ads"
          />
          <LeadsKPICard
            title="Organic Leads"
            value={kpi.organicLeads}
            prevValue={kpi.prevOrganicLeads}
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
    </div>
  )
}
