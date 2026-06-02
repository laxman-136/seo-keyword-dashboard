// components/charts/CountryDonutChart.tsx
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
import { TrafficCountry } from '@/lib/types'
import { TRAFFIC_COUNTRIES } from '@/lib/calculations'

interface CountryDonutChartProps {
  countries: Record<TrafficCountry, number>
}

const COUNTRY_COLORS: Record<TrafficCountry, string> = {
  'India':          '#10b981',
  'USA':            '#3b82f6',
  'UAE':            '#8b5cf6',
  'Saudi Arabia':   '#f59e0b',
  'Canada':         '#ef4444',
  'Pakistan':       '#06b6d4',
  'United Kingdom': '#ec4899',
  'Poland':         '#84cc16',
  'Others':         '#6b7280',
}

const COUNTRY_FLAGS: Record<string, string> = {
  'India': '🇮🇳',
  'USA': '🇺🇸',
  'UAE': '🇦🇪',
  'Saudi Arabia': '🇸🇦',
  'Canada': '🇨🇦',
  'Pakistan': '🇵🇰',
  'United Kingdom': '🇬🇧',
  'Poland': '🇵🇱',
  'Others': '🌐'
}

export default function CountryDonutChart({ countries }: CountryDonutChartProps) {
  
  const total = TRAFFIC_COUNTRIES.reduce((sum, c) => sum + (countries[c] || 0), 0)

  const data = TRAFFIC_COUNTRIES.map(c => {
    const val = countries[c] || 0
    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0'
    const flag = COUNTRY_FLAGS[c] || ''
    const nameWithFlag = flag ? `${flag} ${c}` : c
    return {
      name: nameWithFlag,
      value: val,
      color: COUNTRY_COLORS[c],
      percentLabel: `${pct}%`
    }
  }).filter(d => d.value > 0)

  // Custom legend listing flag, country name, user counts, and share percentages
  const renderLegend = (value: string) => {
    const countryData = data.find(d => d.name === value)
    return (
      <span className="text-[11px] font-medium text-slate-600 pl-1 inline-flex items-center gap-1.5 whitespace-nowrap">
        <span className="text-slate-700 font-semibold">{value}:</span>
        <span className="text-slate-800 font-bold">{countryData?.value.toLocaleString()}</span>
        <span className="text-slate-400">({countryData?.percentLabel})</span>
      </span>
    )
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[360px] flex flex-col justify-between relative">
      <div>
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          Geographic Distribution
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Analysis of web sessions based on visitor countries
        </p>
      </div>

      <div className="flex-1 w-full mt-4 flex items-center justify-center relative text-[10px]">
        {/* Center Total label aligned with the shifted pie */}
        <div className="absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none select-none">
          <span className="text-2xl font-black text-slate-800">{total.toLocaleString()}</span>
          <span className="text-[8px] uppercase tracking-widest text-slate-400 font-extrabold">Total Users</span>
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(val: any) => `${Number(val).toLocaleString()} users`}
            />
            <Pie
              data={data}
              cx="30%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={renderLegend}
              iconSize={8}
              iconType="circle"
              wrapperStyle={{
                fontSize: '11px',
                paddingLeft: '10px',
                right: 0,
                width: 160
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
