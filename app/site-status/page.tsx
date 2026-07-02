// app/site-status/page.tsx
'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import { useSiteStatusData } from '@/hooks/useSiteStatusData'
import { SiteStatusPageRow, TrafficSource, TrafficCountry } from '@/lib/types'
import { TrendingUp, TrendingDown, Minus, Calendar, ChevronDown, ShieldCheck, Link2, Globe, BarChart3, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MonthInfo {
  label: string; // "July-2024"
  year: number;
  monthIdx: number;
  quarterLabel: string; // "Q3-2024"
  yearLabel: string; // "2024"
}

function parseMonthString(m: string): MonthInfo {
  const parts = m.split('-')
  const mName = parts[0].trim().toLowerCase()
  const year = parseInt(parts[1].trim(), 10) || 2024
  const monthsMap: Record<string, number> = {
    january: 0, jan: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
    may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, september: 8,
    oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
  }
  const monthIdx = monthsMap[mName] ?? 0
  const quarter = Math.floor(monthIdx / 3) + 1
  return {
    label: m,
    year,
    monthIdx,
    quarterLabel: `Q${quarter}-${year}`,
    yearLabel: `${year}`
  }
}

// Quarterly data aggregation (taking the LATEST month's score for each quarter)
function getQuarterlyData(row: SiteStatusPageRow, parsedMonths: MonthInfo[]) {
  const quarters: Record<string, { latestMonth: MonthInfo; data: any }> = {}
  
  parsedMonths.forEach(m => {
    const qKey = m.quarterLabel
    const data = row.monthlyData?.[m.label]
    if (!data) return
    
    if (!quarters[qKey] || (m.year > quarters[qKey].latestMonth.year) || (m.year === quarters[qKey].latestMonth.year && m.monthIdx > quarters[qKey].latestMonth.monthIdx)) {
      quarters[qKey] = {
        latestMonth: m,
        data
      }
    }
  })
  
  return quarters
}

// Yearly data aggregation (taking the LATEST month's score for each year)
function getYearlyData(row: SiteStatusPageRow, parsedMonths: MonthInfo[]) {
  const years: Record<string, { latestMonth: MonthInfo; data: any }> = {}
  
  parsedMonths.forEach(m => {
    const yKey = m.yearLabel
    const data = row.monthlyData?.[m.label]
    if (!data) return
    
    if (!years[yKey] || m.monthIdx > years[yKey].latestMonth.monthIdx) {
      years[yKey] = {
        latestMonth: m,
        data
      }
    }
  })
  
  return years
}

export default function SiteStatusPage() {
  const { rows, months, loading, refreshing, isMock, fallbackReason, lastUpdated, refresh } = useSiteStatusData()
  const [expandedPage, setExpandedPage] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')

  // Dropdown states for selected periods
  const [selectedCurrentMonth, setSelectedCurrentMonth] = useState('')
  const [selectedCompareMonth, setSelectedCompareMonth] = useState('')

  const [selectedCurrentQuarter, setSelectedCurrentQuarter] = useState('')
  const [selectedCompareQuarter, setSelectedCompareQuarter] = useState('')

  const [selectedCurrentYear, setSelectedCurrentYear] = useState('')
  const [selectedCompareYear, setSelectedCompareYear] = useState('')

  // Parse all months chronologically
  const parsedMonths = useMemo(() => {
    return (months || []).map(parseMonthString).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.monthIdx - b.monthIdx
    })
  }, [months])

  const chronologicalMonthsList = useMemo(() => {
    return parsedMonths.map(m => m.label)
  }, [parsedMonths])

  // Get unique list of quarters sorted chronologically
  const quartersList = useMemo(() => {
    const set = new Set<string>()
    parsedMonths.forEach(m => set.add(m.quarterLabel))
    return Array.from(set).sort((a, b) => {
      const partsA = a.split('-'), partsB = b.split('-')
      const qA = parseInt(partsA[0].replace('Q', ''), 10)
      const yA = parseInt(partsA[1], 10)
      const qB = parseInt(partsB[0].replace('Q', ''), 10)
      const yB = parseInt(partsB[1], 10)
      if (yA !== yB) return yA - yB
      return qA - qB
    })
  }, [parsedMonths])

  // Get unique list of years sorted chronologically
  const yearsList = useMemo(() => {
    const set = new Set<string>()
    parsedMonths.forEach(m => set.add(m.yearLabel))
    return Array.from(set).sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
  }, [parsedMonths])

  // Initialize selected values
  useEffect(() => {
    if (chronologicalMonthsList.length > 0) {
      setSelectedCurrentMonth(chronologicalMonthsList[chronologicalMonthsList.length - 1])
      setSelectedCompareMonth(chronologicalMonthsList.length >= 2 ? chronologicalMonthsList[chronologicalMonthsList.length - 2] : chronologicalMonthsList[chronologicalMonthsList.length - 1])
    }
  }, [chronologicalMonthsList])

  useEffect(() => {
    if (quartersList.length > 0) {
      setSelectedCurrentQuarter(quartersList[quartersList.length - 1])
      setSelectedCompareQuarter(quartersList.length >= 2 ? quartersList[quartersList.length - 2] : quartersList[quartersList.length - 1])
    }
  }, [quartersList])

  useEffect(() => {
    if (yearsList.length > 0) {
      setSelectedCurrentYear(yearsList[yearsList.length - 1])
      setSelectedCompareYear(yearsList.length >= 2 ? yearsList[yearsList.length - 2] : yearsList[yearsList.length - 1])
    }
  }, [yearsList])

  if (loading) return <SkeletonLoader />

  if (!rows || rows.length === 0) {
    return <div className="p-8 text-center text-slate-400 font-semibold">No site status data available.</div>
  }

  // Current and comparison period labels based on selected timeframe
  const currentPeriod = timeframe === 'monthly' ? selectedCurrentMonth :
                        timeframe === 'quarterly' ? selectedCurrentQuarter : selectedCurrentYear

  const comparePeriod = timeframe === 'monthly' ? selectedCompareMonth :
                        timeframe === 'quarterly' ? selectedCompareQuarter : selectedCompareYear

  const metricsOrder = ['domainRating', 'backlinks', 'referringDomains', 'da', 'pa']
  
  const metricLabel: Record<string, string> = {
    domainRating: 'Domain Rating (DR)',
    backlinks: 'Backlinks',
    referringDomains: 'Referring Domains',
    da: 'DA',
    pa: 'PA'
  }

  const fmt = (v: any) => (v === undefined || v === null || v === '') ? '—' : (typeof v === 'number' ? v.toLocaleString() : String(v))

  const calculateChange = (current: any, previous: any) => {
    if (typeof current !== 'number' || typeof previous !== 'number') return null
    return current - previous
  }

  const renderChangeIndicator = (change: number | null) => {
    if (change === null) return <span className="text-slate-400 text-xs">No Data</span>
    if (change > 0) return (
      <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 rounded-xl py-1 px-2.5 text-xs font-mono shadow-sm">
        <TrendingUp className="w-3.5 h-3.5" />
        +{change.toLocaleString()}
      </div>
    )
    if (change < 0) return (
      <div className="flex items-center justify-center gap-1 text-red-600 font-bold bg-red-50 border border-red-100 rounded-xl py-1 px-2.5 text-xs font-mono shadow-sm">
        <TrendingDown className="w-3.5 h-3.5" />
        {change.toLocaleString()}
      </div>
    )
    return (
      <div className="flex items-center justify-center gap-1 text-slate-500 font-semibold bg-slate-100 border border-slate-200 rounded-xl py-1 px-2.5 text-xs font-mono">
        <Minus className="w-3.5 h-3.5" />
        0
      </div>
    )
  }

  // Retrieve data for a page and specific period label
  const getPeriodData = (row: SiteStatusPageRow, label: string) => {
    if (!label) return null
    if (timeframe === 'monthly') {
      return row.monthlyData?.[label]
    } else if (timeframe === 'quarterly') {
      const qData = getQuarterlyData(row, parsedMonths)
      return qData[label]?.data
    } else {
      const yData = getYearlyData(row, parsedMonths)
      return yData[label]?.data
    }
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8 min-h-screen">
      <Header
        title="Site Status Reports"
        currentMonth={currentPeriod}
        previousMonth={comparePeriod}
        lastUpdated={lastUpdated}
        isMock={isMock}
        warningText={fallbackReason}
        onRefresh={refresh}
        isRefreshing={refreshing}
      />

      {/* Timeframe Toggle and Dropdowns Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm no-print">
        {/* Toggle Mode */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setTimeframe('monthly')}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all",
              timeframe === 'monthly' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            🗓️ Monthly MoM
          </button>
          <button
            onClick={() => setTimeframe('quarterly')}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all",
              timeframe === 'quarterly' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            📊 Quarterly
          </button>
          <button
            onClick={() => setTimeframe('yearly')}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all",
              timeframe === 'yearly' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            📅 Yearly
          </button>
        </div>

        {/* Dropdown Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {timeframe === 'monthly' && chronologicalMonthsList.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <span>Current:</span>
                <select
                  value={selectedCurrentMonth}
                  onChange={e => setSelectedCurrentMonth(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none font-bold"
                >
                  {chronologicalMonthsList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <span>Compare vs:</span>
                <select
                  value={selectedCompareMonth}
                  onChange={e => setSelectedCompareMonth(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none font-bold"
                >
                  {chronologicalMonthsList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {timeframe === 'quarterly' && quartersList.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <span>Current:</span>
                <select
                  value={selectedCurrentQuarter}
                  onChange={e => setSelectedCurrentQuarter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none font-bold"
                >
                  {quartersList.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <span>Compare vs:</span>
                <select
                  value={selectedCompareQuarter}
                  onChange={e => setSelectedCompareQuarter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none font-bold"
                >
                  {quartersList.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {timeframe === 'yearly' && yearsList.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <span>Current:</span>
                <select
                  value={selectedCurrentYear}
                  onChange={e => setSelectedCurrentYear(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none font-bold"
                >
                  {yearsList.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <span>Compare vs:</span>
                <select
                  value={selectedCompareYear}
                  onChange={e => setSelectedCompareYear(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none font-bold"
                >
                  {yearsList.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pages Reports Cards Stack */}
      <div className="space-y-4 sm:space-y-6">
        {rows.map((row: SiteStatusPageRow) => {
          const prevData = getPeriodData(row, comparePeriod)
          const currData = getPeriodData(row, currentPeriod)

          // Gather historical trend list for the detail table
          const historyTableRows = parsedMonths.map(m => {
            let label = m.label
            let val = row.monthlyData?.[label]
            
            if (timeframe === 'quarterly') {
              label = m.quarterLabel
              const qData = getQuarterlyData(row, parsedMonths)
              val = qData[label]?.data
            } else if (timeframe === 'yearly') {
              label = m.yearLabel
              const yData = getYearlyData(row, parsedMonths)
              val = yData[label]?.data
            }
            return { label, val }
          }).filter((v, idx, self) => self.findIndex(t => t.label === v.label) === idx && v.val !== undefined)

          return (
            <div key={row.page} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              {/* Card Header Accordion Trigger */}
              <button
                onClick={() => setExpandedPage(expandedPage === row.page ? null : row.page)}
                className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors rounded-t-2xl text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">{row.page}</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      {timeframe === 'monthly' ? 'Month-over-Month Comparisons' : timeframe === 'quarterly' ? 'Quarterly SEO Progress' : 'Year-over-Year SEO Progress'}
                    </p>
                  </div>
                </div>
                <div className={cn("p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 bg-white transition-all shadow-sm", expandedPage === row.page && "bg-slate-50 text-slate-600")}>
                  <ChevronDown className={cn("w-4.5 h-4.5 transition-transform", expandedPage === row.page && "rotate-180")} />
                </div>
              </button>

              {/* Accordion Content */}
              {expandedPage === row.page && (
                <div className="border-t border-slate-100 bg-slate-50/20 p-4 sm:p-6 space-y-6 sm:space-y-8">
                  {/* Period Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                    {metricsOrder.map(metric => {
                      // Determine the period before comparePeriod for 3-month comparison
                      const currentList = timeframe === 'monthly' ? chronologicalMonthsList :
                                          timeframe === 'quarterly' ? quartersList : yearsList
                      
                      const compareIdx = currentList.indexOf(comparePeriod)
                      const prevComparePeriod = compareIdx > 0 ? currentList[compareIdx - 1] : null
                      
                      const prevCompareData = prevComparePeriod ? getPeriodData(row, prevComparePeriod) : null
                      
                      const prevCompareVal = prevCompareData ? (prevCompareData as any)?.[metric] : null
                      const prevVal = (prevData as any)?.[metric]
                      const currVal = (currData as any)?.[metric]
                      
                      const changeLatest = calculateChange(currVal, prevVal)
                      const changeOverall = (prevCompareVal !== null && prevCompareVal !== undefined) ? calculateChange(currVal, prevCompareVal) : null

                      // Extract short month name (e.g. "Apr" from "April-2026")
                      const getShortLabel = (lbl: string) => {
                        if (!lbl) return ''
                        const parts = lbl.split('-')
                        return parts[0].slice(0, 3) + (parts[1] ? `-${parts[1]}` : '')
                      }

                      return (
                        <div key={metric} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3.5 flex flex-col justify-between hover:border-slate-300 transition-colors">
                          <div>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{metricLabel[metric]}</p>
                            
                            <div className="mt-3.5 space-y-2">
                              {prevComparePeriod && (
                                <div className="flex justify-between items-baseline text-[10px] sm:text-xs">
                                  <span className="text-slate-400 font-semibold">{prevComparePeriod}</span>
                                  <span className="font-semibold text-slate-500">{fmt(prevCompareVal)}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-baseline text-[10px] sm:text-xs">
                                <span className="text-slate-400 font-semibold">{comparePeriod}</span>
                                <span className="font-semibold text-slate-500">{fmt(prevVal)}</span>
                              </div>
                              <div className="flex justify-between items-baseline text-[10px] sm:text-xs border-t border-slate-100/50 pt-1.5 mt-1.5">
                                <span className="text-indigo-600 font-bold">{currentPeriod}</span>
                                <span className="text-sm sm:text-base font-black text-indigo-600">{fmt(currVal)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Delta metrics showing MoM and overall changes */}
                          <div className="pt-3 border-t border-slate-100/60 space-y-2">
                            {prevComparePeriod && (
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{getShortLabel(prevComparePeriod)} ➔ {getShortLabel(currentPeriod)}:</span>
                                {renderChangeIndicator(changeOverall)}
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{getShortLabel(comparePeriod)} ➔ {getShortLabel(currentPeriod)}:</span>
                              {renderChangeIndicator(changeLatest)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Historical Trend Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-500" />
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Historical SEO Trend Analysis</h4>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[600px] table-auto">
                        <thead>
                          <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider select-none">
                            <th className="px-5 py-3 w-1/6">Period</th>
                            {metricsOrder.map(m => (
                              <th key={m} className="px-5 py-3 text-right">{metricLabel[m]}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                          {historyTableRows.map((histRow, idx) => {
                            const prevHist = idx > 0 ? historyTableRows[idx - 1].val : null
                            return (
                              <tr key={histRow.label} className="hover:bg-slate-50/40 transition-colors">
                                <td className="px-5 py-3 font-bold text-slate-700">{histRow.label}</td>
                                {metricsOrder.map(metric => {
                                  const val = (histRow.val as any)?.[metric]
                                  const prevMetricVal = (prevHist as any)?.[metric]
                                  const delta = calculateChange(val, prevMetricVal)
                                  
                                  return (
                                    <td key={metric} className="px-5 py-3 text-right font-semibold">
                                      <div className="flex items-center justify-end gap-2">
                                        <span className="text-slate-800">{fmt(val)}</span>
                                        {idx > 0 && delta !== null && (
                                          <span className={cn(
                                            "text-[10px] font-bold font-mono px-1 rounded",
                                            delta > 0 ? "text-emerald-600 bg-emerald-50" : delta < 0 ? "text-red-600 bg-red-50" : "text-slate-400"
                                          )}>
                                            {delta > 0 ? `+${delta}` : delta}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  )
                                })}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
