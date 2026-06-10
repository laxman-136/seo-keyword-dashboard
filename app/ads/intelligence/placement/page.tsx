// app/ads/intelligence/placement/page.tsx
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useDateRange } from '@/hooks/useDateRange'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import { 
  Layers, AlertCircle, ShieldCheck, CheckCircle, AlertTriangle, 
  Users, DollarSign, Target, Sparkles, ChevronRight, Video, Image, Play,
  PieChart as ChartIcon, BarChart2, Info
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

interface PlacementItem {
  platform: string
  spend: number
  clicks: number
  impressions: number
  platformConversions: number
  leads: number
  enrolled: number
}

interface FormatItem {
  format: string
  spend: number
  clicks: number
  impressions: number
  platformConversions: number
  leads: number
  enrolled: number
}

interface PlacementPayload {
  placements: PlacementItem[]
  formats: FormatItem[]
  isReal: boolean
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6']

export default function PlacementPage() {
  const { preset, from, to, label, setDateRange } = useDateRange()
  const [data, setData] = useState<PlacementPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'placement' | 'format'>('placement')
  const [showTransparency, setShowTransparency] = useState(false)

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

      const res = await fetch(`/api/ads/intelligence/placement?${query.toString()}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to fetch placement & format data')
      }

      const resData = await res.json()
      setData(resData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while fetching placement & format data')
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

  // Aggregate stats
  const stats = useMemo(() => {
    if (!data) return null

    let totalSpend = 0
    let totalClicks = 0
    let totalImpressions = 0
    let totalPlatConvs = 0
    let totalCRMLeads = 0
    let totalCRMEnrolls = 0

    data.placements.forEach(p => {
      totalSpend += p.spend
      totalClicks += p.clicks
      totalImpressions += p.impressions
      totalPlatConvs += p.platformConversions
      totalCRMLeads += p.leads
      totalCRMEnrolls += p.enrolled
    })

    return {
      totalSpend,
      totalClicks,
      totalImpressions,
      totalPlatConvs,
      totalCRMLeads,
      totalCRMEnrolls,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    }
  }, [data])

  // Chart data formatting
  const chartData = useMemo(() => {
    if (!data) return []
    if (activeTab === 'placement') {
      return data.placements.map((p, idx) => ({
        name: p.platform.replace(' Feed & Stories', '').replace(' Search Partners', ' Partners').replace(' Display Network', ' GDN'),
        spend: p.spend,
        conversions: p.platformConversions,
        leads: p.leads,
        fill: COLORS[idx % COLORS.length]
      })).sort((a, b) => b.spend - a.spend)
    } else {
      return data.formats.map((f, idx) => ({
        name: f.format.replace(' Responsive Search', ' RSA'),
        spend: f.spend,
        conversions: f.platformConversions,
        leads: f.leads,
        fill: COLORS[idx % COLORS.length]
      })).sort((a, b) => b.spend - a.spend)
    }
  }, [data, activeTab])

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-100px] left-[-200px] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Header Bar */}
      <div className="relative z-30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Placements & Creative Formats
              <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                API Delivery Audit
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Audit ad network delivery placements (Reels, Feeds, Search) and visual format styles backed by real CRM lead tracking
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
            <p className="font-bold">Error loading Placement & Format data</p>
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
          <div className="h-[350px] bg-slate-900/60 border border-slate-800/80 rounded-2xl" />
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
                {data.isReal ? 'API Placement & Format Breakdown Live' : 'Viewing Sandbox Demo Mode'}
              </p>
              <p className="mt-1 font-semibold">
                {data.isReal 
                  ? 'Metrics are resolved directly from your live Meta Graph and Google Ads API integrations. Placements and creative styles map actual spends, CTRs, and impressions, coupled with pro-rata CRM lead joins.' 
                  : 'No active Google Ads or Meta Ads credentials were found. Showing simulated delivery breakdowns. Connect your keys in Settings to audit live placements.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Total Delivery Spend</p>
              <p className="text-xl font-black text-white mt-1">₹{Math.round(stats.totalSpend).toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Cross-platform ad spend audited</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Avg Account CTR</p>
              <p className="text-xl font-black text-indigo-300 mt-1">{stats.ctr.toFixed(2)}%</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">{stats.totalClicks.toLocaleString()} clicks on {stats.totalImpressions.toLocaleString()} imps</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">CRM Attributed Leads</p>
              <p className="text-xl font-black text-cyan-300 mt-1">{stats.totalCRMLeads.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Matched leads resolved in TeleCRM</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">CRM Enrolled Students</p>
              <p className="text-xl font-black text-emerald-400 mt-1">{stats.totalCRMEnrolls.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Close rate: {(stats.totalCRMLeads > 0 ? (stats.totalCRMEnrolls / stats.totalCRMLeads) * 100 : 0).toFixed(1)}%</p>
            </div>
          </div>

          {/* Section Selector Tab */}
          <div className="flex bg-slate-950/60 p-1 rounded-2xl border border-slate-800 self-start max-w-sm">
            <button
              onClick={() => setActiveTab('placement')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'placement' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Ad Placements
            </button>
            <button
              onClick={() => setActiveTab('format')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'format' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ChartIcon className="w-4 h-4" />
              Creative Formats
            </button>
          </div>

          {/* Visualization Chart Card */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {activeTab === 'placement' ? 'Ad Spend vs. Attributed CRM Leads by Placement' : 'Ad Spend vs. Attributed CRM Leads by Format'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Visually comparing budget allocation efficiency to actual lead returns</p>
              </div>
            </div>

            <div className="h-[300px] w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-semibold">
                  No data points found to graph.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#94a3b8" 
                      fontSize={9} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#818cf8" 
                      fontSize={9} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#22d3ee" 
                      fontSize={9} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(v) => `${v}`}
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                      labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '11px' }}
                      itemStyle={{ fontSize: '11px' }}
                      formatter={(value: any, name: any) => {
                        if (name === 'spend') return [`₹${Math.round(value).toLocaleString()}`, 'Spend']
                        if (name === 'leads') return [Math.round(value), 'CRM Leads']
                        return [value, name]
                      }}
                    />
                    <Bar yAxisId="left" dataKey="spend" name="spend" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar yAxisId="right" dataKey="leads" name="leads" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Main Table Card */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-white">
                {activeTab === 'placement' ? 'Placement Audit Matrix' : 'Ad Format Performance Metrics'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === 'placement' 
                  ? 'Audit placement channels like Facebook Feed, Instagram Reels, Google Search, and Audience Network' 
                  : 'Comparing lead generation, enrollment rates, and CPL metrics across creative format styles'}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/30 text-slate-450 text-[10px] uppercase font-black tracking-wider border-b border-slate-850">
                    <th className="py-3 px-4">{activeTab === 'placement' ? 'Placement Channel' : 'Creative Format'}</th>
                    <th className="py-3 px-4 text-right">Spend</th>
                    <th className="py-3 px-4 text-right">Clicks / Imps</th>
                    <th className="py-3 px-4 text-right">CTR</th>
                    <th className="py-3 px-4 text-right">Platform Convs</th>
                    <th className="py-3 px-4 text-right text-indigo-300">CRM Leads</th>
                    <th className="py-3 px-4 text-right">CPL</th>
                    <th className="py-3 px-4 text-right text-emerald-400">Enrolled</th>
                    <th className="py-3 px-4 text-right">CPE</th>
                    <th className="py-3 px-4 text-right">Close Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-xs font-bold text-slate-300">
                  {activeTab === 'placement' ? (
                    data.placements.map((item) => {
                      const cpl = item.leads > 0 ? item.spend / item.leads : 0
                      const cpe = item.enrolled > 0 ? item.spend / item.enrolled : 0
                      const conv = item.leads > 0 ? (item.enrolled / item.leads) * 100 : 0
                      const ctrVal = item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0

                      return (
                        <tr key={item.platform} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-4 px-4">
                            <span className="font-black text-white block">{item.platform}</span>
                            <span className="text-[9px] text-slate-500 font-medium mt-0.5 block">
                              {item.platform.includes('Google') ? 'Google Ads Network' : 'Meta Graph Network'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right text-slate-350">
                            {item.spend > 0 ? `₹${Math.round(item.spend).toLocaleString()}` : '₹0'}
                          </td>
                          <td className="py-4 px-4 text-right text-slate-400 font-mono text-[10px]">
                            {item.clicks.toLocaleString()} <span className="text-slate-600">/</span> {item.impressions.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-right text-slate-200">{ctrVal.toFixed(2)}%</td>
                          <td className="py-4 px-4 text-right text-slate-350">{item.platformConversions.toLocaleString()}</td>
                          <td className="py-4 px-4 text-right text-indigo-300 font-black">{item.leads.toLocaleString()}</td>
                          <td className="py-4 px-4 text-right text-indigo-200">
                            {cpl > 0 ? `₹${Math.round(cpl).toLocaleString()}` : '₹0'}
                          </td>
                          <td className="py-4 px-4 text-right text-emerald-450 font-black">{item.enrolled}</td>
                          <td className="py-4 px-4 text-right text-emerald-300">
                            {cpe > 0 ? `₹${Math.round(cpe).toLocaleString()}` : '—'}
                          </td>
                          <td className="py-4 px-4 text-right text-white font-black">{conv.toFixed(1)}%</td>
                        </tr>
                      )
                    })
                  ) : (
                    data.formats.map((item) => {
                      const cpl = item.leads > 0 ? item.spend / item.leads : 0
                      const cpe = item.enrolled > 0 ? item.spend / item.enrolled : 0
                      const conv = item.leads > 0 ? (item.enrolled / item.leads) * 100 : 0
                      const ctrVal = item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0

                      return (
                        <tr key={item.format} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-4 px-4">
                            <span className="flex items-center gap-2 font-black text-white">
                              {item.format.includes('Image') && <Image className="w-4 h-4 text-indigo-400" />}
                              {item.format.includes('Video') && <Play className="w-4 h-4 text-violet-400" />}
                              {item.format.includes('Carousel') && <Layers className="w-4 h-4 text-pink-400" />}
                              {item.format.includes('Google') && <Target className="w-4 h-4 text-cyan-400" />}
                              {item.format}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right text-slate-350">
                            {item.spend > 0 ? `₹${Math.round(item.spend).toLocaleString()}` : '₹0'}
                          </td>
                          <td className="py-4 px-4 text-right text-slate-400 font-mono text-[10px]">
                            {item.clicks.toLocaleString()} <span className="text-slate-600">/</span> {item.impressions.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-right text-slate-200">{ctrVal.toFixed(2)}%</td>
                          <td className="py-4 px-4 text-right text-slate-350">{item.platformConversions.toLocaleString()}</td>
                          <td className="py-4 px-4 text-right text-indigo-300 font-black">{item.leads.toLocaleString()}</td>
                          <td className="py-4 px-4 text-right text-indigo-200">
                            {cpl > 0 ? `₹${Math.round(cpl).toLocaleString()}` : '₹0'}
                          </td>
                          <td className="py-4 px-4 text-right text-emerald-450 font-black">{item.enrolled}</td>
                          <td className="py-4 px-4 text-right text-emerald-300">
                            {cpe > 0 ? `₹${Math.round(cpe).toLocaleString()}` : '—'}
                          </td>
                          <td className="py-4 px-4 text-right text-white font-black">{conv.toFixed(1)}%</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sourcing Transparency card */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-extrabold text-white">Placement & Format Attribution Strategy</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Learn how leads and enrollments are allocated down to placement and format metrics</p>
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
                    Real API-Reported Spend & Traffic (100% Real)
                  </h5>
                  <p className="text-slate-400">
                    Spends, clicks, impressions, and platform-level conversions are resolved directly from Graph APIs.
                  </p>
                  <ul className="space-y-2.5 pl-4 list-disc list-outside">
                    <li>
                      <strong className="text-slate-200">Google Networks:</strong> Segments spend by network type (e.g. Search, Search Partners, Display/Content) directly via account queries.
                    </li>
                    <li>
                      <strong className="text-slate-200">Meta Placements:</strong> Fetches breakdowns by publisher platform (Facebook, Instagram, Audience Network, Messenger) and position (Reels, Feed, Stories).
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h5 className="font-black text-cyan-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Pro-Rata CRM Attributed Leads (Heuristic Join)
                  </h5>
                  <p className="text-slate-400">
                    Because CRM forms capture the campaign name but do not store granular placement position parameters, we utilize a pro-rata attribution model:
                  </p>
                  <ul className="space-y-2.5 pl-4 list-disc list-outside">
                    <li>
                      <strong className="text-slate-200">Attribution Weight:</strong> We sum all leads for the platform and distribute them across placements and formats proportionally to the platform-reported conversions.
                    </li>
                    <li>
                      <strong className="text-slate-200">Zero-conversion fallback:</strong> If a placement has spend but 0 reported conversions, we allocate leads based on its clicks share or spend share.
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
