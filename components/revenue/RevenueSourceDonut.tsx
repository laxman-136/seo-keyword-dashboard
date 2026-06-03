// components/revenue/RevenueSourceDonut.tsx
'use client'
import React, { useState, useEffect } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { RevenueSourceBreakdown } from '@/lib/types'
import { REVENUE_SOURCE_COLORS, formatCurrency } from '@/lib/sheets'

interface RevenueSourceDonutProps {
  sources: RevenueSourceBreakdown[]
}

export default function RevenueSourceDonut({ sources }: RevenueSourceDonutProps) {
  const totalRevenue = sources.reduce((acc, s) => acc + s.revenue, 0)

  const data = sources.map(s => ({
    name: s.source,
    value: s.revenue,
    color: REVENUE_SOURCE_COLORS[s.source] || '#6b7280',
    percentLabel: `${s.revenueSharePct.toFixed(1)}%`
  })).filter(d => d.value > 0)

  return (
    <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[380px] flex flex-col justify-between relative">
      <div>
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          Revenue Share by Acquisition Channel
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Revenue contribution breakdown across all lead acquisition channels
        </p>
      </div>

      <div className="flex-1 w-full mt-4 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Left: Chart Column */}
        <div className="relative w-full sm:w-1/2 h-[220px] flex items-center justify-center shrink-0">
          {/* Perfect absolute centered label */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none select-none z-10 bg-white/80 p-2 rounded-full backdrop-blur-[1px] text-center">
            <span className="text-base sm:text-lg font-black text-slate-900 leading-none">{formatCurrency(totalRevenue)}</span>
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-extrabold mt-1">Total Rev</span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '11px',
                  zIndex: 50
                }}
                formatter={(val: any) => formatCurrency(Number(val))}
              />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2.5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Right: Custom Clean Legend Column */}
        <div className="w-full sm:w-1/2 flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 select-none scrollbar-thin">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs border-b border-slate-100/60 pb-2 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 truncate pr-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-650 font-semibold truncate" title={item.name}>{item.name}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-medium">
                <span className="text-slate-800 font-bold font-mono">{formatCurrency(item.value)}</span>
                <span className="text-slate-400">({item.percentLabel})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
