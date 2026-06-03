// components/leads/LeadsCourseTrendChart.tsx
'use client';

import React, { useState, useMemo } from 'react'
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
import { LeadsDetailRow } from '@/lib/types'

interface LeadsCourseTrendChartProps {
  detailRows: LeadsDetailRow[]
}

const COURSE_COLORS: Record<string, string> = {
  'Oracle Fusion SCM':        '#1e40af', // dark blue
  'Oracle Fusion HCM':        '#7c3aed', // purple
  'Oracle Fusion Financials':  '#065f46', // dark green
  'Oracle Fusion Tech + OIC':  '#c2410c', // orange
  'Oracle Fusion PPM':         '#0e7490', // cyan
  'SAP / EBS / Others':        '#6b7280'  // gray
}

const FALLBACK_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#14b8a6']

export default function LeadsCourseTrendChart({ detailRows }: LeadsCourseTrendChartProps) {
  const [hiddenCourses, setHiddenCourses] = useState<Record<string, boolean>>({})

  // Compute unique sorted months and find top 5 courses by cumulative lead volume
  const { data, topCourses } = useMemo(() => {
    if (!detailRows || detailRows.length === 0) return { data: [], topCourses: [] }

    // Find all unique months and sort them chronologically (we assume months exist in detailRows)
    const monthsMap = new Map<string, number>()
    const monthsArray: string[] = []
    
    // Sort months defensively
    const parseMonthToDate = (m: string) => {
      const parts = m.split(' ')
      if (parts.length < 2) return new Date(m)
      const months: Record<string, number> = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 }
      return new Date(parseInt(parts[1], 10), months[parts[0].toLowerCase().substring(0, 3)] ?? 0, 1)
    }

    detailRows.forEach(r => {
      if (!monthsMap.has(r.month)) {
        monthsMap.set(r.month, 1)
        monthsArray.push(r.month)
      }
    })

    const sortedMonths = monthsArray.sort((a, b) => parseMonthToDate(a).getTime() - parseMonthToDate(b).getTime())

    // Compute cumulative totals per course
    const courseTotals: Record<string, number> = {}
    detailRows.forEach(r => {
      courseTotals[r.courseName] = (courseTotals[r.courseName] || 0) + r.total
    })

    const sortedCourses = Object.keys(courseTotals).sort((a, b) => courseTotals[b] - courseTotals[a])
    const top5 = sortedCourses.slice(0, 5)

    // Build Recharts data list
    const chartData = sortedMonths.map(m => {
      const point: any = { label: m }
      top5.forEach(course => {
        const found = detailRows.find(r => r.month === m && r.courseName === course)
        point[course] = found ? found.total : 0
      })
      return point
    })

    return { data: chartData, topCourses: top5 }
  }, [detailRows])

  const handleLegendClick = (e: any) => {
    const { dataKey } = e
    setHiddenCourses(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }))
  }

  if (!detailRows || detailRows.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[380px] flex items-center justify-center text-center">
        <p className="text-slate-400 text-sm">Add Leads Detail sheet for course trends</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[380px] flex flex-col justify-between w-full">
      <div>
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          📚 Course Lead Trends
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Historical view of monthly lead counts for top 5 subject courses (Click legend names to toggle lines)
        </p>
      </div>

      <div className="flex-1 w-full mt-4 text-[10px] select-none">
        <ResponsiveContainer width="100%" height="95%">
          <LineChart
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
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconSize={10} 
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '10px', cursor: 'pointer' }}
              onClick={handleLegendClick}
            />
            {topCourses.map((course, idx) => (
              <Line
                key={course}
                type="monotone"
                dataKey={course}
                name={course}
                stroke={COURSE_COLORS[course] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length]}
                strokeWidth={2.5}
                activeDot={{ r: 5 }}
                hide={!!hiddenCourses[course]}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
