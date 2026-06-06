// app/ads/google/campaigns/page.tsx
'use client';

import React from 'react'
import { useGoogleCampaigns } from '@/hooks/useGoogleAdsData'
import { useMetricsConfig } from '@/hooks/useMetricsConfig'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import GoogleCampaignTable from '@/components/ads/GoogleCampaignTable'
import MetricCustomizer from '@/components/ads/MetricCustomizer'
import { ArrowLeft, Sparkles, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function GoogleCampaignsExplorerPage() {
  const { campaigns, loading, refreshing, error, refresh } = useGoogleCampaigns()
  const { allMetrics, visibleMetricIds, toggleMetric } = useMetricsConfig('google_campaigns_explorer', 'google')

  const activeMetrics = allMetrics.filter(m => visibleMetricIds.includes(m.id))

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/ads/google"
            className="p-2 bg-white border border-slate-200 hover:border-slate-350 rounded-xl shadow-xs text-slate-500 hover:text-slate-700 transition-all outline-none"
            title="Back to Google Dashboard"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">Google Campaigns Explorer</h1>
            <p className="text-xs text-slate-400 mt-1">Deep-dive campaign audit: expand rows to inspect ad groups & responsive ads</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <MetricCustomizer
            allMetrics={allMetrics}
            visibleMetricIds={visibleMetricIds}
            onToggle={toggleMetric}
          />
          <DateRangePicker />
          <RefreshBar
            loading={loading}
            refreshing={refreshing}
            onRefresh={refresh}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>Error loading campaigns structure: {error}</span>
        </div>
      )}

      {/* Main Campaign Spreadsheet */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1 text-xs text-slate-400 font-medium">
          <Sparkles className="w-4 h-4 text-cyan-500" />
          <span>Click on any campaign row to drill down into its ad groups and targeted responsive search ads.</span>
        </div>
        
        <GoogleCampaignTable
          campaigns={campaigns}
          visibleMetrics={activeMetrics}
        />
      </div>
    </div>
  )
}
