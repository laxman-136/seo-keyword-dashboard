// components/traffic/TrafficQuarterlyTable.tsx
import React from 'react'
import { QuarterlyData } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TrafficQuarterlyTableProps {
  data: QuarterlyData[]
}

export default function TrafficQuarterlyTable({ data }: TrafficQuarterlyTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-100">
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          Quarterly Overview
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Historical quarterly aggregates and full year totals
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider select-none">
              <th className="px-6 py-3.5">Year</th>
              <th className="px-6 py-3.5 text-center">Q1 Users</th>
              <th className="px-6 py-3.5 text-center">Q2 Users</th>
              <th className="px-6 py-3.5 text-center">Q3 Users</th>
              <th className="px-6 py-3.5 text-center">Q4 Users</th>
              <th className="px-6 py-3.5 text-right font-bold">Full Year Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {data.length > 0 ? (
              data.map((row, idx) => (
                <tr 
                  key={row.year} 
                  className={cn(
                    "hover:bg-slate-50/50 transition-colors",
                    idx % 2 === 1 ? 'bg-slate-50/20' : 'bg-white'
                  )}
                >
                  <td className="px-6 py-3.5 font-bold text-slate-800 font-mono">{row.year}</td>
                  <td className="px-6 py-3.5 text-center text-slate-600 font-mono">
                    {row.q1 > 0 ? row.q1.toLocaleString() : <span className="text-slate-300 font-light">—</span>}
                  </td>
                  <td className="px-6 py-3.5 text-center text-slate-600 font-mono">
                    {row.q2 > 0 ? row.q2.toLocaleString() : <span className="text-slate-300 font-light">—</span>}
                  </td>
                  <td className="px-6 py-3.5 text-center text-slate-600 font-mono">
                    {row.q3 > 0 ? row.q3.toLocaleString() : <span className="text-slate-300 font-light">—</span>}
                  </td>
                  <td className="px-6 py-3.5 text-center text-slate-600 font-mono">
                    {row.q4 > 0 ? row.q4.toLocaleString() : <span className="text-slate-300 font-light">—</span>}
                  </td>
                  <td className="px-6 py-3.5 text-right font-extrabold text-slate-800 font-mono bg-slate-50/20">
                    {row.total.toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                  No quarterly records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
