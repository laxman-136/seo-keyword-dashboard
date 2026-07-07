// app/ads/google/page.tsx
'use client';

import React, { useState, useEffect } from 'react'
import { useGoogleOverview, useGoogleCampaigns, useGoogleDetails, useGoogleKeywords, useGoogleSearchTerms } from '@/hooks/useGoogleAdsData'
import PrepaidBalanceCard from '@/components/ads/PrepaidBalanceCard'
import { getActiveConfig, SheetConfig } from '@/lib/config'
import { useMetricsConfig } from '@/hooks/useMetricsConfig'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import AdPerformanceMetrics from '@/components/ads/AdPerformanceMetrics'
import GoogleCampaignTable from '@/components/ads/GoogleCampaignTable'
import GoogleKeywordsTable from '@/components/ads/GoogleKeywordsTable'
import GoogleSearchTermsTable from '@/components/ads/GoogleSearchTermsTable'
import MetricCustomizer from '@/components/ads/MetricCustomizer'
import ActiveCampaignsMonitor from '@/components/ads/ActiveCampaignsMonitor'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { LayoutDashboard, ArrowRight, MapPin, Tablet, Laptop, Smartphone, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function GoogleAdsPage() {
  const { data: overview, loading: overviewLoading, refreshing: overviewRefreshing, error: overviewError, refresh: refreshOverview } = useGoogleOverview()
  const { campaigns, loading: campaignsLoading, refreshing: campaignsRefreshing, error: campaignsError, refresh: refreshCampaigns } = useGoogleCampaigns()
  const { devices, locations, loading: detailsLoading, refreshing: detailsRefreshing, error: detailsError, refresh: refreshDetails } = useGoogleDetails()
  const { keywords, loading: keywordsLoading } = useGoogleKeywords()
  const { searchTerms, loading: searchTermsLoading } = useGoogleSearchTerms()
  const [activeConfig, setActiveConfig] = useState<SheetConfig | null>(null)

  useEffect(() => {
    setActiveConfig(getActiveConfig())
  }, [])

  const { allMetrics, visibleMetricIds, toggleMetric } = useMetricsConfig('google_dashboard', 'google')

  const isLoading = overviewLoading || campaignsLoading || detailsLoading || keywordsLoading || searchTermsLoading
  const isRefreshing = overviewRefreshing || campaignsRefreshing || detailsRefreshing

  const handleRefreshAll = () => {
    refreshOverview()
    refreshCampaigns()
    refreshDetails()
  }

  const activeMetrics = allMetrics.filter(m => visibleMetricIds.includes(m.id))

  // Device donut split mapping
  const deviceData = React.useMemo(() => {
    if (!devices?.devices) return []
    const totalSpend = devices.devices.reduce((sum, d) => sum + d.spend, 0)
    return devices.devices.map(d => ({
      name: d.device,
      value: d.spend,
      percent: totalSpend > 0 ? (d.spend / totalSpend) * 100 : 0
    }))
  }, [devices])

  const DEVICE_COLORS: Record<string, string> = {
    MOBILE: '#06b6d4',
    DESKTOP: '#3b82f6',
    TABLET: '#8b5cf6'
  }

  const getDeviceIcon = (device: string) => {
    if (device === 'DESKTOP') return <Laptop className="w-4 h-4 text-slate-400" />
    if (device === 'TABLET') return <Tablet className="w-4 h-4 text-slate-400" />
    return <Smartphone className="w-4 h-4 text-slate-400" />
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center shadow-md">
            <span className="text-white font-extrabold text-lg select-none">G</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">Google Ads Performance</h1>
            <p className="text-xs text-slate-400 mt-1">Search, Display, Performance Max, and Video networks intelligence</p>
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
          <span>Error syncing Google campaigns. Please review connection status.</span>
        </div>
      )}

      {/* Prepaid Balance Monitor */}
      {overview && (
        <PrepaidBalanceCard
          platform="google"
          spend={overview.spendSinceStart !== undefined && overview.spendSinceStart > 0 ? overview.spendSinceStart : overview.spend}
          prepaidBalance={overview.totalDeposits !== undefined && overview.totalDeposits > 0 ? overview.totalDeposits : activeConfig?.googlePrepaidBalance}
        />
      )}

      {/* KPI Cards */}
      {overview ? (
        <AdPerformanceMetrics
          metrics={{
            spend: overview.spend,
            impressions: overview.impressions,
            clicks: overview.clicks,
            ctr: overview.ctr,
            cpc: overview.avgCpc,
            conversions: overview.conversions,
            leads: overview.formSubmissions,
            cpl: overview.costPerConversion
          }}
          platform="google"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse shadow-sm" />
          ))}
        </div>
      )}

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device breakdown Donut */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-[320px] flex flex-col justify-between relative">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">Devices Traffic Split</h4>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Allocation of Google ad spend by user device type.</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
            {deviceData.length > 0 ? (
              <>
                <div className="w-full h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={58}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {deviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={DEVICE_COLORS[entry.name] || '#64748b'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px'
                        }}
                        formatter={(val: any) => `₹${Math.round(val).toLocaleString()}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Device legends */}
                <div className="space-y-1.5 w-full mt-2">
                  {deviceData.map(d => (
                    <div key={d.name} className="flex items-center justify-between text-xs py-0.5 border border-transparent rounded-lg">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {getDeviceIcon(d.name)}
                        <span className="font-bold text-slate-600 truncate capitalize">{d.name.toLowerCase()}</span>
                      </div>
                      <span className="text-slate-500 font-extrabold text-[10px] font-mono">
                        ₹{Math.round(d.value).toLocaleString()} ({d.percent.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-slate-400 font-medium text-xs">Loading device data...</div>
            )}
          </div>
        </div>

        {/* Geo locations split list */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-[320px] flex flex-col justify-between lg:col-span-2">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">Geographical Leads Splits</h4>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Conversion volume and cost allocations split by city.</p>
          </div>

          <div className="flex-1 mt-4 overflow-y-auto space-y-2.5 pr-1 max-h-[220px]">
            {locations?.locations ? (
              locations.locations.slice(0, 5).map((row, idx) => (
                <div key={idx} className="flex items-center justify-between border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-700 truncate">{row.city}, {row.state}</span>
                      <span className="block text-[9px] text-slate-400 font-medium">Clicks: {row.clicks.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-xs font-extrabold text-slate-850">₹{Math.round(row.spend).toLocaleString()}</span>
                    <span className="block text-[9px] font-extrabold text-emerald-600 mt-0.5">{row.conversions} conversions</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium text-xs">
                Loading geographical details...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Campaigns Live Monitor */}
      {overview && campaigns && (
        <ActiveCampaignsMonitor campaigns={campaigns} platform="google" />
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
              href="/ads/google/campaigns"
              className="flex items-center gap-1 text-[10px] font-extrabold text-cyan-600 hover:text-cyan-700 hover:translate-x-0.5 transition-all select-none"
            >
              <span>Drill-down Campaigns</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <GoogleCampaignTable
          campaigns={campaigns}
          visibleMetrics={activeMetrics}
        />
      </div>

      {/* Keywords & Search Terms Report split */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GoogleKeywordsTable keywords={keywords} />
        <GoogleSearchTermsTable searchTerms={searchTerms} />
      </div>
    </div>
  )
}
