// components/charts/MovementDonutChart.tsx
'use client';

import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { DashboardStats } from '@/lib/types'

interface MovementDonutChartProps {
  stats: DashboardStats
}

export default function MovementDonutChart({ stats }: MovementDonutChartProps) {
  
  const data = [
    { name: 'Improved', value: stats.improved, color: '#10b981' },
    { name: 'Neutral', value: stats.neutral, color: '#94a3b8' },
    { name: 'Dropped', value: stats.dropped, color: '#ef4444' },
    { name: 'New Entry', value: stats.newEntries, color: '#3b82f6' },
    { name: 'Lost Ranking', value: stats.lostRankings, color: '#0f172a' }
  ].filter(d => d.value > 0) // Only render slices that have data

  const totalActions = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[360px] flex flex-col justify-between relative">
      <div>
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          Keyword Movement Breakdown
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Monthly shifts: ranks going up, down, or remaining stable
        </p>
      </div>

      <div className="flex-1 w-full mt-4 flex items-center justify-center relative text-[10px]">
        {/* Total indicator inside the center of the donut hole */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <span className="text-3xl font-extrabold text-slate-800">{totalActions}</span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Keywords</span>
        </div>

        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px'
              }}
            />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconSize={8} 
              iconType="circle"
              wrapperStyle={{ fontSize: '11px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
