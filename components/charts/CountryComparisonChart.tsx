// components/charts/CountryComparisonChart.tsx
'use client';

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { TrafficCountry } from '@/lib/types'
import { TRAFFIC_COUNTRIES } from '@/lib/calculations'

interface CountryComparisonChartProps {
  countriesA: Record<TrafficCountry, number>
  countriesB: Record<TrafficCountry, number>
  labelA: string
  labelB: string
}

export default function CountryComparisonChart({
  countriesA,
  countriesB,
  labelA,
  labelB
}: CountryComparisonChartProps) {
  
  const data = TRAFFIC_COUNTRIES.map(c => {
    return {
      name: c,
      [labelA]: countriesA[c] || 0,
      [labelB]: countriesB[c] || 0
    }
  })

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[380px] flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          Geographic Session Comparison
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Comparing country traffic volumes: {labelA} vs {labelB}
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
              dataKey="name" 
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
              name={labelA} 
              dataKey={labelA} 
              fill="#94a3b8" 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              name={labelB} 
              dataKey={labelB} 
              fill="#10b981" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
