// app/ads/compare/page.tsx
'use client';

import React from 'react'
import { useMetaOverview, useMetaDetails } from '@/hooks/useMetaAdsData'
import { useGoogleOverview, useGoogleDetails } from '@/hooks/useGoogleAdsData'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import ComparePlatformOverview from '@/components/ads/ComparePlatformOverview'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { LayoutDashboard, Award, Sparkles, AlertCircle } from 'lucide-react'

export default function ComparePage() {
  const { data: metaOverview, loading: metaOverviewLoading, refreshing: metaOverviewRefreshing, error: metaOverviewError, refresh: refreshMetaOverview } = useMetaOverview()
  const { data: googleOverview, loading: googleOverviewLoading, refreshing: googleOverviewRefreshing, error: googleOverviewError, refresh: refreshGoogleOverview } = useGoogleOverview()
  const { trend: metaTrend, loading: metaTrendLoading } = useMetaDetails()
  const { trend: googleTrend, loading: googleTrendLoading } = useGoogleDetails()

  const isLoading = metaOverviewLoading || googleOverviewLoading || metaTrendLoading || googleTrendLoading
  const isRefreshing = metaOverviewRefreshing || googleOverviewRefreshing

  const handleRefreshAll = () => {
    refreshMetaOverview()
    refreshGoogleOverview()
  }

  // 1. Group daily spend by date for Meta vs Google side-by-side trend chart
  const comparisonTrendData = React.useMemo(() => {
    const map: Record<string, { date: string; metaSpend: number; googleSpend: number }> = {}

    metaTrend.forEach(t => {
      map[t.date] = { date: t.date, metaSpend: t.spend, googleSpend: 0 }
    })

    googleTrend.forEach(t => {
      if (map[t.date]) {
        map[t.date].googleSpend = t.spend
      } else {
        map[t.date] = { date: t.date, metaSpend: 0, googleSpend: t.spend }
      }
    })

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
  }, [metaTrend, googleTrend])

  const formatDate = (str: string) => {
    try {
      const d = new Date(str)
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    } catch {
      return str
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center shadow-md">
            <Award className="w-5 h-5 text-white animate-bounce-slow" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">Platform Comparison</h1>
            <p className="text-xs text-slate-400 mt-1">Head-to-head ad efficiency audit: Meta Ads vs Google Ads</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker />
          <RefreshBar
            loading={isLoading}
            refreshing={isRefreshing}
            onRefresh={handleRefreshAll}
          />
        </div>
      </div>

      {(metaOverviewError || googleOverviewError) && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>Error loading platform overviews. Check API credentials or offline mock parameters.</span>
        </div>
      )}

      {/* Side-by-side Efficiency Table */}
      {metaOverview && googleOverview ? (
        <ComparePlatformOverview
          meta={metaOverview}
          google={googleOverview}
        />
      ) : (
        <div className="h-96 bg-white rounded-2xl border border-slate-200 animate-pulse shadow-sm" />
      )}

      {/* Side-by-side Daily Spend Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-[340px] flex flex-col justify-between">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">Daily Investment Comparison</h4>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Head-to-head daily ad spend allocations (Meta blue vs Google cyan).</p>
        </div>

        <div className="flex-1 mt-4 min-h-0 text-[10px]">
          {comparisonTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickFormatter={formatDate} stroke="#94a3b8" fontSize={10} fontWeight={600} />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight={600} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                  labelFormatter={(lbl) => `Date: ${formatDate(lbl as string)}`}
                  formatter={(val: any, name: any) => {
                    return [`₹${Math.round(val).toLocaleString()}`, name === "metaSpend" ? "Meta Spend" : "Google Spend"]
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} 
                  formatter={(value) => value === "metaSpend" ? "Meta Ads" : "Google Ads"} 
                />
                <Bar dataKey="metaSpend" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="googleSpend" fill="#0891b2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 font-medium text-xs">
              No comparative trend data available for selected range.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
