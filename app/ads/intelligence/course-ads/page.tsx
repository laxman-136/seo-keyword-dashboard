// app/ads/intelligence/course-ads/page.tsx
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useDateRange } from '@/hooks/useDateRange'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import { 
  Layers, AlertCircle, ShieldCheck, CheckCircle, AlertTriangle, 
  Users, DollarSign, Target, Sparkles, TrendingUp, HelpCircle
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts'

interface CourseItem {
  course: string
  spend: number
  leads: number
  enrolled: number
  revenue: number
  trueROAS: number
}

interface CoursePayload {
  courses: CourseItem[]
  isReal: boolean
}

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#06b6d4', '#10b981']

export default function CourseAdsPage() {
  const { preset, from, to, label, setDateRange } = useDateRange()
  const [data, setData] = useState<CoursePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

      const res = await fetch(`/api/ads/intelligence/course-ads?${query.toString()}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to fetch course ads analytics')
      }

      const resData = await res.json()
      setData(resData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while fetching course ads')
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
    if (!data?.courses) return null

    let totalSpend = 0
    let totalLeads = 0
    let totalEnrolled = 0
    let totalRevenue = 0

    data.courses.forEach(c => {
      totalSpend += c.spend
      totalLeads += c.leads
      totalEnrolled += c.enrolled
      totalRevenue += c.revenue
    })

    const blendedCPE = totalEnrolled > 0 ? totalSpend / totalEnrolled : 0
    const blendedROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0

    return {
      totalSpend,
      totalLeads,
      totalEnrolled,
      totalRevenue,
      blendedCPE,
      blendedROAS
    }
  }, [data])

  // Chart data
  const chartData = useMemo(() => {
    if (!data?.courses) return []
    return data.courses.map((c, idx) => ({
      name: c.course.replace('Oracle Fusion ', ''),
      spend: c.spend,
      revenue: c.revenue,
      fill: COLORS[idx % COLORS.length]
    })).sort((a, b) => b.spend - a.spend)
  }, [data])

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-100px] left-[-200px] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Header Bar */}
      <div className="relative z-30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Course Blended Ad Analytics
              <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                ROI Matrix
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Analyze ad spends, enrollments, true course booking revenues, and blended ROAS resolved across Oracle ERP training modules
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
            <p className="font-bold">Error loading Course Ads Analytics</p>
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
                {data.isReal ? 'Live Course-Level Metrics Active' : 'Viewing Sandbox Demo Mode'}
              </p>
              <p className="mt-1 font-semibold">
                {data.isReal 
                  ? 'All metrics are resolved by classifying ad campaigns dynamically into module categories and matching them to actual enrollments and payment fields resolved from your TeleCRM leads database.' 
                  : 'No active Google Ads or Meta Ads credentials were found. Showing simulated course performance mapping. Connect keys in Settings to audit live modules.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Total Ad Investment</p>
              <p className="text-xl font-black text-white mt-1">₹{Math.round(stats.totalSpend).toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Spend matched across courses</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Total Booking Revenue</p>
              <p className="text-xl font-black text-indigo-300 mt-1">₹{Math.round(stats.totalRevenue).toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Fees from enrolled course sales</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Blended CPE (CPA)</p>
              <p className="text-xl font-black text-emerald-450 mt-1">
                {stats.totalEnrolled > 0 ? `₹${Math.round(stats.blendedCPE).toLocaleString()}` : '—'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">{stats.totalEnrolled} total course enrollments</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Blended true ROAS</p>
              <p className="text-xl font-black text-emerald-450 mt-1">
                {stats.blendedROAS > 0 ? `${stats.blendedROAS.toFixed(2)}x` : '0.00x'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">True booking revenue return multiplier</p>
            </div>
          </div>

          {/* Bar Chart comparing Spend and Revenue */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-extrabold text-white">Ad Spend vs. Course Booking Revenue</h3>
                <p className="text-xs text-slate-400 mt-1">Direct comparison of marketing spend vs. closed registration revenue by course module</p>
              </div>
            </div>

            <div className="h-[300px] w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-semibold">
                  No data available to display.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`}
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                      labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '11px' }}
                      itemStyle={{ fontSize: '11px' }}
                      formatter={(value: any, name: any) => [`₹${Math.round(value).toLocaleString()}`, name === 'spend' ? 'Ad Spend' : 'Booking Revenue']}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                    />
                    <Bar dataKey="spend" name="spend" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="revenue" name="revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Main Course Table Matrix */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-white">Course Marketing & ROI Index</h3>
              <p className="text-xs text-slate-400 mt-1">Blended client acquisition cost (CPE), leads created, close rates, and overall true return ratios</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/30 text-slate-450 text-[10px] uppercase font-black tracking-wider border-b border-slate-850">
                    <th className="py-3 px-4">ERP Training Module</th>
                    <th className="py-3 px-4 text-right">Ad Spend</th>
                    <th className="py-3 px-4 text-right">CRM Leads</th>
                    <th className="py-3 px-4 text-right">CPL</th>
                    <th className="py-3 px-4 text-right text-emerald-450">Enrolled</th>
                    <th className="py-3 px-4 text-right">CPE</th>
                    <th className="py-3 px-4 text-right">Close Rate</th>
                    <th className="py-3 px-4 text-right">Booking Revenue</th>
                    <th className="py-3 px-4 text-center">True ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-xs font-bold text-slate-300">
                  {data.courses.map((item) => {
                    const cpl = item.leads > 0 ? item.spend / item.leads : 0
                    const cpe = item.enrolled > 0 ? item.spend / item.enrolled : 0
                    const closeRate = item.leads > 0 ? (item.enrolled / item.leads) * 100 : 0
                    
                    // ROAS Badge styles
                    let roasColor = 'bg-slate-950 text-slate-400 border-slate-800'
                    if (item.trueROAS >= 3.0) {
                      roasColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                    } else if (item.trueROAS >= 1.0) {
                      roasColor = 'bg-cyan-950/40 text-cyan-400 border-cyan-500/20'
                    } else if (item.spend > 0) {
                      roasColor = 'bg-rose-950/40 text-rose-400 border-rose-500/20'
                    }

                    return (
                      <tr key={item.course} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-4 px-4 font-black text-white">{item.course}</td>
                        <td className="py-4 px-4 text-right text-slate-350">
                          {item.spend > 0 ? `₹${Math.round(item.spend).toLocaleString()}` : '₹0'}
                        </td>
                        <td className="py-4 px-4 text-right text-slate-200">{item.leads.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right text-indigo-300">
                          {cpl > 0 ? `₹${Math.round(cpl).toLocaleString()}` : '₹0'}
                        </td>
                        <td className="py-4 px-4 text-right text-emerald-450 font-black">{item.enrolled}</td>
                        <td className="py-4 px-4 text-right text-emerald-300">
                          {cpe > 0 ? `₹${Math.round(cpe).toLocaleString()}` : '—'}
                        </td>
                        <td className="py-4 px-4 text-right text-slate-200 font-extrabold">{closeRate.toFixed(1)}%</td>
                        <td className="py-4 px-4 text-right text-indigo-300 font-black">
                          {item.revenue > 0 ? `₹${Math.round(item.revenue).toLocaleString()}` : '₹0'}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-black ${roasColor}`}>
                            {item.trueROAS.toFixed(2)}x
                          </span>
                        </td>
                      </tr>
                    )
                  })}
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
                  <h4 className="text-sm font-extrabold text-white">Course Blended Ad Analytics Methodology</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Learn how spends and revenues are categorized and audited across modules</p>
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
                    Campaign-Level Spend Classification
                  </h5>
                  <p className="text-slate-400">
                    Campaign budgets and daily spends are aggregated from Google Ads and Meta Graph APIs. Individual campaigns are classified into course modules based on naming keywords:
                  </p>
                  <ul className="space-y-2.5 pl-4 list-disc list-outside">
                    <li>
                      <strong className="text-slate-200">SCM:</strong> Matches keywords like <code className="text-indigo-400 font-mono">scm</code>, <code className="text-indigo-400 font-mono">supply chain</code>, <code className="text-indigo-400 font-mono">wms</code>, <code className="text-indigo-400 font-mono">ppm</code>, <code className="text-indigo-400 font-mono">manufacturing</code>.
                    </li>
                    <li>
                      <strong className="text-slate-200">HCM:</strong> Matches keywords like <code className="text-indigo-400 font-mono">hcm</code>, <code className="text-indigo-400 font-mono">human capital</code>, <code className="text-indigo-400 font-mono">payroll</code>.
                    </li>
                    <li>
                      <strong className="text-slate-200">Financials:</strong> Matches keywords like <code className="text-indigo-400 font-mono">financials</code>, <code className="text-indigo-400 font-mono">finance</code>, <code className="text-indigo-400 font-mono">accounting</code>.
                    </li>
                    <li>
                      <strong className="text-slate-200">Technical:</strong> Matches keywords like <code className="text-indigo-400 font-mono">technical</code>, <code className="text-indigo-400 font-mono">oic</code>, <code className="text-indigo-400 font-mono">integration</code>, <code className="text-indigo-400 font-mono">apex</code>.
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h5 className="font-black text-indigo-450 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-455" />
                    TeleCRM Leads & Booking Value Mapping
                  </h5>
                  <ul className="space-y-2.5 pl-4 list-disc list-outside">
                    <li>
                      <strong className="text-slate-200">CRM Module Detection:</strong> Leads are mapped directly using the normalized course fields in TeleCRM. If a lead registers for "Oracle SCM Cloud Training", they are matched directly to SCM.
                    </li>
                    <li>
                      <strong className="text-slate-200">True Revenue Booking:</strong> Fee value is resolved using actual course price tiers (e.g. SCM = ₹27,169; HCM = ₹19,929; Financials = ₹21,950; Technical = ₹22,350) for Enrolled students, producing a true ROAS matrix.
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
