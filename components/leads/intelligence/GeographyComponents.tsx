// components/leads/intelligence/GeographyComponents.tsx
import React, { useState } from 'react'
import { MapPin, TrendingUp, Award } from 'lucide-react'

export interface StateMetric {
  state: string
  stateCode: string
  totalLeads: number
  enrolled: number
  convRate: number
  revenue: number
  quality: 'High' | 'Medium' | 'Low'
}

interface IndiaStateMapProps {
  stateMetrics: StateMetric[]
  metric: 'leads' | 'convRate' | 'revenue'
}

// Simplified India SVG state positions (approximate centroids for labelling)
const STATE_POSITIONS: Record<string, { x: number; y: number; label: string }> = {
  'MH': { x: 180, y: 310, label: 'Maharashtra' },
  'KA': { x: 195, y: 370, label: 'Karnataka' },
  'TN': { x: 210, y: 420, label: 'Tamil Nadu' },
  'TS': { x: 225, y: 340, label: 'Telangana' },
  'AP': { x: 230, y: 375, label: 'Andhra Pradesh' },
  'KL': { x: 195, y: 420, label: 'Kerala' },
  'GJ': { x: 140, y: 270, label: 'Gujarat' },
  'RJ': { x: 160, y: 220, label: 'Rajasthan' },
  'MP': { x: 210, y: 255, label: 'Madhya Pradesh' },
  'UP': { x: 240, y: 210, label: 'Uttar Pradesh' },
  'DL': { x: 215, y: 190, label: 'Delhi' },
  'HR': { x: 205, y: 175, label: 'Haryana' },
  'PB': { x: 195, y: 155, label: 'Punjab' },
  'WB': { x: 295, y: 255, label: 'West Bengal' },
  'OR': { x: 270, y: 295, label: 'Odisha' },
  'BR': { x: 270, y: 230, label: 'Bihar' },
  'JH': { x: 275, y: 260, label: 'Jharkhand' },
  'CH': { x: 245, y: 290, label: 'Chhattisgarh' },
}

