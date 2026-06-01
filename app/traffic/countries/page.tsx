// app/traffic/countries/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react'
import { useTrafficData } from '@/hooks/useTrafficData'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import PeriodSelector from '@/components/traffic/PeriodSelector'
import TrafficCountryTable from '@/components/traffic/TrafficCountryTable'
import CountryTrendChart from '@/components/charts/CountryTrendChart'
import { getAvailableMonths, aggregateTrafficRows, filterByMonth, getMovementPercent } from '@/lib/calculations'
import { TRAFFIC_COUNTRIES } from '@/lib/calculations'
import { ArrowUp, ArrowDown, Minus, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const COUNTRY_FLAGS: Record<string, string> = {
  'India': '🇮🇳',
  'USA': '🇺🇸',
  'UAE': '🇦🇪',
  'Saudi Arabia': '🇸🇦',
  'Canada': '🇨🇦',
  'Pakistan': '🇵🇰',
  'United Kingdom': '🇬🇧',
  'Poland': '🇵🇱',
  'Others': '🌐'
}

export default function CountryDetailView() {
  const { rows, loading, refreshing, error, isMock, fallbackReason, lastUpdated, refresh } = useTrafficData()

  const availableMonths = useMemo(() => getAvailableMonths(rows), [rows])
  const years = useMemo(() => Array.from(new Set(rows.map(r => r.date.getFullYear()))), [rows])

  const [currentMonth, setCurrentMonth] = useState('')
  const [compareMonth, setCompareMonth] = useState('')

  // Initialize selected periods
  useEffect(() => {
    if (availableMonths.length >= 2) {
      setCurrentMonth(availableMonths[availableMonths.length - 1])
      setCompareMonth(availableMonths[availableMonths.length - 2])
    }
  }, [availableMonths])

  // Aggregate selected month data
  const monthData = useMemo(() => {
    if (!currentMonth || rows.length === 0) return null

    const curRows = filterByMonth(rows, currentMonth)
    const prevRows = compareMonth ? filterByMonth(rows, compareMonth) : []

    const currentAgg = aggregateTrafficRows(curRows)
    const previousAgg = aggregateTrafficRows(prevRows)

    return {
      current: currentAgg,
      previous: previousAgg
    }
  }, [rows, currentMonth, compareMonth])

  if (loading) {
    return <SkeletonLoader />
  }

  if (error || !monthData) {
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

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 min-h-screen">
      {/* Header Panel */}
      <Header
        title="Traffic by Country"
        currentMonth={currentMonth}
        previousMonth={compareMonth}
        lastUpdated={lastUpdated}
        isMock={isMock}
        warningText={fallbackReason}
        onRefresh={refresh}
        isRefreshing={refreshing}
      />

      {/* Selectors Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex flex-wrap items-center gap-4">
          <PeriodSelector
            mode="monthly"
            value={currentMonth}
            onChange={setCurrentMonth}
            months={availableMonths}
            years={years}
            label="Target Month"
          />
          <div className="pt-4 font-bold text-slate-350 select-none">vs</div>
          <PeriodSelector
            mode="monthly"
            value={compareMonth}
            onChange={setCompareMonth}
            months={availableMonths}
            years={years}
            label="Comparison Month"
          />
        </div>
      </div>

      {/* Breakdown Table */}
      <TrafficCountryTable
        currentCountries={monthData.current.countries}
        previousCountries={monthData.previous.countries}
      />

      {/* Line Chart */}
      <CountryTrendChart rows={rows} />

      {/* COUNTRY CARDS (3x3 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TRAFFIC_COUNTRIES.map(country => {
          const curVal = monthData.current.countries[country] || 0
          const prevVal = monthData.previous.countries[country] || 0
          const pct = getMovementPercent(curVal, prevVal)
          const diff = curVal - prevVal
          const isPositive = diff > 0
          const isNegative = diff < 0
          
          const flag = COUNTRY_FLAGS[country] || '🌐'

          return (
            <div 
              key={country} 
              className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-150"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl leading-none" role="img" aria-label={country}>
                    {flag}
                  </span>
                  <span className="text-sm font-bold text-slate-700">{country}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Geographic</span>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-800">{curVal.toLocaleString()}</span>
                
                {prevVal > 0 && (
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5",
                    isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    isNegative ? 'bg-red-50 text-red-700 border border-red-100' :
                    'bg-slate-50 text-slate-500 border border-slate-200'
                  )}>
                    {isPositive ? <ArrowUp className="w-2.5 h-2.5" /> : isNegative ? <ArrowDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                    {Math.abs(pct).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
