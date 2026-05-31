// components/traffic/TrafficMoMTable.tsx
import React from 'react'
import { TrafficAggregate } from '@/lib/types'
import { getMovementPercent } from '@/lib/calculations'
import { cn } from '@/lib/utils'

interface TrafficMoMTableProps {
  current: TrafficAggregate
  previous: TrafficAggregate
  labelA?: string
  labelB?: string
}

interface MoMMetric {
  label: string
  current: number
  previous: number
  isBold?: boolean
}

export default function TrafficMoMTable({ 
  current, 
  previous,
  labelA = 'Current Period',
  labelB = 'Previous Period'
}: TrafficMoMTableProps) {
  
  const metrics: MoMMetric[] = [
    { label: 'Total Users', current: current.totalUsers, previous: previous.totalUsers, isBold: true },
    { label: 'New Users', current: current.newUsers, previous: previous.newUsers, isBold: true },
    { label: 'Organic Search', current: current.sources['Organic'] || 0, previous: previous.sources['Organic'] || 0 },
    { label: 'Direct Traffic', current: current.sources['Direct'] || 0, previous: previous.sources['Direct'] || 0 },
    { label: 'Paid Search', current: current.sources['Paid Search'] || 0, previous: previous.sources['Paid Search'] || 0 },
    { label: 'Social Referral', current: current.sources['Social'] || 0, previous: previous.sources['Social'] || 0 },
    { label: 'Referral Link', current: current.sources['Referral'] || 0, previous: previous.sources['Referral'] || 0 },
    { label: 'Video Sessions', current: current.sources['Video'] || 0, previous: previous.sources['Video'] || 0 },
    { label: 'Cross Network', current: current.sources['Cross Network'] || 0, previous: previous.sources['Cross Network'] || 0 },
    { label: 'Display Banner', current: current.sources['Display'] || 0, previous: previous.sources['Display'] || 0 },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-slate-100">
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          Performance Shift Summary
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Detailed metrics comparison between chosen periods
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider select-none">
              <th className="px-6 py-3.5">Acquisition Metric</th>
              <th className="px-6 py-3.5">{labelA}</th>
              <th className="px-6 py-3.5">{labelB}</th>
              <th className="px-6 py-3.5">Δ Absolute</th>
              <th className="px-6 py-3.5 text-center">Δ Percentage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {metrics.map((row, idx) => {
              const diff = row.current - row.previous
              const pct = getMovementPercent(row.current, row.previous)
              const isPositive = diff > 0
              const isNegative = diff < 0
              
              return (
                <tr 
                  key={row.label} 
                  className={cn(
                    "hover:bg-slate-50/50 transition-colors",
                    row.isBold ? 'bg-slate-50/30 font-bold text-slate-900' : 'text-slate-700',
                    idx % 2 === 1 && !row.isBold ? 'bg-slate-50/20' : ''
                  )}
                >
                  <td className="px-6 py-3.5 flex items-center gap-1.5">
                    {row.isBold && <span className="w-1.5 h-3 rounded-full bg-emerald-500"></span>}
                    <span>{row.label}</span>
                  </td>
                  <td className="px-6 py-3.5">{row.current.toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-slate-500">{row.previous.toLocaleString()}</td>
                  <td className={cn(
                    "px-6 py-3.5 font-medium font-mono",
                    isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-slate-400'
                  )}>
                    {isPositive ? `+${diff.toLocaleString()}` : diff.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tracking-wide border",
                      isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      isNegative ? 'bg-red-50 text-red-700 border-red-100' :
                      'bg-slate-50 text-slate-500 border-slate-200'
                    )}>
                      {isPositive ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`}
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
