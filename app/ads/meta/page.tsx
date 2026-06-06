// app/ads/meta/page.tsx
'use client';

import React, { useState, useEffect } from 'react'
import { useMetaOverview, useMetaCampaigns, useMetaDetails } from '@/hooks/useMetaAdsData'
import PrepaidBalanceCard from '@/components/ads/PrepaidBalanceCard'
import { getActiveConfig, SheetConfig } from '@/lib/config'
import { useMetricsConfig } from '@/hooks/useMetricsConfig'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import AdPerformanceMetrics from '@/components/ads/AdPerformanceMetrics'
import MetaCampaignTable from '@/components/ads/MetaCampaignTable'
import MetricCustomizer from '@/components/ads/MetricCustomizer'
import ActiveCampaignsMonitor from '@/components/ads/ActiveCampaignsMonitor'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { LayoutDashboard, ArrowRight, Smartphone, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function MetaAdsPage() {
  const { data: overview, loading: overviewLoading, refreshing: overviewRefreshing, error: overviewError, refresh: refreshOverview } = useMetaOverview()
  const { campaigns, loading: campaignsLoading, refreshing: campaignsRefreshing, error: campaignsError, refresh: refreshCampaigns } = useMetaCampaigns()
  const { placements, demographics, loading: detailsLoading, refreshing: detailsRefreshing, error: detailsError, refresh: refreshDetails } = useMetaDetails()
  const [activeConfig, setActiveConfig] = useState<SheetConfig | null>(null)

  useEffect(() => {
    setActiveConfig(getActiveConfig())
  }, [])

  const { allMetrics, visibleMetricIds, toggleMetric } = useMetricsConfig('meta_dashboard', 'meta')

  const isLoading = overviewLoading || campaignsLoading || detailsLoading
  const isRefreshing = overviewRefreshing || campaignsRefreshing || detailsRefreshing

  const handleRefreshAll = () => {
    refreshOverview()
    refreshCampaigns()
    refreshDetails()
  }

  const activeMetrics = allMetrics.filter(m => visibleMetricIds.includes(m.id))

  // Demographic Chart parsing
  const demoChartData = React.useMemo(() => {
    if (!demographics?.ageGender) return []
    // Combine gender values per age group
    const groups: Record<string, { age: string; maleConvs: number; femaleConvs: number }> = {}
    demographics.ageGender.forEach(row => {
      if (!groups[row.age]) {
        groups[row.age] = { age: row.age, maleConvs: 0, femaleConvs: 0 }
      }
      if (row.gender === 'male') groups[row.age].maleConvs += row.conversions
      if (row.gender === 'female') groups[row.age].femaleConvs += row.conversions
    })
    return Object.values(groups)
  }, [demographics])

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
            <span className="text-white font-extrabold text-lg select-none">f</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">Meta Ads Performance</h1>
            <p className="text-xs text-slate-400 mt-1">Facebook, Instagram, Messenger, and Audience Network campaigns insights</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker />
          <RefreshBar
            loading={isLoading}
            refreshing={isRefreshing}
            lastUpdated={overview?.lastRefreshedAt}
            onRefresh={handleRefreshAll}
          />
        </div>
      </div>

      {(overviewError || campaignsError || detailsError) && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>Error syncing Meta ad sets. Please review connection status.</span>
        </div>
      )}

      {/* Prepaid Balance Monitor */}
      {overview && (
        <PrepaidBalanceCard
          platform="meta"
          spend={overview.spend}
          prepaidBalance={activeConfig?.metaPrepaidBalance}
        />
      )}

      {/* KPI metrics cards */}
      {overview ? (
        <AdPerformanceMetrics
          metrics={{
            spend: overview.spend,
            impressions: overview.impressions,
            clicks: overview.clicks,
            ctr: overview.ctr,
            cpc: overview.cpc,
            conversions: overview.totalConversions,
            leadFormFills: overview.leadFormFills,
            websiteLeads: overview.websiteLeads,
            costPerLeadForm: overview.costPerLeadForm,
            costPerWebsiteLead: overview.costPerWebsiteLead
          }}
          platform="meta"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse shadow-sm" />
          ))}
        </div>
      )}

      {/* Breakdowns section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demographics Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-[320px] flex flex-col justify-between">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">Leads Demographics Split</h4>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Distribution of lead conversions across age bands and gender.</p>
          </div>

          <div className="flex-1 mt-4 min-h-0 text-[10px]">
            {demoChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demoChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="age" stroke="#94a3b8" fontSize={10} fontWeight={600} />
                  <YAxis stroke="#94a3b8" fontSize={10} fontWeight={600} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="maleConvs" name="Male leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="femaleConvs" name="Female leads" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium text-xs">
                Loading demographics details...
              </div>
            )}
          </div>
        </div>

        {/* Placement Placements split list */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-[320px] flex flex-col justify-between">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">Placement Performance Breakdown</h4>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">CTR and cost efficiency split by publication platform.</p>
          </div>

          <div className="flex-1 mt-4 overflow-y-auto space-y-3 pr-1">
            {placements?.placements ? (
              placements.placements.map((row, idx) => (
                <div key={idx} className="flex items-center justify-between border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-700 truncate">{row.placement}</span>
                      <span className="block text-[9px] text-slate-400 font-medium">CTR: {row.ctr.toFixed(2)}%</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-xs font-extrabold text-slate-800">₹{Math.round(row.spend).toLocaleString()}</span>
                    <span className="block text-[9px] font-extrabold text-emerald-600 mt-0.5">{row.conversions} Leads</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium text-xs">
                Loading placement details...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Campaigns Live Monitor */}
      {overview && campaigns && (
        <ActiveCampaignsMonitor campaigns={campaigns} platform="meta" />
      )}

      {/* Spreadsheet / Campaigns Card */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Campaign Spreadsheet</span>
          <div className="flex items-center gap-3">
            <MetricCustomizer
              allMetrics={allMetrics}
              visibleMetricIds={visibleMetricIds}
              onToggle={toggleMetric}
            />
            <Link
              href="/ads/meta/campaigns"
              className="flex items-center gap-1 text-[10px] font-extrabold text-blue-600 hover:text-blue-700 hover:translate-x-0.5 transition-all select-none"
            >
              <span>Drill-down Campaigns</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <MetaCampaignTable
          campaigns={campaigns}
          visibleMetrics={activeMetrics}
        />
      </div>
    </div>
  )
}
