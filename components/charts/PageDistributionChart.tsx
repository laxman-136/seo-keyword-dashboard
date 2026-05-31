// components/charts/PageDistributionChart.tsx
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
import { DashboardStats } from '@/lib/types'

interface PageDistributionChartProps {
  stats: DashboardStats
}

export default function PageDistributionChart({ stats }: PageDistributionChartProps) {
  
  const data = [
    { name: 'P1 Top', Current: stats.p1Top, Previous: stats.prevP1Top },
    { name: 'P1 Good', Current: stats.p1Good, Previous: stats.prevP1Good },
    { name: 'Page 2', Current: stats.page2, Previous: stats.prevPage2 },
    { name: 'Page 3', Current: stats.page3, Previous: stats.prevPage3 },
    { name: 'Page 4+', Current: stats.page4Plus, Previous: stats.prevPage4Plus },
    { name: 'Not Ranking', Current: stats.notRanking, Previous: stats.prevNotRanking }
  ]

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[360px] flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          Page Distribution Comparison
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Distribution of keyword ranks (Current vs Previous Month)
        </p>
      </div>

      <div className="flex-1 w-full mt-4 text-[10px] select-none">
        <ResponsiveContainer width="100%" height="90%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
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
              name="Current Month" 
              dataKey="Current" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={30}
            />
            <Bar 
              name="Previous Month" 
              dataKey="Previous" 
              fill="#94a3b8" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
