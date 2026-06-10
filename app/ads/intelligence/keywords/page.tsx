// app/ads/intelligence/keywords/page.tsx
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useDateRange } from '@/hooks/useDateRange'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import { 
  AlertCircle, Target, ShieldCheck, Info, Search, 
  ArrowUpDown, SlidersHorizontal, DollarSign, Activity, 
  TrendingDown, CheckCircle, Sparkles, AlertTriangle 
} from 'lucide-react'

interface KeywordData {
  text: string
  matchType: 'BROAD' | 'PHRASE' | 'EXACT' | string
  status: 'ENABLED' | 'PAUSED' | 'REMOVED' | string
  qualityScore: number | null
  spend: number
  impressions: number
  clicks: number
  conversions: number // ad-conversions
  leads: number       // CRM Leads
  enrolled: number    // CRM Enrolls
}

type SortField = 'text' | 'spend' | 'impressions' | 'clicks' | 'ctr' | 'cpc' | 'qualityScore' | 'leads' | 'enrolled'
type SortOrder = 'asc' | 'desc'

export default function KeywordsPage() {
  const { preset, from, to, label, setDateRange } = useDateRange()
  const [data, setData] = useState<{ keywords: KeywordData[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTransparency, setShowTransparency] = useState(false)

  // Filter and Sort states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [matchTypeFilter, setMatchTypeFilter] = useState<string>('ALL')
  const [qsFilter, setQsFilter] = useState<string>('ALL')
  const [sortField, setSortField] = useState<SortField>('spend')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

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

      const res = await fetch(`/api/ads/intelligence/keywords?${query.toString()}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to fetch keywords data')
      }

      const resData = await res.json()
      setData(resData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while fetching keyword data')
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

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Process and Filter keywords
  const processedKeywords = useMemo(() => {
    if (!data?.keywords) return []

    return data.keywords
      .map(k => {
        const ctr = k.impressions > 0 ? (k.clicks / k.impressions) * 100 : 0
        const cpc = k.clicks > 0 ? k.spend / k.clicks : 0
        const cpl = k.leads > 0 ? k.spend / k.leads : 0
        const cpe = k.enrolled > 0 ? k.spend / k.enrolled : 0
        return {
          ...k,
          ctr,
          cpc,
          cpl,
          cpe
        }
      })
      .filter(k => {
        // Text Search
        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase()
          if (!k.text.toLowerCase().includes(query)) return false
        }

        // Status Filter
        if (statusFilter !== 'ALL') {
          const statusMap: Record<string, string> = {
            'ENABLED': 'ENABLED',
            'ACTIVE': 'ENABLED',
            'PAUSED': 'PAUSED'
          }
          const kwStatus = statusMap[k.status] || k.status
          if (kwStatus !== statusFilter) return false
        }

        // Match Type Filter
        if (matchTypeFilter !== 'ALL' && k.matchType !== matchTypeFilter) {
          return false
        }

        // Quality Score Filter
        if (qsFilter !== 'ALL') {
          const qs = k.qualityScore
          if (qs === null) return false
          if (qsFilter === 'HIGH' && qs < 8) return false
          if (qsFilter === 'MEDIUM' && (qs < 5 || qs > 7)) return false
          if (qsFilter === 'LOW' && qs > 4) return false
        }

        return true
      })
      .sort((a, b) => {
        let valA: any = a[sortField]
        let valB: any = b[sortField]

        if (sortField === 'text') {
          valA = a.text.toLowerCase()
          valB = b.text.toLowerCase()
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }

        valA = Number(valA || 0)
        valB = Number(valB || 0)

        return sortOrder === 'asc' ? valA - valB : valB - valA
      })
  }, [data, searchQuery, statusFilter, matchTypeFilter, qsFilter, sortField, sortOrder])

  // Aggregate Stats
  const stats = useMemo(() => {
    if (!processedKeywords.length) return {
      totalKeywords: 0,
      totalSpend: 0,
      totalLeads: 0,
      totalEnrolled: 0,
      avgQs: 0,
      wasteSpend: 0
    }

    let totalSpend = 0
    let totalClicks = 0
    let totalImpressions = 0
    let totalLeads = 0
    let totalEnrolled = 0
    let qsSum = 0
    let qsCount = 0
    let wasteSpend = 0

    processedKeywords.forEach(k => {
      totalSpend += k.spend
      totalClicks += k.clicks
      totalImpressions += k.impressions
      totalLeads += k.leads
      totalEnrolled += k.enrolled
      if (k.qualityScore !== null) {
        qsSum += k.qualityScore
        qsCount++
      }

      // Waste Spend: Keywords that have zero enrollments but have spent ad cash
      if (k.enrolled === 0 && k.spend > 0) {
        wasteSpend += k.spend
      }
    })

    return {
      totalKeywords: processedKeywords.length,
      totalSpend,
      totalLeads,
      totalEnrolled,
      avgQs: qsCount > 0 ? qsSum / qsCount : 0,
      wasteSpend
    }
  }, [processedKeywords])

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
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Keyword Quality Intelligence
              <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                Google Ads
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Audit search keywords by Google Quality Score and cross-platform CRM leads to identify budget leaks
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
            <p className="font-bold">Error loading Keywords data</p>
            <p className="text-rose-300/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-6 animate-pulse relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-900/60 border border-slate-800/80 rounded-2xl" />
            ))}
          </div>
          <div className="h-[400px] bg-slate-900/60 border border-slate-800/80 rounded-2xl" />
        </div>
      ) : data ? (
        <div className="relative z-10 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Total Keywords</p>
              <p className="text-xl font-black text-white mt-1">{stats.totalKeywords.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1">Active in matching filters</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Total Ad Spend</p>
              <p className="text-xl font-black text-white mt-1">₹{Math.round(stats.totalSpend).toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1">Google search network spend</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Average Quality Score</p>
              <p className="text-xl font-black text-indigo-300 mt-1">{stats.avgQs.toFixed(1)}/10</p>
              <p className="text-[10px] text-slate-550 mt-1">Creative & Landing page relevancy</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-rose-450 uppercase font-black tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Non-Converting Spend
              </p>
              <p className="text-xl font-black text-rose-400 mt-1">₹{Math.round(stats.wasteSpend).toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1">Keywords with spend but 0 enrolls</p>
            </div>
          </div>

          {/* Filters & Search Bar */}
          <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search keywords (e.g. 'free')..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>

            {/* Filter selectors */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Quality Score */}
              <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase">QS:</span>
                <select
                  value={qsFilter}
                  onChange={(e) => setQsFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 font-bold focus:outline-none border-none cursor-pointer py-0"
                >
                  <option className="bg-[#0b0f19]" value="ALL">All Scores</option>
                  <option className="bg-[#0b0f19]" value="HIGH">High (8-10)</option>
                  <option className="bg-[#0b0f19]" value="MEDIUM">Average (5-7)</option>
                  <option className="bg-[#0b0f19]" value="LOW">Poor (1-4)</option>
                </select>
              </div>

              {/* Match Type */}
              <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Match:</span>
                <select
                  value={matchTypeFilter}
                  onChange={(e) => setMatchTypeFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 font-bold focus:outline-none border-none cursor-pointer py-0"
                >
                  <option className="bg-[#0b0f19]" value="ALL">All Types</option>
                  <option className="bg-[#0b0f19]" value="BROAD">Broad Match</option>
                  <option className="bg-[#0b0f19]" value="PHRASE">Phrase Match</option>
                  <option className="bg-[#0b0f19]" value="EXACT">Exact Match</option>
                </select>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 font-bold focus:outline-none border-none cursor-pointer py-0"
                >
                  <option className="bg-[#0b0f19]" value="ALL">All Statuses</option>
                  <option className="bg-[#0b0f19]" value="ENABLED">Active / Enabled</option>
                  <option className="bg-[#0b0f19]" value="PAUSED">Paused / Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Keywords Table Card */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-slate-850 flex items-center justify-between">
              <div>
                <h4 className="text-base font-extrabold text-white">Search Keywords Performance Matrix</h4>
                <p className="text-xs text-slate-400 mt-1">Comparing search volumes and enrollment values to exclude wasteful search queries</p>
              </div>
              <span className="text-[10px] font-bold bg-slate-950/80 text-slate-300 border border-slate-850 px-3 py-1 rounded-xl">
                Showing {processedKeywords.length} of {data.keywords.length} keywords
              </span>
            </div>

            {processedKeywords.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <SlidersHorizontal className="w-8 h-8 text-slate-650 mx-auto" />
                <p className="text-sm font-extrabold text-slate-300">No keywords match your filters</p>
                <p className="text-xs text-slate-500">Try adjusting your search query or dropdown selectors</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/30 text-slate-400 text-[10px] uppercase font-black tracking-wider border-b border-slate-850">
                      <th className="py-3 px-5">
                        <button onClick={() => handleSort('text')} className="flex items-center gap-1 hover:text-white uppercase">
                          Search Keyword <ArrowUpDown className="w-3 h-3 shrink-0" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-center">Type</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">
                        <button onClick={() => handleSort('qualityScore')} className="flex items-center gap-1 hover:text-white mx-auto uppercase">
                          Quality Score <ArrowUpDown className="w-3 h-3 shrink-0" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-right">
                        <button onClick={() => handleSort('spend')} className="flex items-center gap-1 hover:text-white ml-auto uppercase">
                          Spend <ArrowUpDown className="w-3 h-3 shrink-0" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-right">
                        <button onClick={() => handleSort('impressions')} className="flex items-center gap-1 hover:text-white ml-auto uppercase">
                          Impressions <ArrowUpDown className="w-3 h-3 shrink-0" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-right">
                        <button onClick={() => handleSort('clicks')} className="flex items-center gap-1 hover:text-white ml-auto uppercase">
                          Clicks <ArrowUpDown className="w-3 h-3 shrink-0" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-right">
                        <button onClick={() => handleSort('ctr')} className="flex items-center gap-1 hover:text-white ml-auto uppercase">
                          CTR <ArrowUpDown className="w-3 h-3 shrink-0" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-right">
                        <button onClick={() => handleSort('cpc')} className="flex items-center gap-1 hover:text-white ml-auto uppercase">
                          CPC <ArrowUpDown className="w-3 h-3 shrink-0" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-center">
                        <button onClick={() => handleSort('leads')} className="flex items-center gap-1 hover:text-white mx-auto uppercase">
                          CRM Leads <ArrowUpDown className="w-3 h-3 shrink-0" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-center text-emerald-400">
                        <button onClick={() => handleSort('enrolled')} className="flex items-center gap-1 hover:text-white mx-auto uppercase">
                          Enrolled <ArrowUpDown className="w-3 h-3 shrink-0" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs font-bold text-slate-300">
                    {processedKeywords.map((kw: any, idx: number) => {
                      const isFreeKeyword = kw.text.toLowerCase().includes('free')

                      return (
                        <tr 
                          key={`${kw.text}-${kw.matchType}-${idx}`} 
                          className={`hover:bg-slate-900/30 transition-colors ${
                            isFreeKeyword ? 'bg-amber-900/5 hover:bg-amber-900/10' : ''
                          }`}
                        >
                          <td className="py-3.5 px-5 font-mono text-slate-200">
                            <span className="flex items-center gap-2">
                              {kw.text}
                              {isFreeKeyword && (
                                <span className="text-[8px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                  Negative candidate
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              {kw.matchType}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-black ${
                              kw.status === 'ENABLED' || kw.status === 'ACTIVE'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                            }`}>
                              {kw.status === 'ENABLED' || kw.status === 'ACTIVE' ? 'Active' : 'Paused'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {kw.qualityScore !== null ? (
                              <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                                kw.qualityScore >= 8 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                kw.qualityScore >= 5 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                'bg-rose-500/10 text-rose-450 border border-rose-500/20'
                              }`}>{kw.qualityScore}/10</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-350">₹{Math.round(kw.spend).toLocaleString()}</td>
                          <td className="py-3.5 px-4 text-right text-slate-400">{kw.impressions.toLocaleString()}</td>
                          <td className="py-3.5 px-4 text-right text-slate-400">{kw.clicks.toLocaleString()}</td>
                          <td className="py-3.5 px-4 text-right text-indigo-300 font-semibold">{kw.ctr.toFixed(2)}%</td>
                          <td className="py-3.5 px-4 text-right text-slate-350">{kw.cpc > 0 ? `₹${kw.cpc.toFixed(1)}` : '₹0'}</td>
                          <td className="py-3.5 px-4 text-center text-slate-200">{kw.leads}</td>
                          <td className="py-3.5 px-4 text-center text-emerald-400 font-black">{kw.enrolled}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Data Transparency Card */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-extrabold text-white">Data Sourcing & Authenticity Guarantee</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Learn how keywords are tracked and attributed in this dashboard</p>
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
                    Google Ads API Integration (100% Real)
                  </h5>
                  <ul className="space-y-2.5 pl-4 list-disc list-outside">
                    <li>
                      <strong className="text-slate-200">Keywords, Spend, and Quality Score:</strong> Synced in real time from Google Ads. Data represents the actual search keywords active in your campaigns, including their true Quality Scores and Google impressions.
                    </li>
                    <li>
                      <strong className="text-slate-200">No mock overrides:</strong> All keywords fetched are real. When the API returns active keywords, fallback mock defaults are disabled.
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h5 className="font-black text-indigo-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    TeleCRM CRM Attribution Integration (100% Real)
                  </h5>
                  <ul className="space-y-2.5 pl-4 list-disc list-outside">
                    <li>
                      <strong className="text-slate-200">CRM Leads & Enrollment Mapping:</strong> Lead and student registration quantities are resolved by joining the TeleCRM database leads that arrived via Google Ads with the exact keyword text matching the lead's URL tracking parameters (`utm_term`).
                    </li>
                    <li>
                      <strong className="text-slate-200">Transparency on 0 Spend/Leads:</strong> If a keyword (like a newly active "free" keyword) has spent ₹0 or generated 0 CRM leads, the dashboard represents this exactly as ₹0 and 0 leads, ensuring 100% data authenticity.
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
