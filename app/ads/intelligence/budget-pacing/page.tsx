// app/ads/intelligence/budget-pacing/page.tsx
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useDateRange } from '@/hooks/useDateRange'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import { 
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts'
import { 
  AlertCircle, DollarSign, ShieldCheck, ArrowRight, TrendingUp, 
  HelpCircle, Sparkles, CheckCircle, AlertTriangle, Coins 
} from 'lucide-react'

interface DailySpendPoint {
  date: string
  dateStr: string
  metaSpend: number
  googleSpend: number
  spendToday: number
  cumulativeActual: number
  cumulativeIdeal: number
  idealDaily: number
}

interface BudgetPacingData {
  dailySpendPoints: DailySpendPoint[]
  totalBudget: number
  dailyBudgetLimit: number
  metaDailyBudget: number
  googleDailyBudget: number
  cumulativeActual: number
  cumulativeIdeal: number
  daysCount: number
  metaPrepaid: number
  googlePrepaid: number
  isReal: boolean
}

export default function BudgetPacingPage() {
  const { preset, from, to, label, setDateRange } = useDateRange()
  const [data, setData] = useState<BudgetPacingData | null>(null)
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

      const res = await fetch(`/api/ads/intelligence/budget-pacing?${query.toString()}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to fetch budget-pacing data')
      }

      const resData = await res.json()
      setData(resData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while fetching budget pacing')
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

  // Derive additional stats
  const pacingStats = useMemo(() => {
    if (!data) return null

    const actual = data.cumulativeActual
    const ideal = data.cumulativeIdeal
    const budget = data.totalBudget

    // Pacing Pct (actual spend vs ideal cumulative spend)
    const pacingPct = ideal > 0 ? (actual / ideal) * 100 : 0
    const overallSpentPct = budget > 0 ? (actual / budget) * 100 : 0

    // Pacing Status Heuristic
    let pacingStatus: 'healthy' | 'under' | 'over' = 'healthy'
    let pacingStatusLabel = 'On Track'
    let pacingColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'

    if (pacingPct < 85) {
      pacingStatus = 'under'
      pacingStatusLabel = 'Under Pacing'
      pacingColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    } else if (pacingPct > 110) {
      pacingStatus = 'over'
      pacingStatusLabel = 'Over Pacing'
      pacingColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    }

    // Run-rate projection
    const dailyAvg = data.daysCount > 0 ? actual / data.daysCount : 0
    const projectedSpend = dailyAvg * data.daysCount
    const projectionDiff = projectedSpend - budget

    return {
      pacingPct,
      overallSpentPct,
      pacingStatus,
      pacingStatusLabel,
      pacingColor,
      dailyAvg,
      projectedSpend,
      projectionDiff
    }
  }, [data])

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
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Budget Pacing & Audit
              <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                Linear pacing
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Analyze daily cumulative media spends against linear budget targets to prevent over-spending or under-delivery
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
            <p className="font-bold">Error loading Budget Pacing data</p>
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
          <div className="h-[400px] bg-slate-900/60 border border-slate-800/80 rounded-2xl" />
        </div>
      ) : data && pacingStats ? (
        <div className="relative z-10 space-y-8">
          
          {/* Authenticity Disclosure Alert */}
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
                {data.isReal ? 'Live API Data Enabled' : 'Viewing Sandbox Demo Mode'}
              </p>
              <p className="mt-1 font-semibold">
                {data.isReal 
                  ? 'All budgets, daily spends, and trends are fetched in real time from Google Ads and Meta Ads API channels.' 
                  : 'No active Google Ads or Meta Ads credentials were found in Supabase. The charts are populated with simulated data. Go to Settings to connect your accounts.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Cumulative Spend</p>
              <p className="text-xl font-black text-white mt-1">₹{data.cumulativeActual.toLocaleString()}</p>
              <div className="w-full bg-slate-950/80 h-1.5 rounded-full overflow-hidden border border-slate-900 mt-2">
                <div 
                  className="h-full bg-indigo-500 rounded-full" 
                  style={{ width: `${Math.min(100, pacingStats.overallSpentPct)}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-500 mt-1.5 font-bold">Spent {pacingStats.overallSpentPct.toFixed(1)}% of total budget limit</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Ideal Linear Target</p>
              <p className="text-xl font-black text-white mt-1">₹{data.cumulativeIdeal.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-2 font-bold">Based on ₹{data.dailyBudgetLimit.toLocaleString()}/day target</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Pacing Ratio</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black text-white">{pacingStats.pacingPct.toFixed(1)}%</span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 border rounded-full ${pacingStats.pacingColor}`}>
                  {pacingStats.pacingStatusLabel}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2.5 font-bold">
                {pacingStats.pacingStatus === 'healthy' && 'Spend matches budget rate.'}
                {pacingStats.pacingStatus === 'under' && 'Budget is under-utilized.'}
                {pacingStats.pacingStatus === 'over' && 'Warning: Spending too fast.'}
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Period Run-Rate Projection</p>
              <p className="text-xl font-black text-indigo-300 mt-1">₹{Math.round(pacingStats.projectedSpend).toLocaleString()}</p>
              <p className={`text-[10px] font-bold mt-2 ${pacingStats.projectionDiff > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {pacingStats.projectionDiff > 0 ? 'Exceeds limit by' : 'Savings of'} ₹{Math.abs(Math.round(pacingStats.projectionDiff)).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Main Visual Pacing Curve (2/3) and Budgets Breakdowns (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Chart Area */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-white">Cumulative Monthly Budget Pacing</h3>
                <p className="text-xs text-slate-400 mt-1">Pacing curves showing actual cumulative spend vs ideal linear targets</p>
              </div>

              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.dailySpendPoints} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="actualGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '11px', color: '#f8fafc' }}
                      formatter={(val: any, name: string) => [`₹${Math.round(val).toLocaleString()}`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    
                    {/* Ideal Linear Path */}
                    <Line 
                      type="monotone" 
                      dataKey="cumulativeIdeal" 
                      stroke="#475569" 
                      strokeDasharray="5 5" 
                      name="Ideal Cumulative Target" 
                      strokeWidth={2} 
                      dot={false} 
                    />

                    {/* Actual Spend Area */}
                    <Area 
                      type="monotone" 
                      dataKey="cumulativeActual" 
                      stroke="#818cf8" 
                      fillOpacity={1} 
                      fill="url(#actualGlow)" 
                      name="Actual Cumulative Spend" 
                      strokeWidth={3} 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Account Limits & Balance */}
            <div className="space-y-8">
              
              {/* Daily Allocation Limits */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Active Daily Limits</h3>
                  <p className="text-xs text-slate-400 mt-1">Aggregated target daily budgets configured in ad accounts</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/40 border border-slate-900">
                    <div>
                      <p className="text-[11px] font-bold text-slate-450">Meta Ads Network</p>
                      <p className="text-[10px] text-slate-500">Live active campaigns daily budget</p>
                    </div>
                    <p className="text-sm font-black text-indigo-300">₹{data.metaDailyBudget.toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/40 border border-slate-900">
                    <div>
                      <p className="text-[11px] font-bold text-slate-450">Google Ads Network</p>
                      <p className="text-[10px] text-slate-500">Live active campaigns daily budget</p>
                    </div>
                    <p className="text-sm font-black text-cyan-300">₹{data.googleDailyBudget.toLocaleString()}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300">Combined Daily Budget</span>
                  <span className="text-base font-black text-white">₹{data.dailyBudgetLimit.toLocaleString()}</span>
                </div>

                <div className="pt-2 flex justify-between items-center text-xs text-slate-400">
                  <span>Selected Range Days</span>
                  <span className="font-bold">{data.daysCount} Days</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Total Budget Target</span>
                  <span className="font-bold text-white">₹{data.totalBudget.toLocaleString()}</span>
                </div>
              </div>

              {/* Prepaid Balances */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Prepaid Wallet Balance</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ad accounts wallet credits currently registered in Supabase settings
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl text-center">
                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Meta Prepaid</p>
                    <p className="text-sm font-black text-white mt-1">₹{data.metaPrepaid.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl text-center">
                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Google Prepaid</p>
                    <p className="text-sm font-black text-white mt-1">₹{data.googlePrepaid.toLocaleString()}</p>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Daily Audit Table */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-slate-850">
              <h4 className="text-base font-extrabold text-white">Daily Spend & Deviation Log</h4>
              <p className="text-xs text-slate-400 mt-1">Detailed day-by-day metrics on pacing targets and deviations</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/30 text-slate-450 text-[10px] uppercase font-black tracking-wider border-b border-slate-850">
                    <th className="py-3 px-5">Date</th>
                    <th className="py-3 px-4 text-right">Meta Spend</th>
                    <th className="py-3 px-4 text-right">Google Spend</th>
                    <th className="py-3 px-4 text-right">Total Spend</th>
                    <th className="py-3 px-4 text-right">Cumulative Actual</th>
                    <th className="py-3 px-4 text-right">Cumulative Target</th>
                    <th className="py-3 px-5 text-right">Pacing Deviation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-xs font-bold text-slate-355">
                  {data.dailySpendPoints.map((row, idx) => {
                    const dev = row.cumulativeActual - row.cumulativeIdeal
                    const isOver = dev > 0

                    return (
                      <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-3.5 px-5 font-mono text-slate-200">{row.date}</td>
                        <td className="py-3.5 px-4 text-right text-indigo-400/90">₹{row.metaSpend.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right text-cyan-400/90">₹{row.googleSpend.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right text-slate-200">₹{row.spendToday.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right text-white">₹{row.cumulativeActual.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right text-slate-500">₹{row.cumulativeIdeal.toLocaleString()}</td>
                        <td className={`py-3.5 px-5 text-right font-black ${dev === 0 ? 'text-slate-400' : isOver ? 'text-rose-400' : 'text-emerald-450'}`}>
                          {dev === 0 ? 'On Track' : `${isOver ? '+' : '-'}₹${Math.abs(dev).toLocaleString()}`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data Sourcing Guarantee Panel */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-extrabold text-white">Data Sourcing & Pacing Guarantee</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Learn how metrics are aggregated to construct budget pacing models</p>
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
                    Verified Live API Data Sources
                  </h5>
                  <ul className="space-y-2.5 pl-4 list-disc list-outside">
                    <li>
                      <strong className="text-slate-200">Daily Spend Trends:</strong> Daily spends are fetched via time-incremented account-level insights from Meta Graph API and Google Ads segment dates.
                    </li>
                    <li>
                      <strong className="text-slate-200">Active Daily Limits:</strong> Daily budgets represent the direct sum of active campaigns fetched from the campaign structure endpoint of the APIs.
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h5 className="font-black text-indigo-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    Pacing & Wallet Aggregations
                  </h5>
                  <ul className="space-y-2.5 pl-4 list-disc list-outside">
                    <li>
                      <strong className="text-slate-200">Linear Target Budget:</strong> Computed dynamically based on the total daily limits multiplied by the exact number of days selected in the DatePicker.
                    </li>
                    <li>
                      <strong className="text-slate-200">Wallet Balances:</strong> Retrieved directly from your active configuration profiles inside the database configurations table.
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
