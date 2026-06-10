// app/ads/intelligence/retargeting/page.tsx
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useDateRange } from '@/hooks/useDateRange'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import { 
  Flame, AlertCircle, ShieldCheck, Info, Sparkles, 
  CheckCircle, AlertTriangle, Users, DollarSign, Target, ChevronRight,
  Search, Filter, Play, Award
} from 'lucide-react'

interface SegmentData {
  audience: string
  spend: number
  leads: number
  enrolled: number
}

interface CampaignData {
  id: string
  name: string
  platform: 'meta' | 'google'
  status: 'ACTIVE' | 'PAUSED'
  spend: number
  adConversions: number
  crmLeads: number
  crmEnrolled: number
  segment: 'Cold' | 'Warm' | 'Hot'
}

interface RetargetingPayload {
  retargetingSplit: SegmentData[]
  campaigns: CampaignData[]
  isReal: boolean
}

export default function RetargetingPage() {
  const { preset, from, to, label, setDateRange } = useDateRange()
  const [data, setData] = useState<RetargetingPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTransparency, setShowTransparency] = useState(false)

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [platformFilter, setPlatformFilter] = useState<'all' | 'meta' | 'google'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'PAUSED'>('all')
  const [activeSegmentTab, setActiveSegmentTab] = useState<'Cold' | 'Warm' | 'Hot'>('Cold')

  const fetchData = useCallback(async (bypassCache = false) => {
    try {
      if (bypassCache) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const query = new URLSearchParams({ preset })
      if (preset === 'custom' && from && to) {
        query.set('from', from)
        query.set('to', to)
      }
      if (bypassCache) {
        query.set('refresh', 'true')
      }

      const res = await fetch(`/api/ads/intelligence/retargeting?${query.toString()}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to fetch retargeting data')
      }

      const resData = await res.json()
      setData(resData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while fetching retargeting data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [preset, from, to])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    fetchData(true)
  }

  // Derive metrics
  const stats = useMemo(() => {
    if (!data?.retargetingSplit) return null

    let totalSpend = 0
    let totalLeads = 0
    let totalEnrolled = 0
    let hotSpend = 0
    let coldSpend = 0

    data.retargetingSplit.forEach(item => {
      totalSpend += item.spend
      totalLeads += item.leads
      totalEnrolled += item.enrolled

      if (item.audience.includes('Hot')) {
        hotSpend = item.spend
      } else if (item.audience.includes('Cold')) {
        coldSpend = item.spend
      }
    })

    const hotShare = totalSpend > 0 ? (hotSpend / totalSpend) * 100 : 0
    const coldShare = totalSpend > 0 ? (coldSpend / totalSpend) * 100 : 0

    return {
      totalSpend,
      totalLeads,
      totalEnrolled,
      hotSpend,
      coldSpend,
      hotShare,
      coldShare
    }
  }, [data])

  // Filter campaigns list
  const filteredCampaigns = useMemo(() => {
    if (!data?.campaigns) return []
    return data.campaigns.filter(c => {
      const matchSegment = c.segment === activeSegmentTab
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchPlatform = platformFilter === 'all' || c.platform === platformFilter
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      return matchSegment && matchSearch && matchPlatform && matchStatus
    })
  }, [data, activeSegmentTab, searchQuery, platformFilter, statusFilter])

  // Get diagnostic recommendation
  const getRecommendation = () => {
    if (!stats) return null

    if (stats.hotSpend === 0) {
      return {
        status: 'critical',
        title: 'Retargeting Ads Are Inactive',
        description: 'Warning: 0% of your media budget is allocated to retargeting. This means high-intent website visitors, webinar drop-outs, and form initiates are not being re-engaged. Set up custom audience campaigns targeting pixel events and custom email lists immediately to recover lost funnel leads.',
        action: 'Launch Custom Audience RT Campaign'
      }
    }

    if (stats.hotShare < 12) {
      return {
        status: 'warning',
        title: 'Low Remarketing Budget Share',
        description: `Your remarketing spend is only ${stats.hotShare.toFixed(1)}% of total spends. It is standard industry practice to allocate 15%–25% of media budgets to warm hooks. Consider scaling budget on custom audiences to reduce your overall CPA.`,
        action: 'Increase retargeting bids'
      }
    }

    return {
      status: 'healthy',
      title: 'Funnel Allocations On Track',
      description: 'Prospecting and retargeting segments are balanced within healthy ranges. Monitor ad frequency levels on your retargeting campaigns (keep frequency below 3.5 per week to avoid audience fatigue).',
      action: 'Monitor Ad Frequency'
    }
  }

  const recommendation = getRecommendation()

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-100px] left-[-200px] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Header Bar */}
      <div className="relative z-30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Retargeting & Audience Splits
              <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                Funnel Temperature
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Audit budget share, lead counts, and close rates across cold prospecting, lookalike, and custom remarketing campaigns
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker dark />
          <RefreshBar
            loading={loading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            dark
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-300 text-xs font-semibold max-w-2xl relative z-10">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Error loading Retargeting data</p>
            <p className="text-rose-300/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-6 animate-pulse relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-900/60 border border-slate-800/80 rounded-2xl" />
            ))}
          </div>
          <div className="h-[300px] bg-slate-900/60 border border-slate-800/80 rounded-2xl" />
        </div>
      ) : data && stats ? (
        <div className="relative z-10 space-y-8">
          
          {/* Authenticity notice banner */}
          <div className={`flex items-start gap-3.5 p-4 rounded-2xl border text-xs leading-relaxed max-w-4xl ${
            data.isReal 
              ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300/90' 
              : 'bg-amber-950/20 border-amber-500/25 text-amber-300/90'
          }`}>
            {data.isReal ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div>
              <p className="font-extrabold uppercase tracking-wide text-[10px]">
                {data.isReal ? 'API Campaign Classification Live' : 'Viewing Sandbox Demo Mode'}
              </p>
              <p className="mt-1 font-semibold">
                {data.isReal 
                  ? 'All segments, budgets, and lead figures are resolved directly from your live Meta and Google Ads active campaigns linked to TeleCRM. Campaigns are parsed based on structured name patterns.' 
                  : 'No active Google Ads or Meta Ads credentials were found in Supabase. Showing simulated demographics and retargeting splits. Connect keys in Settings to audit live spend.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Prospecting (Cold) Share</p>
              <p className="text-xl font-black text-white mt-1">{stats.coldShare.toFixed(1)}%</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">₹{Math.round(stats.coldSpend).toLocaleString()} spent on acquisition</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Retargeting (Hot) Share</p>
              <p className={`text-xl font-black mt-1 ${stats.hotSpend === 0 ? 'text-rose-400' : 'text-white'}`}>
                {stats.hotShare.toFixed(1)}%
              </p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">₹{Math.round(stats.hotSpend).toLocaleString()} spent on remarketing</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Attributed CRM Leads</p>
              <p className="text-xl font-black text-indigo-300 mt-1">{stats.totalLeads.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Unique leads mapped to campaigns</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Attributed Enrollments</p>
              <p className="text-xl font-black text-emerald-400 mt-1">{stats.totalEnrolled.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Paid students enrolled in CRM</p>
            </div>
          </div>

          {/* Main Grid: Split Table (2/3) and Recommendation (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Table Card */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-white">Audience Temperature Split Summary</h3>
                <p className="text-xs text-slate-400 mt-1">Comparing acquisition costs and conversion efficiencies across funnel segments</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/30 text-slate-450 text-[10px] uppercase font-black tracking-wider border-b border-slate-850">
                      <th className="py-3 px-4">Audience Segment</th>
                      <th className="py-3 px-4 text-right">Spend</th>
                      <th className="py-3 px-4 text-right">CRM Leads</th>
                      <th className="py-3 px-4 text-right">CPL</th>
                      <th className="py-3 px-4 text-right text-emerald-400">Enrolled</th>
                      <th className="py-3 px-4 text-right">CPE</th>
                      <th className="py-3 px-4 text-right">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs font-bold text-slate-300">
                    {data.retargetingSplit.map((item: any) => {
                      const cpl = item.leads > 0 ? item.spend / item.leads : 0
                      const cpe = item.enrolled > 0 ? item.spend / item.enrolled : 0
                      const conv = item.leads > 0 ? (item.enrolled / item.leads) * 100 : 0
                      const isHotEmpty = item.audience.includes('Hot') && item.spend === 0

                      return (
                        <tr 
                          key={item.audience} 
                          className={`hover:bg-slate-900/20 transition-colors ${
                            isHotEmpty ? 'bg-rose-950/5 text-rose-350/80' : ''
                          }`}
                        >
                          <td className="py-4 px-4 font-black text-white">
                            {item.audience.split('(')[0].trim()}
                            <span className="text-[10px] text-slate-500 font-medium ml-1.5 hidden sm:inline">
                              ({item.audience.split('(')[1]}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right text-slate-350 font-bold">
                            {item.spend > 0 ? `₹${Math.round(item.spend).toLocaleString()}` : '₹0'}
                          </td>
                          <td className="py-4 px-4 text-right text-slate-200">{item.leads.toLocaleString()}</td>
                          <td className="py-4 px-4 text-right text-indigo-300">
                            {cpl > 0 ? `₹${Math.round(cpl).toLocaleString()}` : '₹0'}
                          </td>
                          <td className="py-4 px-4 text-right text-emerald-450 font-black">{item.enrolled}</td>
                          <td className="py-4 px-4 text-right text-emerald-300 font-bold">
                            {cpe > 0 ? `₹${Math.round(cpe).toLocaleString()}` : '—'}
                          </td>
                          <td className="py-4 px-4 text-right text-white font-black">{conv.toFixed(1)}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommendation Panel */}
            {recommendation && (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Funnel Diagnosis</h3>
                  </div>

                  <div className={`p-4 rounded-2xl border text-xs space-y-3 bg-slate-950/40 ${
                    recommendation.status === 'critical' 
                      ? 'border-rose-500/20' 
                      : recommendation.status === 'warning'
                      ? 'border-amber-500/20'
                      : 'border-emerald-500/20'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider ${
                        recommendation.status === 'critical'
                          ? 'bg-rose-500/15 text-rose-400'
                          : recommendation.status === 'warning'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-emerald-500/15 text-emerald-400'
                      }`}>
                        {recommendation.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-extrabold text-white text-sm">{recommendation.title}</h4>
                      <p className="text-slate-400 leading-relaxed text-[11px]">{recommendation.description}</p>
                    </div>
                  </div>
                </div>

                {recommendation.status !== 'healthy' && (
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900 flex flex-col gap-3">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Recommended Action</p>
                    <div className="flex items-center justify-between gap-4 text-xs">
                      <span className="font-extrabold text-white">{recommendation.action}</span>
                      <ChevronRight className="w-4 h-4 text-violet-400 shrink-0" />
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Campaign Explorer Tree */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">Campaign Audience Tree Explorer</h3>
                <p className="text-xs text-slate-400 mt-1">Select a temperature segment to review the exact Google and Meta campaigns classified under it</p>
              </div>

              {/* Segment selection buttons */}
              <div className="flex bg-slate-950/60 p-0.5 rounded-xl border border-slate-800">
                {(['Cold', 'Warm', 'Hot'] as const).map(seg => {
                  const count = data.campaigns.filter(c => c.segment === seg).length
                  return (
                    <button
                      key={seg}
                      onClick={() => setActiveSegmentTab(seg)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeSegmentTab === seg ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {seg}
                      <span className="text-[9px] px-1.5 py-0.1 bg-black/30 rounded-full font-mono text-slate-300">
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Filters bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/30 p-4 rounded-2xl border border-slate-850">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input 
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-200"
                />
              </div>

              <div>
                <select 
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-350"
                >
                  <option value="all">All Channels (Meta & Google)</option>
                  <option value="meta">Meta Ads Only</option>
                  <option value="google">Google Ads Only</option>
                </select>
              </div>

              <div>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-350"
                >
                  <option value="all">All Statuses (Active & Paused)</option>
                  <option value="ACTIVE">Active/Enabled Only</option>
                  <option value="PAUSED">Paused/Inactive Only</option>
                </select>
              </div>
            </div>

            {/* Campaigns list table */}
            <div className="overflow-x-auto">
              {filteredCampaigns.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-semibold">
                  No campaigns found matching search criteria under the {activeSegmentTab} segment.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/20 text-slate-450 text-[10px] uppercase font-black tracking-wider border-b border-slate-850">
                      <th className="py-2.5 px-4">Campaign Name</th>
                      <th className="py-2.5 px-4">Platform</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Spend</th>
                      <th className="py-2.5 px-4 text-right">Platform Convs</th>
                      <th className="py-2.5 px-4 text-right text-indigo-350">CRM Leads</th>
                      <th className="py-2.5 px-4 text-right text-emerald-400">Enrolled</th>
                      <th className="py-2.5 px-4 text-right">CPL</th>
                      <th className="py-2.5 px-4 text-right">CPE</th>
                      <th className="py-2.5 px-4 text-right">Close Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs font-bold text-slate-300">
                    {filteredCampaigns.map((c) => {
                      const cpl = c.crmLeads > 0 ? c.spend / c.crmLeads : 0
                      const cpe = c.crmEnrolled > 0 ? c.spend / c.crmEnrolled : 0
                      const conv = c.crmLeads > 0 ? (c.crmEnrolled / c.crmLeads) * 100 : 0

                      return (
                        <tr key={c.id} className="hover:bg-slate-900/10 transition-colors">
                          <td className="py-3.5 px-4 font-black">
                            <span className="text-white block truncate max-w-xs md:max-w-md" title={c.name}>{c.name}</span>
                            <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">ID: {c.id}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                              c.platform === 'meta' 
                                ? 'bg-indigo-950/30 text-indigo-400 border-indigo-500/20' 
                                : 'bg-cyan-950/30 text-cyan-400 border-cyan-500/20'
                            }`}>
                              {c.platform}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              c.status === 'ACTIVE'
                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-950 text-slate-450 border border-slate-800'
                            }`}>
                              {c.status === 'ACTIVE' && <span className="w-1 h-1 rounded-full bg-emerald-450 animate-pulse" />}
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-350">
                            {c.spend > 0 ? `₹${c.spend.toLocaleString()}` : '₹0'}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-400">{c.adConversions}</td>
                          <td className="py-3.5 px-4 text-right text-indigo-350 font-black">{c.crmLeads}</td>
                          <td className="py-3.5 px-4 text-right text-emerald-450 font-black">{c.crmEnrolled}</td>
                          <td className="py-3.5 px-4 text-right text-indigo-250 font-semibold">
                            {cpl > 0 ? `₹${Math.round(cpl).toLocaleString()}` : '₹0'}
                          </td>
                          <td className="py-3.5 px-4 text-right text-emerald-350 font-semibold">
                            {cpe > 0 ? `₹${Math.round(cpe).toLocaleString()}` : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right text-white font-black">{conv.toFixed(1)}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Sourcing Transparency card */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-extrabold text-white">Data Sourcing & Temperature splits</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Learn how active spends are segmented into cold, warm, and hot categories</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTransparency(!showTransparency)}
                className="px-4 py-2 bg-slate-950/60 hover:bg-slate-950 text-slate-300 rounded-xl border border-slate-800 text-xs font-bold transition-all shrink-0 self-start sm:self-auto"
              >
                {showTransparency ? 'Hide Details' : 'View Audit Blueprint'}
              </button>
            </div>

            {showTransparency && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-800/80 text-xs leading-relaxed text-slate-400">
                <div className="space-y-4">
                  <h5 className="font-black text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Campaign Name Classification (100% Real)
                  </h5>
                  <p className="text-slate-400">
                    Campaigns are classified automatically based on their structural names returned by Meta Graph and Google Ads API endpoints using regular expressions:
                  </p>
                  <ul className="space-y-2.5 pl-4 list-disc list-outside">
                    <li>
                      <strong className="text-slate-200">Hot (Remarketing):</strong> Campaign names containing <code className="text-indigo-400 font-mono">retargeting</code>, <code className="text-indigo-400 font-mono">remarketing</code>, <code className="text-indigo-400 font-mono">re-engage</code>, <code className="text-indigo-400 font-mono">reengage</code>, <code className="text-indigo-400 font-mono">warm</code>, <code className="text-indigo-400 font-mono">hot</code>, <code className="text-indigo-400 font-mono">pixel</code>, or custom audiences. Also matches isolated codes like <code className="text-indigo-400 font-mono">\brt\b</code> or <code className="text-indigo-400 font-mono">\brm\b</code>.
                    </li>
                    <li>
                      <strong className="text-slate-200">Warm (Lookalike):</strong> Campaign names containing <code className="text-indigo-400 font-mono">lookalike</code>, <code className="text-indigo-400 font-mono">lal</code>, <code className="text-indigo-400 font-mono">lla</code>, or <code className="text-indigo-400 font-mono">similar</code>.
                    </li>
                    <li>
                      <strong className="text-slate-200">Cold (Prospecting):</strong> Default category for brand-new interest, geographic, or keyword targeting campaigns.
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h5 className="font-black text-indigo-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    TeleCRM CRM Lead Joining (100% Real)
                  </h5>
                  <ul className="space-y-2.5 pl-4 list-disc list-outside">
                    <li>
                      <strong className="text-slate-200">Campaign Mapping:</strong> Leads are attributed to their corresponding Google/Meta campaign via URL tracking matching. If a campaign name is resolved, the lead inherits that campaign's temperature segment.
                    </li>
                    <li>
                      <strong className="text-slate-200">UTM parameter scan:</strong> If the campaign is not found in the active campaigns list, the parser directly checks the lead's raw UTM Campaign parameters in TeleCRM to assign the correct funnel segment.
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

        </div>
      ) : null}
    </div>
  )
}
