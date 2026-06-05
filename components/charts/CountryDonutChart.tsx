// components/charts/CountryDonutChart.tsx
'use client';

import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { TrafficCountry } from '@/lib/types'
import { TRAFFIC_COUNTRIES } from '@/lib/calculations'
import { cn } from '@/lib/utils'

interface CountryDonutChartProps {
  countries: Record<TrafficCountry, number>
}

const COUNTRY_COLORS: Record<TrafficCountry, string> = {
  'India':          '#10b981',
  'USA':            '#3b82f6',
  'UAE':            '#8b5cf6',
  'Saudi Arabia':   '#f59e0b',
  'Canada':         '#ef4444',
  'Pakistan':       '#06b6d4',
  'United Kingdom': '#ec4899',
  'Poland':         '#84cc16',
  'Others':         '#6b7280',
}

const COUNTRY_FLAGS: Record<string, string> = {
  'India': '🇮🇳',
  'USA': '🇺🇸',
  'UAE': '🇦🇪',
  'Saudi Arabia': '🇸🇦',
  'Canada': '🇨🇦',
  'Pakistan': '🇵🇰',
  'United Kingdom': '🇬🇧',
  'Poland': '🇵🇱',
  'Others': '🌐'
}

export default function CountryDonutChart({ countries }: CountryDonutChartProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
  const [isMobile, setIsMobile] = React.useState(false)
  
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const total = TRAFFIC_COUNTRIES.reduce((sum, c) => sum + (countries[c] || 0), 0)

  const data = TRAFFIC_COUNTRIES.map(c => {
    const val = countries[c] || 0
    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0'
    const flag = COUNTRY_FLAGS[c] || ''
    const nameWithFlag = flag ? `${flag} ${c}` : c
    return {
      name: nameWithFlag,
      displayName: c,
      value: val,
      color: COUNTRY_COLORS[c],
      percentLabel: `${pct}%`
    }
  }).filter(d => d.value > 0) // Only render active countries

  const activeItem = activeIndex !== null ? data[activeIndex] : null

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm h-[380px] sm:h-[360px] md:h-[380px] flex flex-col justify-between relative transition-all duration-300 hover:shadow-md">
      <div>
        <h4 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
          Geographic Distribution
        </h4>
        <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
          Analysis of web sessions based on visitor countries
        </p>
      </div>

      <div className="flex-1 grid grid-cols-12 items-center gap-4 mt-2 overflow-hidden">
        {/* Left/Center: Donut Chart */}
        <div className="col-span-12 sm:col-span-5 h-[160px] sm:h-[180px] md:h-[200px] flex items-center justify-center relative">
          {/* Total Users Label in Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none transition-all duration-300">
            <span 
              className="text-2xl sm:text-3xl font-extrabold tracking-tight transition-colors duration-200"
              style={{ color: activeItem ? activeItem.color : '#1e293b' }}
            >
              {(activeItem ? activeItem.value : total).toLocaleString()}
            </span>
            <span 
              className="text-[7px] sm:text-[8px] uppercase tracking-widest font-extrabold transition-colors duration-200 mt-0.5"
              style={{ color: activeItem ? activeItem.color : '#94a3b8' }}
            >
              {activeItem ? activeItem.displayName : 'Total Users'}
            </span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '11px'
                }}
                formatter={(val: any) => `${Number(val).toLocaleString()} users`}
              />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={65}
                paddingAngle={2.5}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className="cursor-pointer outline-none focus:outline-none"
              >
                {data.map((entry, index) => {
                  const isHovered = activeIndex === index
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke={isHovered ? entry.color : '#fff'}
                      strokeWidth={isHovered ? 2 : 1}
                      opacity={activeIndex === null || isHovered ? 1 : 0.5}
                      style={{
                        transition: 'all 0.2s ease-in-out',
                        outline: 'none'
                      }}
                    />
                  )
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Right: Custom HTML Legend */}
        <div className="col-span-12 sm:col-span-7 overflow-y-auto max-h-[140px] sm:max-h-[200px] pr-2.5 space-y-1 sm:space-y-1.5 scrollbar-thin">
          {data.map((item, index) => {
            const isHovered = activeIndex === index
            return (
              <div 
                key={item.name} 
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={cn(
                  "flex items-center justify-between text-xs py-1 px-2.5 rounded-xl border transition-all duration-150 cursor-pointer",
                  isHovered 
                    ? 'bg-slate-50 border-slate-200 shadow-sm translate-x-1' 
                    : 'bg-transparent border-transparent'
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-150 group-hover:scale-125" 
                    style={{ backgroundColor: item.color }} 
                  />
                  <span className={cn(
                    "text-xs transition-colors duration-150",
                    isHovered ? 'text-slate-900 font-bold' : 'text-slate-600 font-medium'
                  )}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <span className="font-bold text-slate-800 font-mono">{item.value.toLocaleString()}</span>
                  <span className="text-slate-400 text-[10px] font-normal">({item.percentLabel})</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
