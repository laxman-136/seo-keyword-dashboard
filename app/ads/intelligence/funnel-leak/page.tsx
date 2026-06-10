// app/ads/intelligence/funnel-leak/page.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useDateRange } from '@/hooks/useDateRange'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import { 
  AlertCircle, AlertTriangle, Layers, Info, ShieldCheck, 
  TrendingDown, DollarSign, ArrowDown, HelpCircle, 
  Activity, CheckCircle, Sparkles, RefreshCw
} from 'lucide-react'

type ChannelType = 'overall' | 'meta' | 'google'

interface FunnelStepData {
  impressions: number
  clicks: number
  leadsCRM: number
  demos: number
  enrolled: number
  spend: number
}

interface FunnelPayload {
  overall: FunnelStepData
  meta: FunnelStepData
  google: FunnelStepData
}

export default function FunnelLeakPage() {
  const { preset, from, to, label, setDateRange } = useDateRange()
  const [data, setData] = useState<FunnelPayload | null>(null)
  const [activeChannel, setActiveChannel] = useState<ChannelType>('overall')
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

      const res = await fetch(`/api/ads/intelligence/funnel-leak?${query.toString()}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to fetch funnel-leak data')
      }

      const resData = await res.json()
      setData(resData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while fetching funnel data')
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

  // Get current funnel data based on channel selection
  const currentData = data ? data[activeChannel] : null

  // Calculate funnel metrics
  const calculateMetrics = (stepData: FunnelStepData) => {
    const { impressions, clicks, leadsCRM, demos, enrolled, spend } = stepData

    // Rates
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
    const clickToLead = clicks > 0 ? (leadsCRM / clicks) * 100 : 0
    const leadToDemo = leadsCRM > 0 ? (demos / leadsCRM) * 100 : 0
    const demoToEnroll = demos > 0 ? (enrolled / demos) * 100 : 0
    const overallConv = impressions > 0 ? (enrolled / impressions) * 100 : 0

    // Costs
    const cpc = clicks > 0 ? spend / clicks : 0
    const cpl = leadsCRM > 0 ? spend / leadsCRM : 0
    const cpd = demos > 0 ? spend / demos : 0
    const cpe = enrolled > 0 ? spend / enrolled : 0

    // Leakage Quantities
    const leakClicks = clicks - leadsCRM
    const leakLeads = leadsCRM - demos
    const leakDemos = demos - enrolled

    // Leakage Costs
    const costLeakClicks = leakClicks > 0 ? leakClicks * cpc : 0
    const costLeakLeads = leakLeads > 0 ? leakLeads * cpl : 0
    const costLeakDemos = leakDemos > 0 ? leakDemos * cpd : 0
    const totalLeakCost = costLeakClicks + costLeakLeads + costLeakDemos

    return {
      ctr,
      clickToLead,
      leadToDemo,
      demoToEnroll,
      overallConv,
      cpc,
      cpl,
      cpd,
      cpe,
      leakClicks,
      leakLeads,
      leakDemos,
      costLeakClicks,
      costLeakLeads,
      costLeakDemos,
      totalLeakCost
    }
  }

  const metrics = currentData ? calculateMetrics(currentData) : null

  // Recommendations based on conversion rates
  const getRecommendations = () => {
    if (!metrics) return []
    const recs = []

    if (metrics.ctr < 1.5) {
      recs.push({
        stage: 'Impressions → Clicks',
        status: 'critical',
        metricName: 'Click-Through Rate (CTR)',
        value: `${metrics.ctr.toFixed(2)}%`,
        target: '> 2.0%',
        title: 'Ad Creative & Copy Fatigue Detected',
        description: 'Your click-through rate is below optimal standards. Refresh ad creative visuals (switch to reels or fresh imagery) and rewrite primary hook text.'
      })
    } else if (metrics.ctr < 2.5) {
      recs.push({
        stage: 'Impressions → Clicks',
        status: 'warning',
        metricName: 'Click-Through Rate (CTR)',
        value: `${metrics.ctr.toFixed(2)}%`,
        target: '> 2.5%',
        title: 'Slight Creative Decay',
        description: 'Consider running A/B headline tests to bump click engagement and prevent creep in ad cost.'
      })
    }

    if (metrics.clickToLead < 6) {
      recs.push({
        stage: 'Clicks → CRM Leads',
        status: 'critical',
        metricName: 'Landing Page Opt-In Rate',
        value: `${metrics.clickToLead.toFixed(1)}%`,
        target: '> 10%',
        title: 'High Landing Page Friction',
        description: 'Significant traffic is dropping off before submitting the lead form. Test a 1-step direct WhatsApp chat widget or remove unnecessary fields from your contact form.'
      })
    } else if (metrics.clickToLead < 10) {
      recs.push({
        stage: 'Clicks → CRM Leads',
        status: 'warning',
        metricName: 'Landing Page Opt-In Rate',
        value: `${metrics.clickToLead.toFixed(1)}%`,
        target: '> 12%',
        title: 'Optimise Page Relevancy',
        description: 'Ensure the landing page course details and pricing match the ad creative text perfectly to increase trust.'
      })
    }

    if (metrics.leadToDemo < 30) {
      recs.push({
        stage: 'CRM Leads → Demo Attendees',
        status: 'critical',
        metricName: 'Lead-to-Demo Attendance',
        value: `${metrics.leadToDemo.toFixed(1)}%`,
        target: '> 40%',
        title: 'Slow Follow-up/Warmup Deficit',
        description: 'Leads are not converting into webinar/demo attendees. Trigger automated WhatsApp templates immediately upon registration with calendar invites and direct reminders.'
      })
    }

    if (metrics.demoToEnroll < 8) {
      recs.push({
        stage: 'Demos → Enrollments',
        status: 'critical',
        metricName: 'Demo-to-Enrollment Rate',
        value: `${metrics.demoToEnroll.toFixed(1)}%`,
        target: '> 12%',
        title: 'Sales Pitch or Offer Gap',
        description: 'Leads attend the demo but do not purchase. Introduce a high-value fast-action discount code (valid only for 24 hours post-demo) or streamline the payment checkout flow.'
      })
    }

    // Default positive card if all is good
    if (recs.length === 0) {
      recs.push({
        stage: 'Funnel Integrity',
        status: 'positive',
        metricName: 'Overall Health',
        value: 'Healthy',
        target: '—',
        title: 'Funnel Converting in Target Zones',
        description: 'All stages are operating above average thresholds. Scale budgets linearly on top-performing campaigns to maintain return.'
      })
    }

    return recs
  }

  const recommendations = getRecommendations()

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
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Paid Funnel Leak Detection
              <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                Audit Active
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Overlay impressions and clicks with CRM demo attendance and student enrollments to pinpoint wasted budget
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
            <p className="font-bold">Error loading Funnel Leak data</p>
            <p className="text-rose-300/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-[600px] bg-slate-900/60 border border-slate-800/80 rounded-2xl animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-[250px] bg-slate-900/60 border border-slate-800/80 rounded-2xl animate-pulse" />
            <div className="h-[320px] bg-slate-900/60 border border-slate-800/80 rounded-2xl animate-pulse" />
          </div>
        </div>
      ) : data && currentData && metrics ? (
        <div className="relative z-10 space-y-8">
          
          {/* Channel Selector / Overview Cards */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800/60">
            <div className="flex p-1 bg-slate-950/80 rounded-xl border border-slate-800/80">
              <button
                onClick={() => setActiveChannel('overall')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                  activeChannel === 'overall'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Channels
              </button>
              <button
                onClick={() => setActiveChannel('meta')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                  activeChannel === 'meta'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Meta Ads (FB/IG)
              </button>
              <button
                onClick={() => setActiveChannel('google')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                  activeChannel === 'google'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Google Ads
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                Active Segment:
              </span>
              <span className="text-xs font-black bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-lg capitalize">
                {activeChannel === 'overall' ? 'Combined Platforms' : activeChannel === 'meta' ? 'Meta Ads Network' : 'Google Ads Network'}
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Total Ad Spend</p>
              <p className="text-lg font-black text-white mt-1">₹{Math.round(currentData.spend).toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Cost Per Lead (CPL)</p>
              <p className="text-lg font-black text-indigo-300 mt-1">
                {metrics.cpl > 0 ? `₹${Math.round(metrics.cpl).toLocaleString()}` : '₹0'}
              </p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Cost Per Demo (CPD)</p>
              <p className="text-lg font-black text-pink-300 mt-1">
                {metrics.cpd > 0 ? `₹${Math.round(metrics.cpd).toLocaleString()}` : '₹0'}
              </p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Cost Per Enrolled (CPE)</p>
              <p className="text-lg font-black text-emerald-300 mt-1">
                {metrics.cpe > 0 && metrics.cpe !== Infinity ? `₹${Math.round(metrics.cpe).toLocaleString()}` : '—'}
              </p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm col-span-2 sm:col-span-1 lg:col-span-1">
              <p className="text-[10px] text-rose-400 uppercase font-black tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Total Wasted Spend
              </p>
              <p className="text-lg font-black text-rose-400 mt-1">₹{Math.round(metrics.totalLeakCost).toLocaleString()}</p>
            </div>
          </div>

          {/* Main Funnel Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Visual Funnel (2/3 width) */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-8">
              <div>
                <h3 className="text-lg font-extrabold text-white">Conversion & Leakage Architecture</h3>
                <p className="text-xs text-slate-400 mt-1">Observe prospect progression and leaks at each phase</p>
              </div>

              {/* Vertical steps block */}
              <div className="space-y-6">
                {[
                  {
                    name: '1. Ad Impressions',
                    value: currentData.impressions,
                    unit: 'Views',
                    details: 'Views generated on ad creatives',
                    color: 'from-blue-600 to-blue-500',
                    barColor: 'bg-blue-500',
                    isTop: true,
                    rateText: 'Top of Funnel'
                  },
                  {
                    name: '2. Link Clicks',
                    value: currentData.clicks,
                    unit: 'Clicks',
                    details: 'Clicks pointing to our website',
                    color: 'from-indigo-600 to-indigo-500',
                    barColor: 'bg-indigo-500',
                    rateText: `CTR: ${metrics.ctr.toFixed(2)}%`,
                    dropRate: 100 - metrics.ctr,
                    leakCount: currentData.impressions - currentData.clicks,
                    leakLabel: 'Failed to Click',
                    leakCost: null // impressions leak has no direct cash calculation, CTR is the gauge
                  },
                  {
                    name: '3. CRM Leads Created',
                    value: currentData.leadsCRM,
                    unit: 'Leads',
                    details: 'Submitted query forms captured in CRM',
                    color: 'from-violet-600 to-violet-500',
                    barColor: 'bg-violet-500',
                    rateText: `Opt-in Rate: ${metrics.clickToLead.toFixed(1)}%`,
                    dropRate: 100 - metrics.clickToLead,
                    leakCount: metrics.leakClicks,
                    leakLabel: 'Left Landing Page',
                    leakCost: metrics.costLeakClicks
                  },
                  {
                    name: '4. Demo Attendees',
                    value: currentData.demos,
                    unit: 'Attendees',
                    details: 'Attended the training introduction webinar',
                    color: 'from-pink-600 to-pink-500',
                    barColor: 'bg-pink-500',
                    rateText: `Attendance Rate: ${metrics.leadToDemo.toFixed(1)}%`,
                    dropRate: 100 - metrics.leadToDemo,
                    leakCount: metrics.leakLeads,
                    leakLabel: 'No-show / Lost Leads',
                    leakCost: metrics.costLeakLeads
                  },
                  {
                    name: '5. Enrolled Students',
                    value: currentData.enrolled,
                    unit: 'Enrollments',
                    details: 'Paid fees and registered for training courses',
                    color: 'from-emerald-600 to-emerald-500',
                    barColor: 'bg-emerald-500',
                    rateText: `Close Rate: ${metrics.demoToEnroll.toFixed(1)}%`,
                    dropRate: 100 - metrics.demoToEnroll,
                    leakCount: metrics.leakDemos,
                    leakLabel: 'Attended, did not buy',
                    leakCost: metrics.costLeakDemos
                  }
                ].map((step, idx, arr) => {
                  const maxVal = currentData.impressions || 1
                  const scalePct = Math.max(8, (step.value / maxVal) * 100)

                  return (
                    <div key={step.name} className="relative">
                      {/* Arrow / Line connector */}
                      {idx > 0 && (
                        <div className="absolute left-6 -top-6 w-0.5 h-6 bg-slate-800 flex items-center justify-center">
                          <ArrowDown className="w-3.5 h-3.5 text-slate-600 bg-[#0b0f19] rounded-full p-0.5" />
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-2xl bg-slate-900/30 border border-slate-800/80 hover:bg-slate-900/50 transition-colors">
                        
                        {/* Circle Indicator */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} shrink-0 flex items-center justify-center shadow-lg`}>
                          <span className="text-white font-extrabold text-sm">{idx + 1}</span>
                        </div>

                        {/* Title & Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h4 className="text-sm font-bold text-white tracking-tight">{step.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-slate-200">{step.value.toLocaleString()}</span>
                              <span className="text-xs text-slate-400 font-medium">{step.unit}</span>
                            </div>
                          </div>
                          
                          <p className="text-[11px] text-slate-500 mt-0.5">{step.details}</p>

                          {/* Graphical Bar */}
                          <div className="w-full bg-slate-950/80 h-3 rounded-lg overflow-hidden border border-slate-900 mt-3">
                            <div 
                              className={`h-full rounded-r-md transition-all duration-700 ${step.barColor}`} 
                              style={{ width: `${scalePct}%` }}
                            />
                          </div>

                          {/* Conversion & Leak Details */}
                          <div className="flex flex-wrap items-center justify-between gap-4 mt-2.5 pt-2 border-t border-slate-900">
                            {/* Conversion Rate Label */}
                            <span className="text-[11px] font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
                              {step.rateText}
                            </span>

                            {/* Leak Status */}
                            {idx > 0 && step.leakCount && (
                              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                <span className="text-slate-400">
                                  {step.leakLabel}: <strong className="text-slate-300 font-bold">{step.leakCount.toLocaleString()}</strong> ({step.dropRate ? step.dropRate.toFixed(1) : 0}% drop)
                                </span>
                                {step.leakCost && step.leakCost > 0 ? (
                                  <span className="px-2 py-0.5 font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded">
                                    ₹{Math.round(step.leakCost).toLocaleString()} lost ad cash
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  )
                })}
              </div>

            </div>

            {/* Sidebar diagnosis & financials */}
            <div className="space-y-8">
              
              {/* Financial leakage list */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Wasted Spend Breakdown</h3>
                  <p className="text-xs text-slate-400 mt-1">Calculated ad cash lost in drop-off gaps</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/40 border border-slate-900">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400">Landing Page Drop-off</p>
                      <p className="text-[10px] text-slate-500">Clicks that did not opt-in</p>
                    </div>
                    <p className="text-xs font-bold text-rose-400">₹{Math.round(metrics.costLeakClicks).toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/40 border border-slate-900">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400">Webinar No-Show Leads</p>
                      <p className="text-[10px] text-slate-500">Leads that did not attend demo</p>
                    </div>
                    <p className="text-xs font-bold text-rose-400">₹{Math.round(metrics.costLeakLeads).toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/40 border border-slate-900">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400">Sales Follow-up Failures</p>
                      <p className="text-[10px] text-slate-500">Attended demo but did not enroll</p>
                    </div>
                    <p className="text-xs font-bold text-rose-400">₹{Math.round(metrics.costLeakDemos).toLocaleString()}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300">Total Lost Budget</span>
                  <span className="text-base font-black text-rose-400">₹{Math.round(metrics.totalLeakCost).toLocaleString()}</span>
                </div>

                <div className="text-[10px] text-slate-500 leading-relaxed bg-slate-950/30 p-3 rounded-xl border border-slate-900/50">
                  ⚡ **Impact Note:** Reducing landing page drop-off by just **3%** would salvage approximately **₹{(metrics.costLeakClicks * 0.15).toFixed(0)}** in ad media value.
                </div>
              </div>

              {/* Recommendations list */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Funnel Fix Actions</h3>
                </div>

                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {recommendations.map((rec, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-2xl border text-xs space-y-2.5 bg-slate-950/40 ${
                        rec.status === 'critical' 
                          ? 'border-rose-500/20' 
                          : rec.status === 'warning'
                          ? 'border-amber-500/20'
                          : 'border-emerald-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider ${
                          rec.status === 'critical'
                            ? 'bg-rose-500/15 text-rose-400'
                            : rec.status === 'warning'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-emerald-500/15 text-emerald-400'
                        }`}>
                          {rec.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">{rec.stage}</span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-200">{rec.title}</h4>
                        <p className="text-slate-400 leading-relaxed text-[11px]">{rec.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-900/80 text-[10px] text-slate-500 font-medium">
                        <span>Current Metric: <strong className="text-slate-300">{rec.value}</strong></span>
                        <span>Target: <strong className="text-slate-400">{rec.target}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Data Transparency Card */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-extrabold text-white">Data Sourcing & Authenticity Guarantee</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Learn which parameters are direct APIs and which use logical models</p>
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
                    Verified Live API Integrations (100% Real)
                  </h5>
                  <ul className="space-y-2.5 pl-4 list-disc list-outside">
                    <li>
                      <strong className="text-slate-200">Ad Views & Link Clicks:</strong> Aggregate data pulled directly from Meta Graph Ads API (including both Facebook Feed and Instagram Reels) and Google Ads API in real time.
                    </li>
                    <li>
                      <strong className="text-slate-200">CRM Leads Created:</strong> Count of unique lead records fetched dynamically from your TeleCRM client workspace database.
                    </li>
                    <li>
                      <strong className="text-slate-200">Enrolled Students & Revenue:</strong> Actual count of customers transitioning into payment states in your TeleCRM pipeline, matching exact fee values.
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h5 className="font-black text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Heuristic & Estimated Modeling
                  </h5>
                  <ul className="space-y-2.5 pl-4 list-disc list-outside">
                    <li>
                      <strong className="text-slate-200">Demo Attendees:</strong> Modeled using a standard 35% attendance multiplier of CRM leads. This estimate is applied because TeleCRM does not currently supply a reliable automated endpoint webhook tracking webinar checklist logins.
                    </li>
                    <li>
                      <strong className="text-slate-200">Leakage Financials:</strong> Wasted ad spend is modeled locally on each laptop page based on computed Cost Per Click (CPC) and Cost Per Lead (CPL) ratios for the selected date range.
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
