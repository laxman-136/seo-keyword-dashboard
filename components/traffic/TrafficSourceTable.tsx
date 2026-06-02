// components/traffic/TrafficSourceTable.tsx
'use client';

import React, { useState, useMemo } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { TrafficSource } from '@/lib/types'
import { TRAFFIC_SOURCES, getMovementPercent } from '@/lib/calculations'
import { cn } from '@/lib/utils'

interface TrafficSourceTableProps {
  currentSources: Record<TrafficSource, number>
  previousSources: Record<TrafficSource, number>
}

type SortField = 'source' | 'users' | 'share' | 'change'
type SortOrder = 'asc' | 'desc'

const SOURCE_COLORS: Record<TrafficSource, string> = {
  'Organic':       'bg-emerald-500',
  'Direct':        'bg-blue-500',
  'Social':        'bg-purple-500',
  'Video':         'bg-red-500',
  'Referral':      'bg-amber-500',
  'Paid Search':   'bg-cyan-500',
  'Cross Network': 'bg-pink-500',
  'Display':       'bg-lime-500',
  'Email':         'bg-orange-500',
  'Unassigned':    'bg-slate-400',
}

export default function TrafficSourceTable({
  currentSources,
  previousSources
}: TrafficSourceTableProps) {
  const [sortField, setSortField] = useState<SortField>('users')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const totalCurrent = useMemo(() => {
    return TRAFFIC_SOURCES.reduce((sum, s) => sum + (currentSources[s] || 0), 0)
  }, [currentSources])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc') // Default to high-to-low
    }
  }

  const processedData = useMemo(() => {
    const data = TRAFFIC_SOURCES.map(s => {
      const cur = currentSources[s] || 0
      const prev = previousSources[s] || 0
      const diff = cur - prev
      const pct = getMovementPercent(cur, prev)
      const share = totalCurrent > 0 ? (cur / totalCurrent) * 100 : 0

      return {
        source: s,
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
      if (sortField === 'source') {
        comparison = a.source.localeCompare(b.source)
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
  }, [currentSources, previousSources, totalCurrent, sortField, sortOrder])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          Traffic Acquisition Channels
        </h4>
        <span className="text-xs text-slate-400 font-semibold">
          Sorted by volume
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-full table-auto">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider select-none">
              <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 w-8 sm:w-12 text-center text-[10px] sm:text-xs">#</th>
              <th 
                className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-all"
                onClick={() => handleSort('source')}
              >
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <span className="text-[10px] sm:text-xs">Source</span>
                  <ArrowUpDown className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 flex-shrink-0" />
                </div>
              </th>
              <th 
                className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-all"
                onClick={() => handleSort('users')}
              >
                <div className="flex items-center gap-0.5 sm:gap-1 justify-end">
                  <span className="text-[10px] sm:text-xs">Current</span>
                  <ArrowUpDown className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 flex-shrink-0 hidden sm:block" />
                </div>
              </th>
              <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 hidden md:table-cell text-right">
                <span className="text-[10px] sm:text-xs">Previous</span>
              </th>
              <th 
                className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-all text-center hidden sm:table-cell"
                onClick={() => handleSort('change')}
              >
                <div className="flex items-center gap-0.5 sm:gap-1 justify-center">
                  <span className="text-[10px] sm:text-xs">Change %</span>
                  <ArrowUpDown className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 flex-shrink-0 hidden sm:block" />
                </div>
              </th>
              <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 min-w-[80px] sm:min-w-[120px]">
                <span className="text-[10px] sm:text-xs hidden sm:inline">Share Visual</span>
                <span className="text-[10px] sm:hidden">Share</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {processedData.map((row, idx) => {
              const isPositive = row.absolute > 0
              const isNegative = row.absolute < 0
              
              return (
                <tr key={row.source} className={cn("hover:bg-slate-50/50 transition-colors", idx % 2 === 1 ? 'bg-slate-50/20' : 'bg-white')}>
                  <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 text-center text-slate-400 font-semibold font-mono text-[10px] sm:text-xs">{idx + 1}</td>
                  <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 font-bold text-slate-800 text-[10px] sm:text-sm">{row.source}</td>
                  <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 font-semibold text-slate-700 text-right text-[10px] sm:text-sm">{row.current.toLocaleString()}</td>
                  <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 text-slate-500 hidden md:table-cell text-right text-[10px]">{row.previous.toLocaleString()}</td>
                  <td className={cn(
                    "px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5 font-medium font-mono hidden sm:table-cell text-center text-[10px]",
                    isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-slate-400'
                  )}>
                    <span className={cn(
                      "px-1 sm:px-2 py-0.5 rounded text-[9px] sm:text-xs font-bold font-mono tracking-wide",
                      isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      isNegative ? 'bg-red-50 text-red-700 border border-red-100' :
                      'bg-slate-50 text-slate-500 border border-slate-200'
                    )}>
                      {isPositive ? `+${row.percent.toFixed(1)}%` : `${row.percent.toFixed(1)}%`}
                    </span>
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] sm:text-xs font-mono font-medium text-slate-600 w-8">{row.share.toFixed(0)}%</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-1 sm:h-1.5 overflow-hidden min-w-[40px]">
                        <div className={cn("h-1 sm:h-1.5 rounded-full", SOURCE_COLORS[row.source])} style={{ width: `${row.share}%` }}></div>
                      </div>
                    </div>
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