export function IndiaStateMap({ stateMetrics, metric }: IndiaStateMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null)

  const maxValue = Math.max(...stateMetrics.map(s => {
    if (metric === 'leads') return s.totalLeads
    if (metric === 'convRate') return s.convRate
    return s.revenue
  }), 1)

  const getColor = (stateCode: string) => {
    const s = stateMetrics.find(m => m.stateCode === stateCode)
    if (!s) return '#e2e8f0'
    let val = metric === 'leads' ? s.totalLeads : metric === 'convRate' ? s.convRate : s.revenue
    const ratio = val / maxValue
    if (ratio > 0.75) return '#4f46e5'
    if (ratio > 0.5) return '#818cf8'
    if (ratio > 0.25) return '#a5b4fc'
    if (ratio > 0) return '#c7d2fe'
    return '#e0e7ff'
  }

  const getValue = (stateCode: string) => {
    const s = stateMetrics.find(m => m.stateCode === stateCode)
    if (!s) return '-'
    if (metric === 'leads') return s.totalLeads
    if (metric === 'convRate') return `${s.convRate.toFixed(1)}%`
    return `₹${(s.revenue / 100000).toFixed(1)}L`
  }

  const topStates = [...stateMetrics].sort((a, b) => {
    if (metric === 'leads') return b.totalLeads - a.totalLeads
    if (metric === 'convRate') return b.convRate - a.convRate
    return b.revenue - a.revenue
  }).slice(0, 5)

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="mb-4">
        <h4 className="text-base font-bold text-slate-800">India Geographic Lead Distribution</h4>
        <p className="text-xs text-slate-400">Hover states for details. Colour intensity = {metric === 'leads' ? 'lead volume' : metric === 'convRate' ? 'conversion rate' : 'revenue'}</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Map representation */}
        <div className="flex-1 relative">
          <svg viewBox="0 0 420 550" className="w-full max-w-sm mx-auto" style={{ filter: 'drop-shadow(0 2px 8px rgba(99,102,241,0.08))' }}>
            {/* India outline approximation */}
            <rect x="120" y="120" width="200" height="310" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
            {/* State circles */}
            {Object.entries(STATE_POSITIONS).map(([code, pos]) => {
              const s = stateMetrics.find(m => m.stateCode === code)
              const isHovered = hoveredState === code
              return (
                <g key={code}
                  onMouseEnter={() => setHoveredState(code)}
                  onMouseLeave={() => setHoveredState(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={pos.x} cy={pos.y} r={isHovered ? 14 : 10}
                    fill={getColor(code)}
                    stroke={isHovered ? '#4f46e5' : '#c7d2fe'}
                    strokeWidth={isHovered ? 2 : 1}
                    style={{ transition: 'all 0.15s ease' }}
                  />
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="7" fontWeight="700" fill={isHovered ? '#fff' : '#4f46e5'} style={{ pointerEvents: 'none' }}>
                    {code}
                  </text>
                  {isHovered && (
                    <foreignObject x={pos.x + 15} y={pos.y - 30} width="130" height="70">
                      <div className="bg-slate-900 text-white text-[10px] rounded-lg p-2 font-semibold shadow-xl">
                        <div className="font-bold text-[11px]">{pos.label}</div>
                        <div className="text-slate-300 mt-0.5">{getValue(code)}</div>
                        {s && <div className="text-slate-400">{s.totalLeads} leads · {s.enrolled} enrolled</div>}
                      </div>
                    </foreignObject>
                  )}
                </g>
              )
            })}
          </svg>
          {/* Legend */}
          <div className="flex items-center gap-2 mt-2 justify-center">
            <span className="text-[10px] font-bold text-slate-400">Low</span>
            {['#e0e7ff','#a5b4fc','#818cf8','#4f46e5'].map(c => (
              <div key={c} className="w-8 h-3 rounded" style={{ backgroundColor: c }} />
            ))}
            <span className="text-[10px] font-bold text-slate-400">High</span>
          </div>
        </div>
        {/* Top States panel */}
        <div className="w-full lg:w-72">
          <h5 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" /> Top 5 States
          </h5>
          <div className="space-y-3">
            {topStates.map((s, idx) => (
              <div key={s.state} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-extrabold flex items-center justify-center shrink-0">#{idx+1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{s.state}</span>
                    <span className="text-xs font-extrabold text-indigo-600">
                      {metric === 'leads' ? s.totalLeads : metric === 'convRate' ? `${s.convRate.toFixed(1)}%` : `₹${(s.revenue/100000).toFixed(1)}L`}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 bg-slate-100 rounded-full">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.round(((metric === 'leads' ? s.totalLeads : metric === 'convRate' ? s.convRate : s.revenue) / maxValue) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatComparisonTableProps {
  stateMetrics: StateMetric[]
}

export function StatComparisonTable({ stateMetrics }: StatComparisonTableProps) {
  const sorted = [...stateMetrics].sort((a, b) => b.totalLeads - a.totalLeads)
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h4 className="text-base font-bold text-slate-800">State-wise Leads & Quality Breakdown</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
              <th className="py-3 px-5">State</th>
              <th className="py-3 px-5 text-center">Leads</th>
              <th className="py-3 px-5 text-center">Enrolled</th>
              <th className="py-3 px-5 text-center">Conv Rate</th>
              <th className="py-3 px-5 text-center">Revenue</th>
              <th className="py-3 px-5 text-center">Quality</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {sorted.map(s => (
              <tr key={s.state} className="hover:bg-slate-50/50">
                <td className="py-3.5 px-5 font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />{s.state}
                </td>
                <td className="py-3.5 px-5 text-center">{s.totalLeads}</td>
                <td className="py-3.5 px-5 text-center text-emerald-600 font-bold">{s.enrolled}</td>
                <td className="py-3.5 px-5 text-center text-indigo-600">{s.convRate.toFixed(1)}%</td>
                <td className="py-3.5 px-5 text-center">₹{(s.revenue/100000).toFixed(1)}L</td>
                <td className="py-3.5 px-5 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                    s.quality === 'High' ? 'bg-emerald-50 text-emerald-700' :
                    s.quality === 'Medium' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-slate-50 text-slate-500'
                  }`}>{s.quality}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
