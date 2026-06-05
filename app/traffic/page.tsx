// app/traffic/page.tsx
'use client';

import React, { useState, useMemo } from 'react'
import { useTrafficPeriod } from '@/hooks/useTrafficData'
import { useDailyTrafficData } from '@/hooks/useDailyTrafficData'
import { TrafficRow, TrafficSource, TrafficCountry } from '@/lib/types'
import { cn } from '@/lib/utils'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import TrafficKPICard from '@/components/traffic/TrafficKPICard'
import TotalUsersTrendChart from '@/components/charts/TotalUsersTrendChart'
import SourceTrendChart from '@/components/charts/SourceTrendChart'
import TrafficSourceTable from '@/components/traffic/TrafficSourceTable'
import TrafficCountryTable from '@/components/traffic/TrafficCountryTable'
import TrafficMoMTable from '@/components/traffic/TrafficMoMTable'
import TrafficPeriodSummary from '@/components/traffic/TrafficPeriodSummary'
import SourceDonutChart from '@/components/charts/SourceDonutChart'
import CountryDonutChart from '@/components/charts/CountryDonutChart'
import TrafficQuarterlyTable from '@/components/traffic/TrafficQuarterlyTable'
import TrafficYearlyTable from '@/components/traffic/TrafficYearlyTable'
import { getQuarterlyBreakdown, getYearlyBreakdown } from '@/lib/calculations'
import { Users, UserPlus, Compass, Globe, Info } from 'lucide-react'

