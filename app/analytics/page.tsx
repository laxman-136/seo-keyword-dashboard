// app/analytics/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react'
import { useDateRange } from '@/hooks/useDateRange'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import {
  GA4KPICard,
  GA4TrendChart,
  GeoTable,
  DeviceDonutChart
} from '@/components/analytics/GA4Components'
import {
  BarChart2,
  Users,
  MousePointer,
  Hourglass,
  Percent,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function GA4OverviewPage() {
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

      const res = await fetch(`/api/analytics/overview?${query.toString()}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to fetch GA4 overview data')
      }

      const resData = await res.json()
      setData(resData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while fetching GA4 data')
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
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">Website Analytics Overview</h1>
            <p className="text-xs text-slate-400 mt-1">Real-time user engagement and landing page conversions via Google Analytics 4</p>
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
          <span>Error loading GA4 Overview: {error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse shadow-sm" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[380px] bg-white border border-slate-200 rounded-2xl animate-pulse shadow-sm" />
            <div className="h-[380px] bg-white border border-slate-200 rounded-2xl animate-pulse shadow-sm" />
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GA4KPICard
              title="Sessions"
              value={data.overview.sessions.toLocaleString()}
              delta={
                data.overview.prevSessions > 0
                  ? parseFloat((((data.overview.sessions - data.overview.prevSessions) / data.overview.prevSessions) * 100).toFixed(1))
                  : undefined
              }
              subText="vs previous period"
              icon={<Users className="w-4.5 h-4.5 text-blue-600" />}
            />
            <GA4KPICard
              title="Bounce Rate"
              value={`${data.overview.bounceRate}%`}
              delta={
                data.overview.prevBounceRate > 0
                  ? parseFloat((data.overview.bounceRate - data.overview.prevBounceRate).toFixed(1))
                  : undefined
              }
              subText="vs previous period"
              reverseColor={true}
              icon={<Percent className="w-4.5 h-4.5 text-indigo-600" />}
            />
            <GA4KPICard
              title="Avg Session Duration"
              value={`${Math.floor(data.overview.avgSessionDuration / 60)}m ${data.overview.avgSessionDuration % 60}s`}
              subText="Average user visit duration"
              icon={<Hourglass className="w-4.5 h-4.5 text-cyan-600" />}
            />
            <GA4KPICard
              title="Conversions"
              value={data.overview.conversions.toLocaleString()}
              delta={
                data.overview.prevConversions > 0
                  ? parseFloat((((data.overview.conversions - data.overview.prevConversions) / data.overview.prevConversions) * 100).toFixed(1))
                  : undefined
              }
              subText="Goal form submissions"
              icon={<CheckCircle className="w-4.5 h-4.5 text-emerald-600" />}
            />
          </div>

          {/* Trend Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <GA4TrendChart trendData={data.trendData} />
            </div>
            <div>
              <DeviceDonutChart devices={data.deviceData} />
            </div>
          </div>

          {/* Geo section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GeoTable geo={data.geoData} />
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-800">Returning User Engagement</h4>
                <p className="text-xs text-slate-400">Comparison of brand awareness and returning user behavior</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">New Users</span>
                  <h3 className="text-2xl font-extrabold text-slate-700 mt-1">{data.overview.newUsers.toLocaleString()}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {data.overview.totalUsers > 0
                      ? `${Math.round((data.overview.newUsers / data.overview.totalUsers) * 100)}%`
                      : '0%'} of total audience
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Returning Users</span>
                  <h3 className="text-2xl font-extrabold text-slate-700 mt-1">{data.overview.returningUsers.toLocaleString()}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {data.overview.totalUsers > 0
                      ? `${Math.round((data.overview.returningUsers / data.overview.totalUsers) * 100)}%`
                      : '0%'} of total audience
                  </p>
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-6 pt-4 border-t border-slate-100 leading-normal">
                💡 Returning users show a significantly higher conversion rate than first-time visitors. Leverage retargeting campaigns to capture warm returning traffic.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
