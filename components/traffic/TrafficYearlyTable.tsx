// components/traffic/TrafficYearlyTable.tsx
import React from 'react'
import { YearlyData } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TrafficYearlyTableProps {
  data: YearlyData[]
}

export default function TrafficYearlyTable({ data }: TrafficYearlyTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-100">
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          Yearly Summary
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Historical annual totals and Year-over-Year (YoY) performance shifts
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider select-none">
              <th className="px-6 py-3.5">Year</th>
              <th className="px-6 py-3.5">Total Users</th>
              <th className="px-6 py-3.5">New Users</th>
              <th className="px-6 py-3.5">Top Channel</th>
              <th className="px-6 py-3.5">Top Country</th>
              <th className="px-6 py-3.5 text-center">YoY Growth</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {data.length > 0 ? (
              data.map((row, idx) => {
                const isPositive = row.yoyChange !== null && row.yoyChange > 0
                const isNegative = row.yoyChange !== null && row.yoyChange < 0

                return (
                  <tr 
                    key={row.year} 
                    className={cn(
                      "hover:bg-slate-50/50 transition-colors",
                      idx % 2 === 1 ? 'bg-slate-50/20' : 'bg-white'
                    )}
                  >
                    <td className="px-6 py-3.5 font-bold text-slate-800 font-mono">{row.year}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-700 font-mono">{row.totalUsers.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-slate-500 font-mono">{row.newUsers.toLocaleString()}</td>
                    <td className="px-6 py-3.5 font-medium text-slate-600">{row.topSource}</td>
                    <td className="px-6 py-3.5 text-slate-600">{row.topCountry}</td>
                    <td className="px-6 py-3.5 text-center">
                      {row.yoyChange !== null ? (
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tracking-wide border",
                          isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          isNegative ? 'bg-red-50 text-red-700 border-red-100' :
                          'bg-slate-50 text-slate-500 border border-slate-200'
                        )}>
                          {isPositive ? `+${row.yoyChange.toFixed(1)}%` : `${row.yoyChange.toFixed(1)}%`}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono font-light">—</span>
                      )}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                  No yearly records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
