'use client'

import React, { useState } from 'react'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import { useSiteStatusData } from '@/hooks/useSiteStatusData'
import { SiteStatusPageRow } from '@/lib/types'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function SiteStatusPage() {
  const { rows, months, loading, refreshing, isMock, fallbackReason, lastUpdated, refresh } = useSiteStatusData()
  const [expandedPage, setExpandedPage] = useState<string | null>(null)

  if (loading) return <SkeletonLoader />

  if (!rows || rows.length === 0) return <div className="p-8 text-center text-slate-400 font-semibold">No site status data available.</div>

  // Determine months to display (use the last two)
  const monthsList = months && months.length > 0 ? months : []
  const latestMonth = monthsList[monthsList.length - 1]
  const prevMonth = monthsList.length >= 2 ? monthsList[monthsList.length - 2] : latestMonth

  const metricsOrder = ['domainRating', 'backlinks', 'referringDomains', 'da', 'pa']
  const metricLabel: Record<string, string> = {
    domainRating: 'Domain Rating',
    backlinks: 'Backlinks',
    referringDomains: 'Referring Domains',
    da: 'DA',
    pa: 'PA'
  }

  const fmt = (v: any) => (v === undefined || v === null || v === '') ? '—' : (typeof v === 'number' ? v.toLocaleString() : String(v))

  // Calculate change between months
  const calculateChange = (current: any, previous: any) => {
    if (typeof current !== 'number' || typeof previous !== 'number') return null
    return current - previous
  }

  const renderChangeIndicator = (change: number | null) => {
    if (change === null) return <span className="text-slate-400 text-xs">No Data</span>
    if (change > 0) return (
      <div className="flex items-center justify-center gap-1 text-emerald-600 font-semibold bg-emerald-50 rounded-lg py-1 px-2 text-sm">
        <TrendingUp className="w-4 h-4" />
        +{change}
      </div>
    )
    if (change < 0) return (
      <div className="flex items-center justify-center gap-1 text-red-600 font-semibold bg-red-50 rounded-lg py-1 px-2 text-sm">
        <TrendingDown className="w-4 h-4" />
        {change}
      </div>
    )
    return (
      <div className="flex items-center justify-center gap-1 text-slate-500 bg-slate-100 rounded-lg py-1 px-2 text-sm">
        <Minus className="w-4 h-4" />
        0
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto p-8 space-y-6 min-h-screen">
      <Header
        title="Site Status"
        currentMonth={latestMonth}
        previousMonth={prevMonth}
        lastUpdated={lastUpdated}
        isMock={isMock}
        warningText={fallbackReason}
        onRefresh={refresh}
        isRefreshing={refreshing}
      />

      <div className="space-y-4">
        {rows.map((row: SiteStatusPageRow) => (
          <div key={row.page} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            {/* Card Header */}
            <button
              onClick={() => setExpandedPage(expandedPage === row.page ? null : row.page)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-t-xl"
            >
              <h3 className="text-sm font-bold text-slate-800">{row.page}</h3>
              <svg
                className={`w-5 h-5 text-slate-400 transition-transform ${expandedPage === row.page ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {/* Card Content - Expanded */}
            {expandedPage === row.page && (
              <div className="border-t border-slate-100 p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {metricsOrder.map(metric => {
                    const prevVal = (row.monthlyData?.[prevMonth] as any)?.[metric]
                    const currVal = (row.monthlyData?.[latestMonth] as any)?.[metric]
                    const change = calculateChange(currVal, prevVal)

                    return (
                      <div key={metric} className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{metricLabel[metric]}</p>
                        
                        {/* Month Comparison */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs text-slate-500">{prevMonth}</span>
                            <span className="text-sm font-semibold text-slate-700">{fmt(prevVal)}</span>
                          </div>
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs text-slate-500">{latestMonth}</span>
                            <span className="text-lg font-bold text-slate-900">{fmt(currVal)}</span>
                          </div>
                        </div>

                        {/* Change Indicator */}
                        <div className="pt-2 border-t border-slate-200">
                          {renderChangeIndicator(change)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
