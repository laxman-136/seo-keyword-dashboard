// components/revenue/RevenueSourceTrend.tsx
'use client'
import React, { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { RevenueMonthlyRow } from '@/lib/types'
import { REVENUE_SOURCE_COLORS, formatCurrency } from '@/lib/sheets'

interface RevenueSourceTrendProps {
  rows: RevenueMonthlyRow[]
}

const SOURCES = [
  { key: 'organicRevenue', name: 'Organic', color: REVENUE_SOURCE_COLORS['Organic'] },
  { key: 'websiteRevenue', name: 'Website', color: REVENUE_SOURCE_COLORS['Website'] },
  { key: 'referralRevenue', name: 'Referrals / Old Students', color: REVENUE_SOURCE_COLORS['Referrals / Old Students'] },
  { key: 'googleAdsRevenue', name: 'Google Ads', color: REVENUE_SOURCE_COLORS['Google Ads'] },
  { key: 'metaAdsRevenue', name: 'Facebook/Instagram Ads', color: REVENUE_SOURCE_COLORS['Facebook/Instagram Ads'] },
  { key: 'directRevenue', name: 'Direct/Walk-in', color: REVENUE_SOURCE_COLORS['Direct/Walk-in'] },
]

export default function RevenueSourceTrend({ rows }: RevenueSourceTrendProps) {
  const [activeAreas, setActiveAreas] = useState<Record<string, boolean>>(
    SOURCES.reduce((acc, s) => ({ ...acc, [s.key]: true }), {})
  )

  const handleLegendClick = (e: any) => {
    const { dataKey } = e
    if (!dataKey) return
    setActiveAreas(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }))
  }

  const data = rows.map(r => ({
    month: r.month,
    organicRevenue: r.organicRevenue || 0,
    websiteRevenue: r.websiteRevenue || 0,
    referralRevenue: r.referralRevenue || 0,
    googleAdsRevenue: r.googleAdsRevenue || 0,
    metaAdsRevenue: r.metaAdsRevenue || 0,
    directRevenue: r.directRevenue || 0,
  }))

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px] flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          Revenue Acquisition Funnels over Time
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Monthly cumulative area trends split across organic, direct, referral, and advertising campaign returns
        </p>
      </div>

      <div className="flex-1 w-full mt-4 text-[10px] select-none">
        <ResponsiveContainer width="100%" height="95%">
          <AreaChart
            data={data}
            margin={{ top: 15, right: 10, left: -25, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="month" 
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
              tickFormatter={(v) => formatCurrency(v).replace('₹', '')}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: 'none', 
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px'
              }}
              formatter={(val: any, name: any) => [formatCurrency(Number(val)), name]}
            />
            <Legend 
              verticalAlign="top" 
              height={44} 
              iconSize={10} 
              iconType="circle"
              onClick={handleLegendClick}
              wrapperStyle={{ 
                fontSize: '10px', 
                cursor: 'pointer',
                paddingBottom: '15px'
              }}
            />
            {SOURCES.map(s => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stackId="1"
                stroke={s.color}
                fill={s.color}
                fillOpacity={activeAreas[s.key] ? 0.6 : 0.05}
                strokeWidth={activeAreas[s.key] ? 2 : 0.5}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
