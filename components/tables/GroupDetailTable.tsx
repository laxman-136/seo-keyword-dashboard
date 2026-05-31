// components/tables/GroupDetailTable.tsx
'use client';

import React from 'react'
import { ProcessedKeyword, PageBand } from '@/lib/types'
import PageBandBadge from '../ui/PageBandBadge'
import MovementBadge from '../ui/MovementBadge'
import { cn } from '@/lib/utils'

interface GroupDetailTableProps {
  keywords: ProcessedKeyword[]
}

export default function GroupDetailTable({ keywords }: GroupDetailTableProps) {
  
  // Custom mapping to color-code rows based on their ranking PageBands
  const getRowBgColor = (band: PageBand): string => {
    switch (band) {
      case 'P1 Top (1-4)':
        return 'bg-emerald-50/40 hover:bg-emerald-50/60 border-l-4 border-l-emerald-500'
      case 'P1 Good (5-10)':
        return 'bg-blue-50/30 hover:bg-blue-50/50 border-l-4 border-l-blue-500'
      case 'Page 2':
        return 'bg-amber-50/40 hover:bg-amber-50/60 border-l-4 border-l-amber-500'
      case 'Page 3':
        return 'bg-orange-50/40 hover:bg-orange-50/60 border-l-4 border-l-orange-500'
      case 'Page 4+':
        return 'bg-red-50/40 hover:bg-red-50/60 border-l-4 border-l-red-500'
      default:
        return 'bg-slate-50/40 hover:bg-slate-50/60 border-l-4 border-l-slate-400'
    }
  }

  // Status badge helper
  const StatusBadge = ({ status }: { status: string }) => {
    const isGood = status === 'Ranking Well'
    const isNeeds = status === 'Needs Work'

    return (
      <span className={cn(
        "px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wide uppercase inline-block text-center shadow-sm",
        isGood ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
        isNeeds ? 'bg-amber-50 text-amber-700 border-amber-200' :
        'bg-slate-50 text-slate-500 border-slate-200'
      )}>
        {status}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider select-none">
              <th className="px-6 py-4">Keyword</th>
              <th className="px-6 py-4">Rank (Page / Pos)</th>
              <th className="px-6 py-4">Page Band</th>
              <th className="px-6 py-4">vs Last Month</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {keywords.length > 0 ? (
              keywords.map((kw) => (
                <tr 
                  key={kw.keyword} 
                  className={cn(
                    "transition-colors duration-150",
                    getRowBgColor(kw.pageBand)
                  )}
                >
                  <td className="px-6 py-4 font-semibold text-slate-800 select-all">
                    {kw.keyword}
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-600">
                    {kw.currentPage > 0 ? (
                      <span>Page {kw.currentPage} <span className="text-slate-400 font-semibold">(#{kw.currentPosition})</span></span>
                    ) : (
                      <span className="text-slate-300 font-normal">— Not Ranking</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <PageBandBadge band={kw.pageBand} />
                  </td>
                  <td className="px-6 py-4">
                    <MovementBadge movement={kw.movement} label={kw.vsLastMonthLabel} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={kw.status} />
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      kw.priority === 'High' ? 'bg-red-100 text-red-700' :
                      kw.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    )}>
                      {kw.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate" title={kw.notes}>
                    {kw.notes || <span className="text-slate-300 font-light">No notes</span>}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400 font-medium bg-slate-50/10">
                  No keywords assigned to this training course group.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
