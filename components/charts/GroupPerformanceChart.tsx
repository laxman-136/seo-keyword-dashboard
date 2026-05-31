// components/charts/GroupPerformanceChart.tsx
'use client';

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { GroupSummary } from '@/lib/types'

interface GroupPerformanceChartProps {
  groupSummaries: GroupSummary[]
}

const ABBREVIATIONS: Record<string, string> = {
  'Oracle Fusion SCM': 'SCM',
  'Oracle Fusion Financials': 'FIN',
  'Oracle Fusion HCM': 'HCM',
  'Oracle Fusion Technical': 'TECH',
  'Oracle Fusion Procurement': 'PROC',
  'Oracle Recruiting & WMS': 'REC/WMS',
  'Oracle Integration & GTM': 'INT/GTM',
  'Oracle Fusion Manufacturing': 'MFG',
  'Oracle Fusion PPM': 'PPM',
  'SAP': 'SAP',
  'Salesforce & Others': 'SFDC',
  'DevOps & Cloud': 'DEVOPS',
  'Data & Azure': 'DATA/AZ'
}

export default function GroupPerformanceChart({ groupSummaries }: GroupPerformanceChartProps) {
  
  const data = groupSummaries.map(g => {
    const p1Count = g.p1Top + g.p1Good
    return {
      fullName: g.name,
      abbrevName: ABBREVIATIONS[g.name] || g.name.substring(0, 8),
      'Page 1': p1Count,
      'Page 2': g.page2,
      'Page 3': g.page3,
      'Page 4+': g.page4Plus,
      'Not Ranking': g.notRanking
    }
  })

  // Custom tooltips showing full breakdown for maximum corporate details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="glass-panel-dark px-4 py-3 rounded-xl border border-slate-800 text-[11px] text-white shadow-xl">
          <p className="font-bold text-emerald-400 mb-1">{data.fullName}</p>
          <div className="space-y-0.5 text-slate-300">
            <p>🥇 Page 1 (Top 10): <span className="font-bold text-white">{data['Page 1']}</span></p>
            <p>🟡 Page 2: <span className="font-semibold text-white">{data['Page 2']}</span></p>
            <p>🟠 Page 3: <span className="font-semibold text-white">{data['Page 3']}</span></p>
            <p>🔴 Page 4+: <span className="font-semibold text-white">{data['Page 4+']}</span></p>
            <p>⚫ Not Ranking: <span className="font-semibold text-slate-400">{data['Not Ranking']}</span></p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[360px] flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          Page 1 Keywords per Course
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Number of Page 1 (Top 10) rankings across all 13 syllabus groups
        </p>
      </div>

      <div className="flex-1 w-full mt-4 text-[10px] select-none">
        <ResponsiveContainer width="100%" height="90%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 5, left: -30, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="abbrevName" 
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar 
              dataKey="Page 1" 
              fill="#2563eb" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
