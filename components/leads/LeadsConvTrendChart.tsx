// components/leads/LeadsConvTrendChart.tsx
'use client';

import React from 'react'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { LeadsMonthlyRow } from '@/lib/types'

interface LeadsConvTrendChartProps {
  rows: LeadsMonthlyRow[]
}

export default function LeadsConvTrendChart({ rows }: LeadsConvTrendChartProps) {
  const data = (rows || []).map(r => ({
    label: r.month,
    'Conversion Rate (%)': r.convRate,
    'Enrolled Volume': r.enrolled
  }))

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[380px] flex flex-col justify-between w-full">
      <div>
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          📈 Conversion Rate vs Enrollment Volume
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Monthly trends comparing the percentage lead-to-enrolled conversion efficiency with absolute student sign-ups
        </p>
      </div>

      <div className="flex-1 w-full mt-4 text-[10px] select-none">
        <ResponsiveContainer width="100%" height="95%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: -10, left: -25, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="label" 
              stroke="#64748b" 
              tickLine={false} 
              axisLine={false}
              dy={10}
            />
            {/* Primary Y-Axis (left) for Conversion Rate */}
            <YAxis 
              yAxisId="left"
              orientation="left"
              stroke="#8b5cf6" 
              tickLine={false} 
              axisLine={false}
              dx={-5}
              unit="%"
            />
            {/* Secondary Y-Axis (right) for Enrolled Volume */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#10b981" 
              tickLine={false} 
              axisLine={false}
              dx={5}
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
            {/* Enrolled Volume as Bars */}
            <Bar 
              yAxisId="right"
              name="Enrolled Volume" 
              dataKey="Enrolled Volume" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]}
              barSize={32}
            />
            {/* Conversion Rate as Line */}
            <Line 
              yAxisId="left"
              type="monotone"
              name="Conversion Rate (%)" 
              dataKey="Conversion Rate (%)" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
