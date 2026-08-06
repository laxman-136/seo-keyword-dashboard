// app/traffic/page.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react'
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
import { Users, UserPlus, Compass, Globe, Info, RefreshCw } from 'lucide-react'

export default function TrafficOverview() {
  const [timeframe, setTimeframe] = useState<'monthly' | 'daily'>('monthly')
  const [syncing, setSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  
  const [selectedCurrentMonth, setSelectedCurrentMonth] = useState('')
  const [selectedCompareMonth, setSelectedCompareMonth] = useState('')

  const monthlyTraffic = useTrafficPeriod('monthly', selectedCurrentMonth || undefined, selectedCompareMonth || undefined)
  const dailyTraffic = useDailyTrafficData()

  const monthsList = useMemo(() => {
    return (monthlyTraffic.rows || []).map(r => r.month)
  }, [monthlyTraffic.rows])

  useEffect(() => {
    if (monthsList.length > 0 && !selectedCurrentMonth && !selectedCompareMonth) {
      setSelectedCurrentMonth(monthsList[monthsList.length - 1])
      setSelectedCompareMonth(monthsList.length >= 2 ? monthsList[monthsList.length - 2] : monthsList[monthsList.length - 1])
    }
  }, [monthsList, selectedCurrentMonth, selectedCompareMonth])

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

  const handleSyncGa4Monthly = async () => {
    setSyncing(true)
    setSyncSuccess(false)
    setSyncError(null)

    try {
      const clientSeoSheetId = localStorage.getItem('client-seo-sheet-id')
      const apiKey = localStorage.getItem('client-api-key')

      if (!clientSeoSheetId || clientSeoSheetId === 'mock') {
        throw new Error('SEO Spreadsheet ID is not configured.')
      }

      const res = await fetch('/api/traffic/sync-ga4-monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seoSheetId: clientSeoSheetId,
          apiKey,
          gaPropertyId: localStorage.getItem('client-ga-property-id') || undefined,
          gaClientEmail: localStorage.getItem('client-ga-client-email') || undefined,
          gaPrivateKey: localStorage.getItem('client-ga-private-key') || undefined
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')

      setSyncSuccess(true)
      await activeData.refresh()
      setTimeout(() => setSyncSuccess(false), 5000)
    } catch (err: any) {
      setSyncError(err.message || 'Error syncing GA4 monthly traffic.')
      setTimeout(() => setSyncError(null), 5000)
    } finally {
      setSyncing(false)
    }
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

        {timeframe === 'monthly' && (
          <div className="flex flex-wrap items-center gap-3">
            {monthsList.length > 0 && (
              <>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <span>Current:</span>
                  <select
                    value={selectedCurrentMonth}
                    onChange={e => setSelectedCurrentMonth(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none font-bold text-xs"
                  >
                    {monthsList.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <span>Compare vs:</span>
                  <select
                    value={selectedCompareMonth}
                    onChange={e => setSelectedCompareMonth(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none font-bold text-xs"
                  >
                    {monthsList.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              {syncing && (
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
                  Syncing GA4...
                </span>
              )}
              {syncSuccess && (
                <span className="text-xs text-emerald-600 font-semibold">
                  ✓ GA4 Sync completed!
                </span>
              )}
              {syncError && (
                <span className="text-xs text-red-500 font-semibold">
                  ⚠ {syncError}
                </span>
              )}
              <button
                onClick={handleSyncGa4Monthly}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 text-xs font-bold rounded-xl transition-all border border-indigo-200 disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3 h-3", syncing && "animate-spin")} />
                Sync GA4 Monthly Traffic
              </button>
            </div>
          </div>
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
