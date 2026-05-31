// components/charts/SourceTrendChart.tsx
'use client';

import React, { useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { TrafficRow, TrafficSource } from '@/lib/types'
import { TRAFFIC_SOURCES } from '@/lib/calculations'

interface SourceTrendChartProps {
  rows: TrafficRow[]
  variant: 'organic-direct-bar' | 'all-lines'
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

export default function SourceTrendChart({ rows, variant }: SourceTrendChartProps) {
  // Line toggle states for the all-lines variant
  const [activeLines, setActiveLines] = useState<Record<string, boolean>>(
    TRAFFIC_SOURCES.reduce((acc, s) => ({ ...acc, [s]: true }), {})
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLegendClick = (e: any) => {
    const { dataKey } = e
    if (!dataKey) return
    setActiveLines(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }))
  }

  // Format data for chart
  const data = rows.map(r => {
    const [monthName, yearStr] = r.month.split('-')
    const label = `${monthName.substring(0, 3)}-${yearStr.substring(2)}`
    
    const sourceData: Record<string, number> = {}
    TRAFFIC_SOURCES.forEach(s => {
      sourceData[s] = r.sources[s] || 0
    })

    return {
      label,
      ...sourceData,
      // Helper for Tooltip percentages
      total: r.totalUsers
    }
  })

  // Tooltip formatter for Organic/Direct
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customTooltipFormatter = (value: any, name: any, props: any) => {
    const val = Number(value)
    const total = props.payload?.total || 1
    const pct = ((val / total) * 100).toFixed(1)
    return [`${val.toLocaleString()} (${pct}%)`, name]
  }

  if (variant === 'organic-direct-bar') {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[380px] flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-800 tracking-tight">
            Organic vs Direct Traffic
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Comparing unpaid search visitors against direct URL sessions
          </p>
        </div>

        <div className="flex-1 w-full mt-4 text-[10px] select-none">
          <ResponsiveContainer width="100%" height="90%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="label" 
                stroke="#64748b" 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#64748b" 
                tickLine={false} 
                axisLine={false}
                dx={-5}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '11px'
                }}
                formatter={customTooltipFormatter}
                cursor={{ fill: '#f8fafc' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconSize={10} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
              />
              <Bar 
                name="Organic Search" 
                dataKey="Organic" 
                fill="#34A853" 
                radius={[4, 4, 0, 0]} 
              />
              <Bar 
                name="Direct Traffic" 
                dataKey="Direct" 
                fill="#EA4335" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  // All lines toggleable trend view
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[420px] flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          Traffic Acquisition Trends
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Monthly trends for all 10 acquisition channels (click legend items to toggle channels)
        </p>
      </div>

      <div className="flex-1 w-full mt-4 text-[10px] select-none">
        <ResponsiveContainer width="100%" height="95%">
          <LineChart
            data={data}
            margin={{ top: 15, right: 10, left: -25, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="label" 
              stroke="#64748b" 
              tickLine={false} 
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#64748b" 
              tickLine={false} 
              axisLine={false}
              dx={-5}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: 'none', 
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px'
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={44} 
              iconSize={10} 
              iconType="circle"
              onClick={handleLegendClick}
              wrapperStyle={{ 
                fontSize: '10px', 
                cursor: 'pointer',
                paddingBottom: '15px'
              }}
            />
            {TRAFFIC_SOURCES.map(s => (
              <Line
                key={s}
                type="monotone"
                dataKey={s}
                stroke={SOURCE_COLORS[s]}
                strokeWidth={activeLines[s] ? 2.5 : 0.5}
                strokeOpacity={activeLines[s] ? 1.0 : 0.15}
                dot={activeLines[s] ? { r: 3 } : false}
                activeDot={activeLines[s] ? { r: 5 } : false}
                name={s}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
