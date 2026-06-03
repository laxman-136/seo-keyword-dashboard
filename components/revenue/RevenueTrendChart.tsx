// components/revenue/RevenueTrendChart.tsx
'use client'
import React from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { RevenueTrendPoint } from '@/lib/types'
import { formatCurrency } from '@/lib/sheets'

interface RevenueTrendChartProps {
  rows: RevenueTrendPoint[]
}

export default function RevenueTrendChart({ rows }: RevenueTrendChartProps) {
  const data = rows.map(r => {
    const paid = r.paidRevenue || 0
    const organic = r.organicRevenue || 0
    const other = Math.max(0, r.totalRevenue - paid - organic)

    return {
      month: r.month,
      'Organic Revenue': organic,
      'Paid Ads Revenue': paid,
      'Other Revenue': other,
      'Conversions': r.totalConversions
    }
  })

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px] flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          Revenue & Conversions Growth Trends
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Monthly stacked revenue channels (Organic, Paid, Direct) mapped against absolute student enrollments
        </p>
      </div>

      <div className="flex-1 w-full mt-4 text-[10px] select-none">
        <ResponsiveContainer width="100%" height="95%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: -5, left: -25, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="month" 
              stroke="#64748b" 
              tickLine={false} 
              axisLine={false}
              dy={10}
            />
            {/* Left Y-Axis for Revenue */}
            <YAxis 
              yAxisId="left"
              stroke="#64748b" 
              tickLine={false} 
              axisLine={false}
              dx={-5}
              tickFormatter={(v) => formatCurrency(v).replace('₹', '')}
            />
            {/* Right Y-Axis for Conversions */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#7c3aed" 
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
              formatter={(val: any, name: any) => {
                if (name === 'Conversions') return [`${val} students`, name]
                return [formatCurrency(Number(val)), name]
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconSize={10} 
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
            />
            {/* Stacked Revenue Bars */}
            <Bar 
              yAxisId="left"
              name="Organic Revenue" 
              dataKey="Organic Revenue" 
              stackId="revenue"
              fill="#16a34a" 
            />
            <Bar 
              yAxisId="left"
              name="Paid Ads Revenue" 
              dataKey="Paid Ads Revenue" 
              stackId="revenue"
              fill="#ea580c" 
            />
            <Bar 
              yAxisId="left"
              name="Other Revenue" 
              dataKey="Other Revenue" 
              stackId="revenue"
              fill="#2563eb" 
              radius={[4, 4, 0, 0]} 
            />
            {/* Conversions Line */}
            <Line 
              yAxisId="right"
              type="monotone"
              name="Conversions"
              dataKey="Conversions"
              stroke="#7c3aed"
              strokeWidth={3}
              dot={{ r: 4, stroke: '#7c3aed', strokeWidth: 2, fill: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
