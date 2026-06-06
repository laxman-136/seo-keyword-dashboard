// components/ads/CombinedOverviewCharts.tsx
'use client';

import React, { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { MetaDailyTrend, GoogleDailyTrend } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CombinedOverviewChartsProps {
  metaTrend: MetaDailyTrend[]
  googleTrend: GoogleDailyTrend[]
  metaSpend: number
  googleSpend: number
}

export default function CombinedOverviewCharts({
  metaTrend,
  googleTrend,
  metaSpend,
  googleSpend
}: CombinedOverviewChartsProps) {
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null)

  // 1. Combine Trend Data by date
  const combinedTrendMap: Record<string, { date: string; metaSpend: number; googleSpend: number; totalSpend: number; metaConvs: number; googleConvs: number; totalConvs: number }> = {}

  metaTrend.forEach(t => {
    combinedTrendMap[t.date] = {
      date: t.date,
      metaSpend: t.spend,
      googleSpend: 0,
      totalSpend: t.spend,
      metaConvs: t.totalConversions,
      googleConvs: 0,
      totalConvs: t.totalConversions
    }
  })

  googleTrend.forEach(t => {
    if (combinedTrendMap[t.date]) {
      combinedTrendMap[t.date].googleSpend = t.spend
      combinedTrendMap[t.date].totalSpend += t.spend
      combinedTrendMap[t.date].googleConvs = t.conversions
      combinedTrendMap[t.date].totalConvs += t.conversions
    } else {
      combinedTrendMap[t.date] = {
        date: t.date,
        metaSpend: 0,
        googleSpend: t.spend,
        totalSpend: t.spend,
        metaConvs: 0,
        googleConvs: t.conversions,
        totalConvs: t.conversions
      }
    }
  })

  const trendData = Object.values(combinedTrendMap).sort((a, b) => a.date.localeCompare(b.date))

  const totalSpend = metaSpend + googleSpend
  const shareData = [
    { name: 'Meta Ads', value: metaSpend, color: '#2563eb', percent: totalSpend > 0 ? (metaSpend / totalSpend) * 100 : 0 },
    { name: 'Google Ads', value: googleSpend, color: '#0891b2', percent: totalSpend > 0 ? (googleSpend / totalSpend) * 100 : 0 }
  ].filter(d => d.value > 0)

  const formatDate = (str: string) => {
    try {
      const d = new Date(str)
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    } catch {
      return str
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Trend Area Chart */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 h-[340px] flex flex-col justify-between">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">Ad Spend & Conversion Trend</h4>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Daily investment and resulting conversion actions across all networks.</p>
        </div>

        <div className="flex-1 mt-4 min-h-0 text-[10px]">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConvs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate} 
                  stroke="#94a3b8" 
                  fontSize={10}
                  fontWeight={600}
                />
                <YAxis 
                  yAxisId="left" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight={600}
                  tickFormatter={(v) => `₹${v}`} 
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight={600}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                  }}
                  labelFormatter={(lbl) => `Date: ${formatDate(lbl as string)}`}
                  formatter={(val: any, name: any) => {
                    if (name === "totalSpend") return [`₹${Math.round(val).toLocaleString()}`, "Total Spend"]
                    if (name === "totalConvs") return [Number(val).toLocaleString(), "Conversions"]
                    return [val, name]
                  }}
                />
                <Area 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="totalSpend" 
                  stroke="#6366f1" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorSpend)" 
                />
                <Area 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="totalConvs" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorConvs)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 font-medium text-xs">
              No trend data available for selected range.
            </div>
          )}
        </div>
      </div>

      {/* Share Donut Chart */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm h-[340px] flex flex-col justify-between">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">Investment Share Split</h4>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Proportion of total ad spend allocated per platform.</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
          {totalSpend > 0 ? (
            <>
              {/* Donut center label */}
              <div className="absolute flex flex-col items-center pointer-events-none select-none">
                <span className="text-xs uppercase tracking-widest text-slate-400 font-extrabold">Total Spend</span>
                <span className="text-lg sm:text-xl font-extrabold text-slate-700 mt-0.5">
                  ₹{Math.round(totalSpend).toLocaleString()}
                </span>
              </div>

              <div className="w-full h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={shareData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onMouseLeave={() => setActivePieIndex(null)}
                    >
                      {shareData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          stroke={activePieIndex === index ? entry.color : '#fff'}
                          strokeWidth={activePieIndex === index ? 2 : 1}
                          opacity={activePieIndex === null || activePieIndex === index ? 1 : 0.6}
                          style={{ transition: 'all 0.2s', outline: 'none' }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '11px'
                      }}
                      formatter={(val: any) => `₹${Math.round(val).toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Legends */}
              <div className="flex items-center gap-6 mt-2">
                {shareData.map((d, idx) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="font-bold text-slate-600">{d.name}</span>
                    <span className="text-slate-400 font-semibold text-[10px]">({d.percent.toFixed(0)}%)</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-slate-400 font-medium text-xs">
              No spend recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
