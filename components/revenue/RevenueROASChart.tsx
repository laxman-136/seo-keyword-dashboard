// components/revenue/RevenueROASChart.tsx
'use client'
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
import { AdSpendBreakdown } from '@/lib/types'
import { formatROAS } from '@/lib/sheets'

interface RevenueROASChartProps {
  data: AdSpendBreakdown[]
}

export default function RevenueROASChart({ data }: RevenueROASChartProps) {
  // Only show courses with ad spend
  const activeData = data.filter(d => d.totalAdSpend > 0)

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[380px] flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          ROAS Comparison by Course
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Efficiency breakdown of Google Ads vs Meta Ads returns (ROAS) across active training programs
        </p>
      </div>

      <div className="flex-1 w-full mt-4 text-[10px] select-none">
        {activeData.length > 0 ? (
          <ResponsiveContainer width="100%" height="95%">
            <BarChart
              data={activeData}
              layout="vertical"
              barGap={3}
              barCategoryGap={15}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis 
                type="number"
                stroke="#64748b" 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(v) => `${v}x`}
              />
              <YAxis 
                type="category"
                dataKey="course" 
                stroke="#64748b" 
                tickLine={false} 
                axisLine={false}
                width={80}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '11px'
                }}
                formatter={(val: any) => [`${Number(val).toFixed(2)}x`, '']}
              />
              <Legend 
                verticalAlign="top" 
                height={32} 
                iconSize={10} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
              />
              <Bar 
                name="Google ROAS" 
                dataKey="googleROAS" 
                fill="#ea580c" 
                barSize={7}
                radius={[0, 4, 4, 0]}
              />
              <Bar 
                name="Meta ROAS" 
                dataKey="metaROAS" 
                fill="#db2777" 
                barSize={7}
                radius={[0, 4, 4, 0]}
              />
              <Bar 
                name="Overall ROAS" 
                dataKey="roas" 
                fill="#7c3aed" 
                barSize={7}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            No active ad campaigns or spend reported for this period
          </div>
        )}
      </div>
    </div>
  )
}
