// app/leads/trends/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import LeadsTrendChart from '@/components/leads/LeadsTrendChart'
import LeadsHeatmapTable from '@/components/leads/LeadsHeatmapTable'
import LeadsMonthComparison from '@/components/leads/LeadsMonthComparison'
import LeadsMonthSelector from '@/components/leads/LeadsMonthSelector'
import LeadsQuarterlySummary from '@/components/leads/LeadsQuarterlySummary'
import LiveDataBadge from '@/components/leads/LiveDataBadge'
import RefreshBar from '@/components/leads/RefreshBar'
import DateRangePicker from '@/components/ads/DateRangePicker'
import { useDateRange } from '@/hooks/useDateRange'
import { Info } from 'lucide-react'

export default function LeadsTrendsPage() {
  const { preset, from, to, label: rangeLabel } = useDateRange()

  const [trend, setTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [monthA, setMonthA] = useState('')
  const [monthB, setMonthB] = useState('')

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
      const urlTrend = `/api/leads/trend?months=12${refreshParam}`

      const resTrend = await fetch(urlTrend, { headers })

      if (!resTrend.ok) {
        const errorData = await resTrend.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch monthly trend (Status: ${resTrend.status})`)
      }

      const payloadTrend = await resTrend.json()
      setTrend(payloadTrend)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Error loading trend details')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

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

  // Get available months list from the trend
  const availableMonths = useMemo(() => {
    return trend.map(t => t.month)
  }, [trend])

  // Set default comparison months when data loaded
  useEffect(() => {
    if (availableMonths.length > 0) {
      if (!monthA) setMonthA(availableMonths[availableMonths.length - 1])
      if (!monthB) {
        setMonthB(availableMonths.length >= 2 ? availableMonths[availableMonths.length - 2] : availableMonths[0])
      }
    }
  }, [availableMonths, monthA, monthB])

  const currentMonthA = monthA || (availableMonths.length > 0 ? availableMonths[availableMonths.length - 1] : '')
  const currentMonthB = monthB || (availableMonths.length >= 2 ? availableMonths[availableMonths.length - 2] : '')

  // SECTION: Trend KPI Calculations
  const bestMonthRow = useMemo(() => {
    if (trend.length === 0) return null
    return [...trend].sort((x, y) => y.totalLeads - x.totalLeads)[0]
  }, [trend])

  const avgMonthlyLeads = useMemo(() => {
    if (trend.length === 0) return 0
    return trend.reduce((sum, r) => sum + r.totalLeads, 0) / trend.length
  }, [trend])

  const totalLeadsYTD = useMemo(() => {
    return trend.reduce((sum, r) => sum + r.totalLeads, 0)
  }, [trend])

  const totalEnrolledYTD = useMemo(() => {
    return trend.reduce((sum, r) => sum + r.enrolled, 0)
  }, [trend])

  const ytdConvRate = useMemo(() => {
    return totalLeadsYTD > 0 ? (totalEnrolledYTD / totalLeadsYTD) * 100 : 0
  }, [totalLeadsYTD, totalEnrolledYTD])

  // Map trend to list of detailRows for LeadsHeatmapTable
  const detailRows = useMemo(() => {
    const rows: any[] = []
    trend.forEach(t => {
      if (t.courses) {
        Object.entries(t.courses).forEach(([courseName, total]) => {
          rows.push({
            month: t.month,
            courseName,
            total: total as number,
            enrolled: 0,
            highPotential: 0,
            mediumPotential: 0,
            freshUnqualified: 0,
            lowCold: 0,
            organic: 0,
            website: 0
          })
        })
      }
    })
    return rows
  }, [trend])

  if (loading) {
    return <SkeletonLoader />
  }

  if (error || trend.length === 0) {
    return (
      <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-red-100 shadow-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-6 shadow-sm">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Connection Failed</h2>
          <p className="text-slate-400 text-sm mt-3">
            {error || 'Unable to retrieve historical trend insights from TeleCRM.'}
          </p>
          <button onClick={() => fetchData()} className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all w-full">
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 lg:space-y-8 min-h-screen bg-slate-50">
      {/* Header Panel */}
      <Header
        title="📅 Monthly Lead Trends"
        currentMonth={currentMonthA}
        previousMonth={currentMonthB}
        onRefresh={() => fetchData(true)}
        isRefreshing={refreshing}
      />

      {/* Selector Row */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <LiveDataBadge />
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 border border-slate-100 rounded-xl px-4 py-2">
            Comparing {currentMonthA} vs {currentMonthB}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RefreshBar
            loading={loading}
            refreshing={refreshing}
            lastUpdated={new Date().toISOString()}
            onRefresh={() => fetchData(true)}
          />
          <LeadsMonthSelector
            months={availableMonths}
            selected={currentMonthA}
            onChange={setMonthA}
            selectedCompare={currentMonthB}
            onChangeCompare={setMonthB}
            label="Month A"
          />
        </div>
      </div>

      {/* SECTION A: Trend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🏆 Best Performing Month</h4>
          <div>
            <p className="text-xl font-extrabold text-slate-800 mt-2">{bestMonthRow ? bestMonthRow.month : 'N/A'}</p>
            <p className="text-xs text-slate-500 mt-0.5">{bestMonthRow ? bestMonthRow.totalLeads : 0} leads acquired</p>
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
        <LeadsTrendChart rows={trend} />
      </div>

      {/* SECTION C: Heatmap Density */}
      {detailRows.length > 0 && availableMonths.length >= 2 ? (
        <div className="grid grid-cols-1 gap-6">
          <LeadsHeatmapTable detailRows={detailRows} />
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p className="text-slate-400 text-sm">Add multiple months of leads data to view the course heatmap.</p>
        </div>
      )}

      {/* SECTION D: Month Comparison Table */}
      {currentMonthA && currentMonthB && (
        <div className="grid grid-cols-1 gap-6">
          <LeadsMonthComparison rows={trend} monthA={currentMonthA} monthB={currentMonthB} />
        </div>
      )}

      {/* SECTION E: Quarterly aggregates */}
      <div className="grid grid-cols-1 gap-6">
        <LeadsQuarterlySummary rows={trend} />
      </div>
    </div>
  )
}
