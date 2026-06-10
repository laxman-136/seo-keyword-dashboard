// app/ads/intelligence/forecast/page.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useDateRange } from '@/hooks/useDateRange'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import { 
  TrendingUp, AlertCircle, HelpCircle, CheckCircle, AlertTriangle, 
  ShieldCheck, DollarSign, Users, Target, ArrowRight, Sparkles, Sliders
} from 'lucide-react'

interface ForecastProjected {
  spend: number
  leads: number
  enrolled: number
  revenue: number
  cpe: number
}

interface WhatIfScenarioResult {
  landingPageConvRate: number
  projectedLeads: number
  projectedEnrolled: number
  projectedRevenue: number
  spendNeeded: number
  roas: number
}

interface BaselineStats {
  daysCount: number
  totalClicks: number
  currentCR: number
  leadToEnrollRate: number
  avgFee: number
  projectedClicks: number
}

interface ForecastPayload {
  projected: ForecastProjected
  scenarios: WhatIfScenarioResult[]
  baseline: BaselineStats
  isReal: boolean
}

export default function ForecastPage() {
  const { preset, from, to, label, setDateRange } = useDateRange()
  const [data, setData] = useState<ForecastPayload | null>(null)
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

      const res = await fetch(`/api/ads/intelligence/forecast?${query.toString()}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to fetch forecast data')
      }

      const resData = await res.json()
      setData(resData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while fetching forecast data')
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

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-100px] left-[-200px] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Header Bar */}
      <div className="relative z-30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Performance Forecasting
              <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full">
                Predictive Modeling
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Linear statistical projections and landing page optimization what-if simulations calculated dynamically from current date range
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
            <p className="font-bold">Error loading Forecasting data</p>
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
      ) : data ? (
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
                {data.isReal ? 'API Forecasting Projections Live' : 'Viewing Sandbox Demo Mode'}
              </p>
              <p className="mt-1 font-semibold">
                {data.isReal 
                  ? 'Extrapolations are calculated using actual account-level spends and click volumes resolved pro-rata. Baseline conversion close rates and fee values are resolved directly from TeleCRM.' 
                  : 'No active Google Ads or Meta Ads credentials were found. Showing simulated performance forecasting. Connect keys in Settings to simulate live account trends.'}
              </p>
            </div>
          </div>

          {/* Baseline Assumptions Panel */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-base font-extrabold text-white">Forecasting Baseline Parameters</h3>
                <p className="text-xs text-slate-400 mt-0.5">Statistical variables extracted from the selected {data.baseline.daysCount}-day performance period</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs font-bold text-slate-300">
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Period Duration</span>
                <span className="text-lg font-black text-white block mt-1">{data.baseline.daysCount} Days</span>
                <span className="text-[9.5px] text-slate-500 font-semibold block mt-0.5">Scale multiplier: {(30 / data.baseline.daysCount).toFixed(2)}x</span>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Total Period Clicks</span>
                <span className="text-lg font-black text-white block mt-1">{data.baseline.totalClicks.toLocaleString()}</span>
                <span className="text-[9.5px] text-slate-500 font-semibold block mt-0.5">Projected month: {data.baseline.projectedClicks.toLocaleString()}</span>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Landing Page CR</span>
                <span className="text-lg font-black text-indigo-300 block mt-1">{data.baseline.currentCR.toFixed(2)}%</span>
                <span className="text-[9.5px] text-slate-500 font-semibold block mt-0.5">Clicks-to-Lead conversion</span>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Lead-to-Enroll Rate</span>
                <span className="text-lg font-black text-emerald-400 block mt-1">{data.baseline.leadToEnrollRate.toFixed(2)}%</span>
                <span className="text-[9.5px] text-slate-500 font-semibold block mt-0.5">Historic CRM close rate</span>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Avg Course Revenue</span>
                <span className="text-lg font-black text-white block mt-1">₹{data.baseline.avgFee.toLocaleString()}</span>
                <span className="text-[9.5px] text-slate-500 font-semibold block mt-0.5">Blended fee booking value</span>
              </div>
            </div>
          </div>

          {/* Month-End Runrate Projection */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-white">Projected Month-End Run-Rates</h3>
              <p className="text-xs text-slate-400 mt-1">Linear statistical extrapolation of current spending velocity and conversion volumes to a full 30-day cycle</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850 shadow-sm relative overflow-hidden group">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Projected Spend</span>
                <p className="text-xl font-black text-white mt-1.5">₹{data.projected.spend.toLocaleString()}</p>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 absolute top-5 right-5" />
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850 shadow-sm relative overflow-hidden group">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Projected Leads</span>
                <p className="text-xl font-black text-indigo-300 mt-1.5">{data.projected.leads.toLocaleString()}</p>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 absolute top-5 right-5" />
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850 shadow-sm relative overflow-hidden group">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Projected Enrolled</span>
                <p className="text-xl font-black text-emerald-450 mt-1.5">{data.projected.enrolled.toLocaleString()}</p>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-5 right-5" />
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850 shadow-sm relative overflow-hidden group">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Projected Revenue</span>
                <p className="text-xl font-black text-emerald-400 mt-1.5">₹{data.projected.revenue.toLocaleString()}</p>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-455 absolute top-5 right-5" />
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850 shadow-sm relative overflow-hidden group">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Projected CPE (CPA)</span>
                <p className="text-xl font-black text-white mt-1.5">₹{data.projected.cpe.toLocaleString()}</p>
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 absolute top-5 right-5" />
              </div>
            </div>
          </div>

          {/* What If Scenario Optimization */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-white">What-If Optimization Simulations</h3>
              <p className="text-xs text-slate-400 mt-1">Simulate the direct impact of optimizing your landing page conversion rate (CR) on enrollments, revenues, and true ROAS</p>
            </div>
            
            <div className="space-y-4">
              {data.scenarios.map((s, idx) => {
                const leadsAdded = s.projectedLeads - data.projected.leads
                const enrolledAdded = s.projectedEnrolled - data.projected.enrolled
                const revenueAdded = s.projectedRevenue - data.projected.revenue

                return (
                  <div key={idx} className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/30 hover:border-slate-850 transition-all flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center relative overflow-hidden">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                          Scenario {idx + 1}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">Optimizing CR by +{(s.landingPageConvRate - data.baseline.currentCR).toFixed(1)}%</span>
                      </div>
                      <h4 className="text-base font-black text-white flex items-center gap-2">
                        Improve Landing Page CR to <span className="text-indigo-400 font-black">{s.landingPageConvRate.toFixed(1)}%</span>
                      </h4>
                      <p className="text-[11px] text-slate-450 leading-relaxed font-semibold">
                        Assumes ad clicks ({data.baseline.projectedClicks.toLocaleString()}) and CRM close rate ({data.baseline.leadToEnrollRate.toFixed(1)}%) remain constant.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto text-left lg:text-right font-bold text-xs">
                      <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900/60 lg:bg-transparent lg:p-0 lg:border-none">
                        <p className="text-[10px] text-slate-500 uppercase font-black">Projected Leads</p>
                        <p className="text-base font-black text-white mt-0.5">{s.projectedLeads.toLocaleString()}</p>
                        <span className="text-[9.5px] text-emerald-450 font-black mt-0.5 block">+{leadsAdded} leads</span>
                      </div>
                      <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900/60 lg:bg-transparent lg:p-0 lg:border-none">
                        <p className="text-[10px] text-slate-500 uppercase font-black">Projected Enrolled</p>
                        <p className="text-base font-black text-white mt-0.5">{s.projectedEnrolled.toLocaleString()}</p>
                        <span className="text-[9.5px] text-emerald-450 font-black mt-0.5 block">+{enrolledAdded} students</span>
                      </div>
                      <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900/60 lg:bg-transparent lg:p-0 lg:border-none">
                        <p className="text-[10px] text-slate-500 uppercase font-black">Projected Revenue</p>
                        <p className="text-base font-black text-white mt-0.5">₹{s.projectedRevenue.toLocaleString()}</p>
                        <span className="text-[9.5px] text-emerald-450 font-black mt-0.5 block">+₹{revenueAdded.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900/60 lg:bg-transparent lg:p-0 lg:border-none">
                        <p className="text-[10px] text-slate-500 uppercase font-black">Projected ROAS</p>
                        <p className="text-base font-black text-emerald-450 mt-0.5">{s.roas.toFixed(2)}x</p>
                        <span className="text-[9.5px] text-slate-500 font-semibold mt-0.5 block">vs {(data.projected.spend > 0 ? (data.projected.revenue / data.projected.spend) : 0).toFixed(2)}x MTD</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sourcing Transparency card */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-extrabold text-white">Forecasting & Simulation Models</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Understand the mathematical assumptions behind month-end projections and what-if calculations</p>
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
                    Month-End Projection Formula (Linear Extrapolation)
                  </h5>
                  <p className="text-slate-400">
                    Projections are modeled dynamically based on your active date range limits:
                  </p>
                  <ul className="space-y-2.5 pl-4 list-disc list-outside">
                    <li>
                      <strong className="text-slate-200">Multiplier Heuristic:</strong> We divide the month's target (30 days) by the duration of the selected date range (`daysCount`) to calculate a scaling factor.
                    </li>
                    <li>
                      <strong className="text-slate-200">Linear Scale:</strong> We multiply current spends, clicks, leads, and enrollments by this factor to extrapolate runrate metrics for a full 30-day period.
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h5 className="font-black text-indigo-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    What-If Landing Page CR Calculation
                  </h5>
                  <p className="text-slate-400">
                    Simulates improvements in landing page efficiency keeping traffic acquisition constant:
                  </p>
                  <ul className="space-y-2.5 pl-4 list-disc list-outside">
                    <li>
                      <strong className="text-slate-200">Leads Projection:</strong> `Projected Clicks (Sessions) * Target Landing Page CR`.
                    </li>
                    <li>
                      <strong className="text-slate-250">Enrolled Projection:</strong> `Projected Leads * Historic CRM lead-to-enroll rate`.
                    </li>
                    <li>
                      <strong className="text-slate-250">Revenue Booking:</strong> `Projected Enrolled * Blended Average Fee`.
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
