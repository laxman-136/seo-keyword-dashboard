// components/charts/SourceDonutChart.tsx
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
import { TrafficSource } from '@/lib/types'
import { TRAFFIC_SOURCES } from '@/lib/calculations'

interface SourceDonutChartProps {
  sources: Record<TrafficSource, number>
}

const SOURCE_COLORS: Record<TrafficSource, string> = {
  'Organic':       '#16a34a',
  'Direct':        '#2563eb',
  'Social':        '#9333ea',
  'Video':         '#dc2626',
  'Referral':      '#d97706',
  'Paid Search':   '#0891b2',
  'Cross Network': '#db2777',
  'Display':       '#65a30d',
  'Email':         '#ea580c',
  'Unassigned':    '#6b7280',
}

export default function SourceDonutChart({ sources }: SourceDonutChartProps) {
  const [isMobile, setIsMobile] = React.useState(false)
  
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const total = TRAFFIC_SOURCES.reduce((sum, s) => sum + (sources[s] || 0), 0)

  const data = TRAFFIC_SOURCES.map(s => {
    const val = sources[s] || 0
    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0'
    return {
      name: s,
      value: val,
      color: SOURCE_COLORS[s],
      percentLabel: `${pct}%`
    }
  }).filter(d => d.value > 0) // Only render active channels

  // Custom legend showing source name and share percentage
  const renderLegend = (value: string) => {
    const sourceData = data.find(d => d.name === value)
    return (
      <span className="text-[10px] sm:text-[11px] font-medium text-slate-600 pl-1 inline-flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
        <span className="text-slate-700 font-semibold">{value}:</span>
        <span className="text-slate-800 font-bold">{sourceData?.value.toLocaleString()}</span>
        <span className="text-slate-400">({sourceData?.percentLabel})</span>
      </span>
    )
  }

  return (
    <div className="bg-white p-3 sm:p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm h-auto sm:h-[360px] md:h-[400px] flex flex-col justify-between relative">
      <div>
        <h4 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
          Traffic Acquisition Channels
        </h4>
        <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
          Distribution of users across all marketing sources
        </p>
      </div>

      <div className={`flex-1 w-full mt-2 sm:mt-4 flex items-center justify-center relative text-[10px] ${isMobile ? 'flex-col' : ''}`}>
        {/* Center Total label - repositioned for mobile */}
        <div className={`${isMobile ? 'mb-2' : 'absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2'} flex flex-col items-center justify-center pointer-events-none select-none`}>
          <span className="text-lg sm:text-xl md:text-2xl font-black text-slate-800">{total.toLocaleString()}</span>
          <span className="text-[7px] sm:text-[8px] uppercase tracking-widest text-slate-400 font-extrabold">Total Users</span>
        </div>

        <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px'
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(val: any) => `${Number(val).toLocaleString()} users`}
            />
            <Pie
              data={data}
              cx={isMobile ? "50%" : "30%"}
              cy="50%"
              innerRadius={isMobile ? 35 : 45}
              outerRadius={isMobile ? 55 : 65}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend
              layout={isMobile ? "horizontal" : "vertical"}
              align={isMobile ? "center" : "right"}
              verticalAlign={isMobile ? "bottom" : "middle"}
              formatter={renderLegend}
              iconSize={6}
              iconType="circle"
              wrapperStyle={{
                fontSize: isMobile ? '10px' : '11px',
                paddingLeft: isMobile ? '0' : '10px',
                paddingTop: isMobile ? '16px' : '0',
                width: isMobile ? '100%' : 160,
                maxHeight: isMobile ? 'auto' : '100%',
                overflowY: isMobile ? 'visible' : 'auto'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
