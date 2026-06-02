// components/traffic/TrafficCountryTable.tsx
'use client';

import React, { useState, useMemo } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { TrafficCountry } from '@/lib/types'
import { TRAFFIC_COUNTRIES, getMovementPercent } from '@/lib/calculations'
import { cn } from '@/lib/utils'

interface TrafficCountryTableProps {
  currentCountries: Record<TrafficCountry, number>
  previousCountries: Record<TrafficCountry, number>
}

type SortField = 'country' | 'users' | 'share' | 'change'
type SortOrder = 'asc' | 'desc'

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

export default function TrafficCountryTable({
  currentCountries,
  previousCountries
}: TrafficCountryTableProps) {
  const [sortField, setSortField] = useState<SortField>('users')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const totalCurrent = useMemo(() => {
    return TRAFFIC_COUNTRIES.reduce((sum, c) => sum + (currentCountries[c] || 0), 0)
  }, [currentCountries])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const processedData = useMemo(() => {
    const data = TRAFFIC_COUNTRIES.map(c => {
      const cur = currentCountries[c] || 0
      const prev = previousCountries[c] || 0
      const diff = cur - prev
      const pct = getMovementPercent(cur, prev)
      const share = totalCurrent > 0 ? (cur / totalCurrent) * 100 : 0

      return {
        country: c,
        flag: COUNTRY_FLAGS[c] || '',
        current: cur,
        previous: prev,
        absolute: diff,
        percent: pct,
        share
      }
    })

    // Sort
    data.sort((a, b) => {
      let comparison = 0
      if (sortField === 'country') {
        comparison = a.country.localeCompare(b.country)
      } else if (sortField === 'users') {
        comparison = a.current - b.current
      } else if (sortField === 'share') {
        comparison = a.share - b.share
      } else if (sortField === 'change') {
        comparison = a.percent - b.percent
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return data
  }, [currentCountries, previousCountries, totalCurrent, sortField, sortOrder])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between">
        <h4 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
          Traffic by Country
        </h4>
        <span className="text-[10px] sm:text-xs text-slate-400 font-semibold hidden sm:inline">
          Sorted by volume
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-full table-auto">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider select-none">
              <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 w-8 sm:w-12 text-center text-[10px]">#</th>
              <th 
                className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-all"
                onClick={() => handleSort('country')}
              >
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <span className="text-[10px] sm:text-xs">Country</span>
                  <ArrowUpDown className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 flex-shrink-0 hidden sm:block" />
                </div>
              </th>
              <th 
                className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-all text-right"
                onClick={() => handleSort('users')}
              >
                <div className="flex items-center gap-0.5 sm:gap-1 justify-end">
                  <span className="text-[10px] sm:text-xs">Users</span>
                  <ArrowUpDown className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 flex-shrink-0 hidden sm:block" />
                </div>
              </th>
              <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 hidden sm:table-cell text-right">
                <span className="text-[10px] sm:text-xs">Share %</span>
              </th>
              <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 hidden md:table-cell text-right">
                <span className="text-[10px] sm:text-xs">Previous</span>
              </th>
              <th 
                className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-all text-center hidden sm:table-cell"
                onClick={() => handleSort('change')}
              >
                <div className="flex items-center gap-0.5 sm:gap-1 justify-center">
                  <span className="text-[10px] sm:text-xs">Δ %</span>
                  <ArrowUpDown className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 flex-shrink-0 hidden sm:block" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {processedData.map((row, idx) => {
              const isPositive = row.absolute > 0
              const isNegative = row.absolute < 0
              
              return (
                <tr key={row.country} className={cn("hover:bg-slate-50/50 transition-colors", idx % 2 === 1 ? 'bg-slate-50/20' : 'bg-white')}>
                  <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 text-center text-slate-400 font-semibold font-mono text-[10px]">{idx + 1}</td>
                  <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 font-bold text-slate-800 flex items-center gap-1.5 sm:gap-2">
                    <span className="text-base sm:text-lg leading-none shrink-0" role="img" aria-label={row.country}>
                      {row.flag}
                    </span>
                    <span className="text-[10px] sm:text-sm truncate">{row.country}</span>
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 font-semibold text-slate-700 text-right text-[10px] sm:text-sm">{row.current.toLocaleString()}</td>
                  <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 font-mono font-medium text-slate-600 hidden sm:table-cell text-right text-[10px]">{row.share.toFixed(0)}%</td>
                  <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 text-slate-500 hidden md:table-cell text-right text-[10px]">{row.previous.toLocaleString()}</td>
                  <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 text-center hidden sm:table-cell">
                    <span className={cn(
                      "px-1 sm:px-2 py-0.5 rounded text-[9px] sm:text-xs font-bold font-mono tracking-wide",
                      isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      isNegative ? 'bg-red-50 text-red-700 border border-red-100' :
                      'bg-slate-50 text-slate-500 border border-slate-200'
                    )}>
                      {isPositive ? `+${row.percent.toFixed(0)}%` : `${row.percent.toFixed(0)}%`}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
