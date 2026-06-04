// components/charts/MovementDonutChart.tsx
'use client';

import React, { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Sector
} from 'recharts'
import { DashboardStats } from '@/lib/types'

interface MovementDonutChartProps {
  stats: DashboardStats
}

export default function MovementDonutChart({ stats }: MovementDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const data = [
    { name: 'Improved', value: stats.improved, color: '#10b981' },
    { name: 'Neutral', value: stats.neutral, color: '#64748b' },
    { name: 'Dropped', value: stats.dropped, color: '#ef4444' },
    { name: 'New Entry', value: stats.newEntries, color: '#3b82f6' },
    { name: 'Lost Ranking', value: stats.lostRankings, color: '#0f172a' }
  ].filter(d => d.value > 0) // Only render slices that have data

  const totalActions = data.reduce((sum, d) => sum + d.value, 0)
  const activeItem = activeIndex !== null ? data[activeIndex] : null

  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[360px] flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-800 tracking-tight">
            Keyword Movement Breakdown
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Monthly shifts: ranks going up, down, or remaining stable
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-slate-300">0</span>
          <span className="text-xs text-slate-400 font-medium mt-1">No Shifts Detected</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[360px] flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-md">
      <div>
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          Keyword Movement Breakdown
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Monthly shifts: ranks going up, down, or remaining stable
        </p>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 items-center mt-2">
        {/* Donut Chart Container */}
        <div className="col-span-6 h-full flex items-center justify-center relative min-h-[180px]">
          {/* Total indicator inside the center of the donut hole */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none transition-all duration-300">
            <span 
              className="text-3xl font-extrabold tracking-tight transition-colors duration-300"
              style={{ color: activeItem ? activeItem.color : '#1e293b' }}
            >
              {activeItem ? activeItem.value : totalActions}
            </span>
            <span 
              className="text-[9px] uppercase tracking-widest font-extrabold transition-colors duration-300 mt-0.5"
              style={{ color: activeItem ? activeItem.color : '#94a3b8' }}
            >
              {activeItem ? activeItem.name : 'Shifts'}
            </span>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className="cursor-pointer outline-none focus:outline-none"
              >
                {data.map((entry, index) => {
                  const isHovered = activeIndex === index
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke={isHovered ? entry.color : '#fff'}
                      strokeWidth={isHovered ? 2.5 : 1}
                      opacity={activeIndex === null || isHovered ? 1 : 0.4}
                      style={{
                        transition: 'all 0.2s ease-in-out',
                        outline: 'none'
                      }}
                    />
                  )
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed custom legend list */}
        <div className="col-span-6 flex flex-col gap-1.5 justify-center">
          {data.map((item, index) => {
            const pct = totalActions > 0 ? ((item.value / totalActions) * 100).toFixed(1) : '0.0'
            const isHovered = activeIndex === index
            return (
              <div
                key={item.name}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`group flex flex-col p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                  isHovered 
                    ? 'bg-slate-50 border-slate-200 shadow-sm translate-x-1' 
                    : 'bg-transparent border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full transition-transform duration-200 group-hover:scale-125" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span className={`text-xs font-semibold transition-colors duration-200 ${
                      isHovered ? 'text-slate-900 font-bold' : 'text-slate-600'
                    }`}>
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                    <span>{item.value}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                  </div>
                </div>
                {/* Micro-Progress Bar */}
                <div className="w-full bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${pct}%`, 
                      backgroundColor: item.color,
                      opacity: activeIndex === null || isHovered ? 1 : 0.6
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

