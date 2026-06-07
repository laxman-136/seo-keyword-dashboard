// components/leads/intelligence/TimingComponents.tsx
import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Clock } from 'lucide-react'

interface DayOfWeekChartProps {
  data: Array<{ day: string; leads: number; enrolled: number; convRate: number }>
}

export function DayOfWeekChart({ data }: DayOfWeekChartProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="mb-4">
        <h4 className="text-base font-bold text-slate-800">Lead Volume & Conversion by Day of Week (IST)</h4>
        <p className="text-xs text-slate-400">Best days to prioritise sales team capacity and outreach campaigns</p>
      </div>
      <div className="min-h-[320px]">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
            <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} unit="%" domain={[0, 20]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              formatter={(value: any, name?: any) => [
                name === 'convRate' ? `${value}%` : value,
                name === 'convRate' ? 'Conv Rate' : name === 'leads' ? 'Leads' : 'Enrolled'
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="leads" name="Leads" fill="#6366f1" radius={[4,4,0,0]} opacity={0.85} />
            <Bar yAxisId="left" dataKey="enrolled" name="Enrolled" fill="#10b981" radius={[4,4,0,0]} />
            <Bar yAxisId="right" dataKey="convRate" name="Conv%" fill="#f59e0b" radius={[4,4,0,0]} opacity={0.6} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface HourHeatmapProps {
  heatmapData: Array<{ hour: number; day: string; leads: number; convRate: number }>
  bestHours: Array<{ label: string; leads: number; convRate: number }>
  bestDays: Array<{ label: string; leads: number }>
}

export function HourHeatmap({ heatmapData, bestHours, bestDays }: HourHeatmapProps) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getCount = (day: string, hour: number) => {
    const item = heatmapData.find(d => d.day === day && d.hour === hour)
    return item?.leads || 0
  }

  const maxCount = Math.max(...heatmapData.map(d => d.leads), 1)

  const cellColor = (count: number) => {
    if (count === 0) return '#f8fafc'
    const intensity = count / maxCount
    if (intensity > 0.75) return '#4f46e5'
    if (intensity > 0.5) return '#818cf8'
    if (intensity > 0.25) return '#a5b4fc'
    return '#e0e7ff'
  }

  const hourLabel = (h: number) => {
    if (h === 0) return '12am'
    if (h === 12) return '12pm'
    if (h < 12) return `${h}am`
    return `${h - 12}pm`
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="mb-5">
        <h4 className="text-base font-bold text-slate-800">Lead Activity Heatmap — Hour × Day (IST)</h4>
        <p className="text-xs text-slate-400">Darkest cells indicate highest lead inflow windows. Use to plan calling shifts and ad scheduling.</p>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Hour labels */}
          <div className="flex mb-1 ml-12">
            {hours.filter((_, i) => i % 2 === 0).map(h => (
              <div key={h} className="flex-1 text-center text-[9px] font-bold text-slate-400">{hourLabel(h)}</div>
            ))}
          </div>
          {/* Grid */}
          {days.map(day => (
            <div key={day} className="flex items-center mb-1 gap-0.5">
              <span className="w-12 text-[10px] font-bold text-slate-500 text-right pr-2 shrink-0">{day}</span>
              {hours.map(hour => {
                const count = getCount(day, hour)
                return (
                  <div
                    key={hour}
                    className="flex-1 h-7 rounded-sm cursor-default transition-all hover:opacity-80 border border-white/20"
                    style={{ backgroundColor: cellColor(count) }}
                    title={`${day} ${hourLabel(hour)} IST: ${count} leads`}
                  />
                )
              })}
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 ml-12">
            <span className="text-[10px] font-bold text-slate-400">Low</span>
            {['#e0e7ff','#a5b4fc','#818cf8','#4f46e5'].map(c => (
              <div key={c} className="w-8 h-3 rounded" style={{ backgroundColor: c }} />
            ))}
            <span className="text-[10px] font-bold text-slate-400">High</span>
          </div>
        </div>
      </div>
      {/* Best windows */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-indigo-700">Best Calling Hours</span>
          </div>
          <div className="space-y-1.5">
            {bestHours.slice(0,5).map(h => (
              <div key={h.label} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{h.label}</span>
                <span className="font-bold text-indigo-600">{h.leads} leads · {h.convRate.toFixed(1)}% conv</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700">Best Calling Days</span>
          </div>
          <div className="space-y-1.5">
            {bestDays.slice(0,5).map(d => (
              <div key={d.label} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{d.label}</span>
                <span className="font-bold text-emerald-600">{d.leads} leads received</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
