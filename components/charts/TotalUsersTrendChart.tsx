// components/charts/TotalUsersTrendChart.tsx
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
import { TrafficRow } from '@/lib/types'

interface TotalUsersTrendChartProps {
  rows: TrafficRow[]
}

export default function TotalUsersTrendChart({ rows }: TotalUsersTrendChartProps) {
  
  // Format data for chart
  const data = rows.map(r => {
    const [monthName, yearStr] = r.month.split('-')
    const shortMonth = monthName.substring(0, 3)
    const shortYear = yearStr.substring(2)
    return {
      label: `${shortMonth}-${shortYear}`,
      'Total Users': r.totalUsers,
      'New Users': r.newUsers
    }
  })

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[380px] flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          Total Users vs New Users
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Monthly comparison of overall website visitors vs first-time sessions
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
              name="Total Users" 
              dataKey="Total Users" 
              fill="#1A73E8" 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              name="New Users" 
              dataKey="New Users" 
              fill="#34A853" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
