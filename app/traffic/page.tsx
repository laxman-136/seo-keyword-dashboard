// app/traffic/page.tsx
'use client';

import React from 'react'
import { useTrafficPeriod } from '@/hooks/useTrafficData'
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
  } = useTrafficPeriod('monthly')

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
  const quarterlyBreakdown = getQuarterlyBreakdown(rows)
  const yearlyBreakdown = getYearlyBreakdown(rows)

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 min-h-screen">
      {/* Header Panel */}
      <Header
        title="Traffic Analytics"
        currentMonth={currentLabel}
        previousMonth={previousLabel}
        lastUpdated={lastUpdated}
        isMock={isMock}
        warningText={fallbackReason}
        onRefresh={refresh}
        isRefreshing={refreshing}
      />

      {/* ROW 1: KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TotalUsersTrendChart rows={rows} />
        <SourceTrendChart rows={rows} variant="organic-direct-bar" />
      </div>

      {/* ROW 3: TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficMoMTable current={current} previous={previous} />
        <TrafficPeriodSummary data={quarterlyBreakdown} />
      </div>

      {/* ROW 5: PIE CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SourceDonutChart sources={current.sources} />
        <CountryDonutChart countries={current.countries} />
      </div>

      {/* ROW 6: OVERVIEW TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficQuarterlyTable data={quarterlyBreakdown} />
        <TrafficYearlyTable data={yearlyBreakdown} />
      </div>
    </div>
  )
}
