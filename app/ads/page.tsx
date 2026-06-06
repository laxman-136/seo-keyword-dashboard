// app/ads/page.tsx
'use client';

import React, { useState, useEffect } from 'react'
import { useAdsOverview } from '@/hooks/useAdsOverview'
import { useMetaDetails } from '@/hooks/useMetaAdsData'
import { useGoogleDetails } from '@/hooks/useGoogleAdsData'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import BudgetAlertBanner from '@/components/ads/BudgetAlertBanner'
import AdPerformanceMetrics from '@/components/ads/AdPerformanceMetrics'
import CombinedOverviewCharts from '@/components/ads/CombinedOverviewCharts'
import PrepaidBalanceCard from '@/components/ads/PrepaidBalanceCard'
import { getActiveConfig, SheetConfig } from '@/lib/config'
import { LayoutDashboard, ArrowRight, Sparkles, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function AdsOverviewPage() {
  const { data: overview, loading: overviewLoading, refreshing: overviewRefreshing, error, refresh } = useAdsOverview()
  const { trend: metaTrend, loading: metaLoading } = useMetaDetails()
  const { trend: googleTrend, loading: googleLoading } = useGoogleDetails()
  const [activeConfig, setActiveConfig] = useState<SheetConfig | null>(null)

  useEffect(() => {
    setActiveConfig(getActiveConfig())
  }, [])

  const isLoading = overviewLoading || metaLoading || googleLoading

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">Unified Ads Performance</h1>
            <p className="text-xs text-slate-400 mt-1">Cross-platform marketing analytics for Google and Meta Ads</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker />
          <RefreshBar
            loading={isLoading}
            refreshing={overviewRefreshing}
            lastUpdated={overview?.lastRefreshedAt}
            onRefresh={refresh}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>Error loading Ads Overview: {error}</span>
        </div>
      )}

      {/* Budget Warning Banner */}
      {overview && <BudgetAlertBanner alerts={overview.budgetAlerts} />}

      {/* Prepaid Balance Monitor */}
      {overview && (
        <PrepaidBalanceCard
          platform="combined"
          spend={overview.totalSpend}
          metaPrepaid={activeConfig?.metaPrepaidBalance}
          googlePrepaid={activeConfig?.googlePrepaidBalance}
          metaSpend={overview.metaSpend}
          googleSpend={overview.googleSpend}
        />
      )}

      {/* Overview Metrics Cards */}
      {overview ? (
        <AdPerformanceMetrics
          metrics={{
            spend: overview.totalSpend,
            impressions: overview.totalImpressions,
            clicks: overview.totalClicks,
            ctr: overview.overallCTR,
            cpc: overview.overallCPC,
            conversions: overview.totalConversions,
            leads: overview.totalLeads,
            cpl: overview.avgCostPerLead
          }}
          platform="combined"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse shadow-sm" />
          ))}
        </div>
      )}

      {/* Charts Section */}
      {overview && (
        <CombinedOverviewCharts
          metaTrend={metaTrend}
          googleTrend={googleTrend}
          metaSpend={overview.metaSpend}
          googleSpend={overview.googleSpend}
        />
      )}

      {/* Platform Drilldowns Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meta Link Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h3 className="text-sm font-extrabold text-slate-800">Meta Ads Manager</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
              Demographics, Facebook / Instagram placement breakdowns, ad set targetings, and ad creatives.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            {overview && (
              <span className="text-xs font-bold text-slate-700 font-mono">
                Spend: ₹{Math.round(overview.metaSpend).toLocaleString()}
              </span>
            )}
            <Link
              href="/ads/meta"
              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:translate-x-0.5 transition-all select-none"
            >
              <span>Manage Meta campaigns</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Google Link Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
              <h3 className="text-sm font-extrabold text-slate-800">Google Ads Manager</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
              Quality Scores lookup, device conversions split, geographical insights, search queries flags, and ad groups.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            {overview && (
              <span className="text-xs font-bold text-slate-700 font-mono">
                Spend: ₹{Math.round(overview.googleSpend).toLocaleString()}
              </span>
            )}
            <Link
              href="/ads/google"
              className="flex items-center gap-1 text-[10px] font-bold text-cyan-600 hover:text-cyan-700 hover:translate-x-0.5 transition-all select-none"
            >
              <span>Manage Google campaigns</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
