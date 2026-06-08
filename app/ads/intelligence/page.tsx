// app/ads/intelligence/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react'
import { useDateRange } from '@/hooks/useDateRange'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import { HealthScoreCard, InsightCard } from '@/components/ads/intelligence/AdsIntelComponents'
import {
  Sparkles,
  BarChart2,
  TrendingUp,
  Target,
  Users,
  Compass,
  DollarSign,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export default function IntelligenceHubPage() {
  const { preset, from, to, label, setDateRange } = useDateRange()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      const res = await fetch(`/api/ads/intelligence/hub?${query.toString()}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to fetch Ads Intelligence Hub data')
      }

      const resData = await res.json()
      setData(resData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while fetching Ads Intelligence data')
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

  const intelDashboards = [
    { label: 'Lead Quality Attribution', href: '/ads/intelligence/lead-quality', desc: 'Campaign CPE overlaid with lead qualification categories.' },
    { label: 'Audience Intelligence', href: '/ads/intelligence/audience', desc: 'Meta age/gender splits & Google devices conversions.' },
    { label: 'Cross-Platform Attribution', href: '/ads/intelligence/attribution', desc: 'Path touchpoint analyses and multi-platform conversions.' },
    { label: 'Creative Performance', href: '/ads/intelligence/creative', desc: 'Metacreatives formats, hook angles, & fatigue decay.' },
    { label: 'Funnel Leak Detection', href: '/ads/intelligence/funnel-leak', desc: 'Entire paid user funnel drop-off leak evaluations.' },
    { label: 'Keyword Quality', href: '/ads/intelligence/keywords', desc: 'Google Search Terms mapping by Quality Scores.' },
    { label: 'Budget Pacing', href: '/ads/intelligence/budget-pacing', desc: 'Linear run-rate pace projections & linear spending.' },
    { label: 'Retargeting Intelligence', href: '/ads/intelligence/retargeting', desc: 'Audience temperature segment splits (Cold, Warm, Hot).' },
    { label: 'Placement & Format', href: '/ads/intelligence/placement', desc: 'Placement performance metrics (Feeds, Reels, Search).' },
    { label: 'Course Ad Intelligence', href: '/ads/intelligence/course-ads', desc: 'Oracle ERP course-wise blended expenses.' },
    { label: 'Performance Forecast', href: '/ads/intelligence/forecast', desc: 'Conversion what-if projection projections.' },
    { label: 'Competitor Intelligence', href: '/ads/intelligence/competitor', desc: 'Meta Ad Library monitored active assets.' },
    { label: 'Alerts & Anomalies', href: '/ads/intelligence/alerts', desc: 'Live warning alerts & pacing anomaly flags.' }
  ]

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">Marketing Intelligence Hub</h1>
            <p className="text-xs text-slate-400 mt-1">AI-driven optimizations and deep attribution overlays for Google, Meta, and TeleCRM</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker />
          <RefreshBar
            loading={loading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>Error loading Intelligence Hub: {error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-40 bg-white border border-slate-200 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-24 bg-white border border-slate-200 rounded-2xl" />
            <div className="h-24 bg-white border border-slate-200 rounded-2xl" />
          </div>
          <div className="h-60 bg-white border border-slate-200 rounded-2xl" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Health Score Component */}
          <HealthScoreCard
            score={data.health.score}
            grade={data.health.grade}
            areasToImprove={data.health.areasToImprove}
          />

          {/* Quick Metrics summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Blended True Spend</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">₹{Math.round(data.summary.totalSpend).toLocaleString()}</h4>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Enrolls</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">{data.summary.enrolledTotal} students</h4>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Cost Per Enrolled</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">
                {data.summary.cpe > 0 ? `₹${Math.round(data.summary.cpe).toLocaleString()}` : '₹0'}
              </h4>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">True Blended ROAS</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">{data.summary.trueROAS}x</h4>
            </div>
          </div>

          {/* Insights recommendations list */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Marketing Recommendations</h3>
            {data.insights.map((insight: any, idx: number) => (
              <InsightCard
                key={idx}
                type={insight.type}
                category={insight.category}
                title={insight.title}
                detail={insight.detail}
                impact={insight.impact}
                estimatedRevenueImpact={insight.estimatedRevenueImpact}
                recommendedAction={insight.recommendedAction}
              />
            ))}
          </div>

          {/* Sub-dashboards directory panel */}
          <div className="space-y-3 pt-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Specialized Analytics Dashboards</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {intelDashboards.map((dash) => (
                <Link
                  key={dash.href}
                  href={dash.href}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">{dash.label}</h4>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">{dash.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end text-[10px] font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                    <span>Explore Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
