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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          Traffic by Country
        </h4>
        <span className="text-xs text-slate-400 font-semibold">
          Sorted by volume
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider select-none">
              <th className="px-6 py-3.5 w-12 text-center">#</th>
              <th 
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-all"
                onClick={() => handleSort('country')}
              >
                <div className="flex items-center gap-1">
                  Country
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th 
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-all"
                onClick={() => handleSort('users')}
              >
                <div className="flex items-center gap-1">
                  Current Users
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th 
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-all"
                onClick={() => handleSort('share')}
              >
                <div className="flex items-center gap-1">
                  Share %
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="px-6 py-3.5">Previous</th>
              <th className="px-6 py-3.5">Δ Absolute</th>
              <th 
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-all text-center"
                onClick={() => handleSort('change')}
              >
                <div className="flex items-center gap-1 justify-center">
                  Change %
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {processedData.map((row, idx) => {
              const isPositive = row.absolute > 0
              const isNegative = row.absolute < 0
              
              return (
                <tr key={row.country} className={cn("hover:bg-slate-50/50 transition-colors", idx % 2 === 1 ? 'bg-slate-50/20' : 'bg-white')}>
                  <td className="px-6 py-3.5 text-center text-slate-400 font-semibold font-mono">{idx + 1}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-lg leading-none shrink-0" role="img" aria-label={row.country}>
                      {row.flag}
                    </span>
                    <span>{row.country}</span>
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-slate-700">{row.current.toLocaleString()}</td>
                  <td className="px-6 py-3.5 font-mono font-medium text-slate-600">{row.share.toFixed(1)}%</td>
                  <td className="px-6 py-3.5 text-slate-500">{row.previous.toLocaleString()}</td>
                  <td className={cn(
                    "px-6 py-3.5 font-medium font-mono",
                    isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-slate-400'
                  )}>
                    {isPositive ? `+${row.absolute.toLocaleString()}` : row.absolute.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs font-bold font-mono tracking-wide",
                      isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      isNegative ? 'bg-red-50 text-red-700 border border-red-100' :
                      'bg-slate-50 text-slate-500 border border-slate-200'
                    )}>
                      {isPositive ? `+${row.percent.toFixed(1)}%` : `${row.percent.toFixed(1)}%`}
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
