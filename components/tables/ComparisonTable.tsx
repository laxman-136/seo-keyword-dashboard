// components/tables/ComparisonTable.tsx
'use client';

import React, { useState, useMemo } from 'react'
import { ArrowLeftRight, TrendingUp, TrendingDown, SlidersHorizontal } from 'lucide-react'
import { KeywordRow } from '@/lib/types'
import { getMovement, getVsLastMonthLabel } from '@/lib/calculations'
import GroupBadge from '../ui/GroupBadge'
import MovementBadge from '../ui/MovementBadge'
import { cn } from '@/lib/utils'

interface ComparisonTableProps {
  keywords: KeywordRow[]
  monthA: string
  monthB: string
}

export default function ComparisonTable({ keywords, monthA, monthB }: ComparisonTableProps) {
  const [filterType, setFilterType] = useState<'all' | 'improved' | 'dropped' | 'same'>('all')

  // Parse movement logic for chosen Month A vs Month B
  const processedData = useMemo(() => {
    return keywords.map(kw => {
      const dataA = kw.monthlyData[monthA] || { page: 0, position: 0 }
      const dataB = kw.monthlyData[monthB] || { page: 0, position: 0 }

      // We treat Month A as "previous/baseline" and Month B as "current/target"
      const movement = getMovement(dataB.page, dataB.position, dataA.page, dataA.position)
      const label = getVsLastMonthLabel(dataB.page, dataB.position, dataA.page, dataA.position)

      return {
        ...kw,
        pageA: dataA.page,
        posA: dataA.position,
        pageB: dataB.page,
        posB: dataB.position,
        movement,
        label
      }
    })
  }, [keywords, monthA, monthB])

  // Count summaries
  const summaries = useMemo(() => {
    let improved = 0
    let dropped = 0
    let same = 0

    processedData.forEach(kw => {
      if (kw.movement === 'Improved' || kw.movement === 'New Entry') improved++
      else if (kw.movement === 'Dropped' || kw.movement === 'Lost Ranking') dropped++
      else if (kw.movement === 'Neutral') same++
    })

    return { improved, dropped, same }
  }, [processedData])

  // Apply visual filters
  const filteredData = useMemo(() => {
    return processedData.filter(kw => {
      if (filterType === 'all') return true
      if (filterType === 'improved') return kw.movement === 'Improved' || kw.movement === 'New Entry'
      if (filterType === 'dropped') return kw.movement === 'Dropped' || kw.movement === 'Lost Ranking'
      if (filterType === 'same') return kw.movement === 'Neutral'
      return true
    })
  }, [processedData, filterType])

  return (
    <div className="space-y-6">
      {/* Visual Aggregation Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Improved count */}
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Improved Rankings</span>
            <h4 className="text-3xl font-extrabold text-emerald-600 mt-2">{summaries.improved}</h4>
          </div>
          <div className="w-12 h-12 bg-emerald-100/60 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Dropped count */}
        <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Dropped Rankings</span>
            <h4 className="text-3xl font-extrabold text-red-600 mt-2">{summaries.dropped}</h4>
          </div>
          <div className="w-12 h-12 bg-red-100/60 rounded-xl flex items-center justify-center text-red-600 shadow-sm">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Neutral count */}
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stable / Same</span>
            <h4 className="text-3xl font-extrabold text-slate-700 mt-2">{summaries.same}</h4>
          </div>
          <div className="w-12 h-12 bg-slate-200/60 rounded-xl flex items-center justify-center text-slate-500 shadow-sm">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
        {/* Filtering actions */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            Comparison Filters
          </h3>

          {/* Tab buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all",
                filterType === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Show All ({processedData.length})
            </button>
            <button
              onClick={() => setFilterType('improved')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all",
                filterType === 'improved' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Improved ({summaries.improved})
            </button>
            <button
              onClick={() => setFilterType('dropped')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all",
                filterType === 'dropped' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Dropped ({summaries.dropped})
            </button>
            <button
              onClick={() => setFilterType('same')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all",
                filterType === 'same' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Same ({summaries.same})
            </button>
          </div>
        </div>

        {/* Data list view */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider select-none">
                <th className="px-6 py-4">Keyword</th>
                <th className="px-6 py-4">Group</th>
                <th className="px-6 py-4 text-center">{monthA} Page</th>
                <th className="px-6 py-4 text-center">{monthA} Position</th>
                <th className="px-6 py-4 text-center">{monthB} Page</th>
                <th className="px-6 py-4 text-center">{monthB} Position</th>
                <th className="px-6 py-4 text-center">Ranking Shift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredData.length > 0 ? (
                filteredData.map((kw, idx) => (
                  <tr 
                    key={kw.keyword}
                    className={cn(
                      "hover:bg-slate-50/50 transition-colors",
                      idx % 2 === 1 ? 'bg-slate-50/20' : 'bg-white'
                    )}
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800 select-all">
                      {kw.keyword}
                    </td>
                    <td className="px-6 py-4">
                      <GroupBadge group={kw.group} />
                    </td>
                    
                    {/* Month A stats */}
                    <td className="px-6 py-4 font-mono font-semibold text-slate-500 text-center">
                      {kw.pageA > 0 ? kw.pageA : <span className="text-slate-300 font-light">—</span>}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-400 text-center">
                      {kw.pageA > 0 ? `#${kw.posA}` : <span className="text-slate-300 font-light">—</span>}
                    </td>

                    {/* Month B stats */}
                    <td className="px-6 py-4 font-mono font-semibold text-slate-800 text-center">
                      {kw.pageB > 0 ? kw.pageB : <span className="text-slate-300 font-light">—</span>}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-500 text-center">
                      {kw.pageB > 0 ? `#${kw.posB}` : <span className="text-slate-300 font-light">—</span>}
                    </td>

                    {/* Ranking Shift Badge */}
                    <td className="px-6 py-4 text-center">
                      <MovementBadge movement={kw.movement} label={kw.label} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium bg-slate-50/10">
                    No keyword comparison records matches the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
