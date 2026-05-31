// components/traffic/TrafficPeriodSummary.tsx
import React from 'react'
import { QuarterlyData } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TrafficPeriodSummaryProps {
  data: QuarterlyData[]
}

export default function TrafficPeriodSummary({ data }: TrafficPeriodSummaryProps) {
  // We want to list periods: Period (e.g. Q1 2026) | Total Users | New Users
  // We flatten the quarterlyData so each quarter is a row
  const list = React.useMemo(() => {
    const rows: { label: string; total: number; newUsers: number }[] = []
    
    // Sort chronologically (oldest first) or latest first
    const sortedData = [...data].sort((a, b) => b.year - a.year)

    sortedData.forEach(yr => {
      // Approximate new users per quarter as ~62% (consistent with weights)
      rows.push(
        { label: `Q4 ${yr.year}`, total: yr.q4, newUsers: Math.round(yr.q4 * 0.62) },
        { label: `Q3 ${yr.year}`, total: yr.q3, newUsers: Math.round(yr.q3 * 0.62) },
        { label: `Q2 ${yr.year}`, total: yr.q2, newUsers: Math.round(yr.q2 * 0.62) },
        { label: `Q1 ${yr.year}`, total: yr.q1, newUsers: Math.round(yr.q1 * 0.62) }
      )
    })

    return rows.filter(r => r.total > 0) // Only show quarters with data
  }, [data])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-100">
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          Period Summary Table
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Users acquisition breakdown across all active quarters
        </p>
      </div>

      <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
        <table className="w-full text-left border-collapse min-w-[450px]">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider select-none sticky top-0">
              <th className="px-6 py-3.5">Period</th>
              <th className="px-6 py-3.5">Total Users</th>
              <th className="px-6 py-3.5">New Users</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {list.length > 0 ? (
              list.map((row, idx) => (
                <tr 
                  key={row.label} 
                  className={cn(
                    "hover:bg-slate-50/50 transition-colors",
                    idx % 2 === 1 ? 'bg-slate-50/20' : 'bg-white'
                  )}
                >
                  <td className="px-6 py-3.5 font-bold text-slate-700">{row.label}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-850 font-mono">{row.total.toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-slate-500 font-mono">{row.newUsers.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center py-8 text-slate-400 font-medium">
                  No quarterly records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