export default function TrafficOverview() {
  const [timeframe, setTimeframe] = useState<'monthly' | 'daily'>('monthly')

  const monthlyTraffic = useTrafficPeriod('monthly')
  const dailyTraffic = useDailyTrafficData()

  // Map daily rows to TrafficRow shape (date string goes to month property)
  const mappedDailyRows = useMemo((): TrafficRow[] => {
    return dailyTraffic.rows.map(r => {
      const { UK, ...otherCountries } = r.countries
      return {
        ...r,
        month: r.date, // Map date to month so X-axis split works
        date: new Date(r.date), // Convert string date to Date object
        countries: {
          ...otherCountries,
          'United Kingdom': UK
        } as Record<import('@/lib/types').TrafficCountry, number>
      }
    })
  }, [dailyTraffic.rows])

  const dailyPeriod = useMemo(() => {
    if (mappedDailyRows.length === 0) return null

    const len = mappedDailyRows.length
    const currentRaw = mappedDailyRows[len - 1]
    const previousRaw = len > 1 ? mappedDailyRows[len - 2] : currentRaw

    // Calculate top source
    let topSource: TrafficSource = 'Organic'
    let maxSourceVal = -1
    Object.entries(currentRaw.sources || {}).forEach(([src, val]) => {
      if (val > maxSourceVal) {
        maxSourceVal = val
        topSource = src as TrafficSource
      }
    })

    // Calculate top country
    let topCountry: TrafficCountry = 'India'
    let maxCountryVal = -1
    Object.entries(currentRaw.countries || {}).forEach(([c, val]) => {
      if (val > maxCountryVal) {
        maxCountryVal = val
        topCountry = c as TrafficCountry
      }
    })

    return {
      current: {
        ...currentRaw,
        topSource,
        topCountry
      },
      previous: {
        ...previousRaw,
        topSource: 'Organic' as TrafficSource,
        topCountry: 'India' as TrafficCountry
      },
      currentLabel: currentRaw.month,
      previousLabel: previousRaw.month
    }
  }, [mappedDailyRows])

  const activeData = timeframe === 'monthly' ? {
    period: monthlyTraffic.period,
    rows: monthlyTraffic.rows,
    loading: monthlyTraffic.loading,
    refreshing: monthlyTraffic.refreshing,
    error: monthlyTraffic.error,
    isMock: monthlyTraffic.isMock,
    fallbackReason: monthlyTraffic.fallbackReason,
    lastUpdated: monthlyTraffic.lastUpdated,
    refresh: monthlyTraffic.refresh
  } : {
    period: dailyPeriod,
    rows: mappedDailyRows,
    loading: dailyTraffic.loading,
    refreshing: dailyTraffic.refreshing,
    error: dailyTraffic.error,
    isMock: dailyTraffic.isMock,
    fallbackReason: dailyTraffic.fallbackReason,
    lastUpdated: dailyTraffic.lastUpdated,
    refresh: dailyTraffic.refresh
  }

  const {
    period,
    rows,
    loading,
    refreshing,
    error,
    isMock,
    fallbackReason,
    lastUpdated,
    refresh
  } = activeData

  const quarterlyBreakdown = useMemo(() => {
    return timeframe === 'monthly' ? getQuarterlyBreakdown(rows) : []
  }, [rows, timeframe])

  const yearlyBreakdown = useMemo(() => {
    return timeframe === 'monthly' ? getYearlyBreakdown(rows) : []
  }, [rows, timeframe])

  if (loading) {
    return <SkeletonLoader />
  }

  if (error || !period) {
    return (
      <div className="p-4 sm:p-6 flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen">
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-red-100 shadow-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-6 shadow-md shadow-red-100">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Connection Failure</h2>
          <p className="text-slate-400 text-sm mt-3">
            Unable to establish connection with Google Sheets API.
          </p>
          <div className="bg-red-950/5 border border-red-900/10 px-4 py-3 rounded-xl text-xs text-red-800 text-left font-mono mt-5 w-full break-all">
            {error || 'Traffic initialization failed.'}
          </div>
          <button
            onClick={() => refresh()}
            className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all w-full"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  const { current, previous, currentLabel, previousLabel } = period

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8 min-h-screen">
      {/* Header Panel */}
      <Header
        title={timeframe === 'monthly' ? "Traffic Analytics (Monthly)" : "Traffic Analytics (Daily)"}
        currentMonth={currentLabel}
        previousMonth={previousLabel}
        lastUpdated={lastUpdated}
        isMock={isMock}
        warningText={fallbackReason}
        onRefresh={refresh}
        isRefreshing={refreshing}
      />

      {/* Timeframe Toggle Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 no-print">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTimeframe('monthly')}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all",
              timeframe === 'monthly'
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            🗓️ Monthly Traffic
          </button>
          <button
            onClick={() => setTimeframe('daily')}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all",
              timeframe === 'daily'
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            ⚡ Daily Traffic
          </button>
        </div>

        {timeframe === 'daily' && (
          <span className="text-xs text-slate-400 font-semibold">
            Automated GA4 Sync: Enabled (Updates daily)
          </span>
        )}
      </div>

      {/* ROW 1: KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <TrafficKPICard
          title="Total Users"
          value={current.totalUsers}
          prevValue={previous.totalUsers}
          icon={Users}
        />
        <TrafficKPICard
          title="New Users"
          value={current.newUsers}
          prevValue={previous.newUsers}
          icon={UserPlus}
        />
        <TrafficKPICard
          title="Top Acquisition Source"
          value={current.topSource}
          isText={true}
          icon={Compass}
        />
        <TrafficKPICard
          title="Top Traffic Country"
          value={current.topCountry}
          isText={true}
          icon={Globe}
        />
      </div>

      {/* ROW 2: TREND CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <TotalUsersTrendChart rows={rows} />
        <SourceTrendChart rows={rows} variant="organic-direct-bar" />
      </div>

      {/* ROW 3: TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <TrafficSourceTable
          currentSources={current.sources}
          previousSources={previous.sources}
        />
        <TrafficCountryTable
          currentCountries={current.countries}
          previousCountries={previous.countries}
        />
      </div>

      {/* ROW 4: COMPARISON TABLE + PERIOD SUMMARY */}
      {timeframe === 'monthly' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <TrafficMoMTable current={current} previous={previous} />
            <TrafficPeriodSummary data={quarterlyBreakdown} />
          </div>

          {/* ROW 5: PIE CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <SourceDonutChart sources={current.sources} />
            <CountryDonutChart countries={current.countries} />
          </div>

          {/* ROW 6: OVERVIEW TABLES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <TrafficQuarterlyTable data={quarterlyBreakdown} />
            <TrafficYearlyTable data={yearlyBreakdown} />
          </div>
        </>
      ) : (
        <>
          {/* ROW 5: PIE CHARTS FOR DAILY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <SourceDonutChart sources={current.sources} />
            <CountryDonutChart countries={current.countries} />
          </div>
        </>
      )}
    </div>
  )
}
