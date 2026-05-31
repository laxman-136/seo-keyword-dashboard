// components/charts/CountryTrendChart.tsx
'use client';

import React, { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { TrafficRow, TrafficCountry } from '@/lib/types'
import { TRAFFIC_COUNTRIES } from '@/lib/calculations'

interface CountryTrendChartProps {
  rows: TrafficRow[]
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

export default function CountryTrendChart({ rows }: CountryTrendChartProps) {
  
  // Find top 5 countries based on the latest available period data
  const topCountries = useMemo(() => {
    if (rows.length === 0) return TRAFFIC_COUNTRIES.slice(0, 5)

    const latestRow = rows[rows.length - 1]
    const countryCounts = TRAFFIC_COUNTRIES.map(c => ({
      name: c,
      count: latestRow.countries[c] || 0
    }))

    countryCounts.sort((a, b) => b.count - a.count)
    return countryCounts.slice(0, 5).map(c => c.name)
  }, [rows])

  // Format data
  const data = rows.map(r => {
    const [monthName, yearStr] = r.month.split('-')
    const label = `${monthName.substring(0, 3)}-${yearStr.substring(2)}`
    
    const countryData: Record<string, number> = {}
    TRAFFIC_COUNTRIES.forEach(c => {
      countryData[c] = r.countries[c] || 0
    })

    return {
      label,
      ...countryData
    }
  })

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px] flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          Top 5 Geographic Markets Trend
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Historical trends for your five largest user acquisition countries
        </p>
      </div>

      <div className="flex-1 w-full mt-4 text-[10px] select-none">
        <ResponsiveContainer width="100%" height="90%">
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
              height={36} 
              iconSize={10} 
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
            />
            {topCountries.map(c => (
              <Line
                key={c}
                type="monotone"
                dataKey={c}
                stroke={COUNTRY_COLORS[c]}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name={c}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
