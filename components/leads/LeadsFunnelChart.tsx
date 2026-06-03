// components/leads/LeadsFunnelChart.tsx
import React from 'react'
import { LeadsFunnelData } from '@/lib/types'
import { STATUS_COLORS } from '@/lib/sheets'

interface LeadsFunnelChartProps {
  funnel: LeadsFunnelData
}

export default function LeadsFunnelChart({ funnel }: LeadsFunnelChartProps) {
  // Funnel segments definition
  const segments = [
    { label: "Total Leads", count: funnel.total, pct: 100, color: "#0f172a", emoji: "📋" }, // slate-900
    { label: "High Potential", count: funnel.highPotential, pct: funnel.highPotentialPct, color: STATUS_COLORS["High Potential"], emoji: "🔥" },
    { label: "Medium Potential", count: funnel.mediumPotential, pct: funnel.mediumPotentialPct, color: STATUS_COLORS["Medium Potential"], emoji: "⚡" },
    { label: "Fresh/Unqualified", count: funnel.freshUnqualified, pct: funnel.freshUnqualifiedPct, color: STATUS_COLORS["Fresh/Unqualified"], emoji: "❄️" },
    { label: "Low/Cold", count: funnel.lowCold, pct: funnel.lowColdPct, color: STATUS_COLORS["Low/Cold"], emoji: "🗑️" },
    { label: "Enrolled", count: funnel.enrolled, pct: funnel.enrolledPct, color: STATUS_COLORS["Enrolled"], emoji: "🏆" }
  ]

  // Render SVG trapezoids
  // SVG size: 600 x 360
  // Slices: 6
  // Slices height: 50 each
  // Gap: 6
  const sliceHeight = 50
  const gap = 6
  
  // X coordinates calculations for top and bottom of each trapezoid
  // The funnel width narrows down linearly from 500 (top) to 120 (bottom)
  const getXCoords = (index: number) => {
    const totalSlices = segments.length
    const startTopWidth = 520
    const endBottomWidth = 140
    
    const topWidth = startTopWidth - (index / totalSlices) * (startTopWidth - endBottomWidth)
    const bottomWidth = startTopWidth - ((index + 1) / totalSlices) * (startTopWidth - endBottomWidth)
    
    const xTopStart = (600 - topWidth) / 2
    const xTopEnd = xTopStart + topWidth
    const xBottomStart = (600 - bottomWidth) / 2
    const xBottomEnd = xBottomStart + bottomWidth
    
    return {
      points: `${xTopStart},${index * (sliceHeight + gap)} ${xTopEnd},${index * (sliceHeight + gap)} ${xBottomEnd},${index * (sliceHeight + gap) + sliceHeight} ${xBottomStart},${index * (sliceHeight + gap) + sliceHeight}`,
      center: {
        x: 300,
        y: index * (sliceHeight + gap) + (sliceHeight / 2) + 4
      }
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center">
      <div className="w-full mb-6">
        <h3 className="font-bold text-slate-800 text-sm">📊 Pipeline Funnel Chart</h3>
        <p className="text-xs text-slate-400 mt-0.5">Visual representation of lead conversion and status drops</p>
      </div>

      <div className="w-full max-w-[600px] aspect-[5/3] relative">
        <svg viewBox="0 0 600 336" className="w-full h-full filter drop-shadow-md">
          {segments.map((seg, i) => {
            const coords = getXCoords(i)
            return (
              <g key={seg.label} className="group cursor-pointer">
                {/* Trapezoid Shape */}
                <polygon
                  points={coords.points}
                  fill={seg.color}
                  opacity={0.9}
                  className="transition-all duration-300 hover:opacity-100 hover:brightness-105"
                />
                
                {/* Text Label */}
                <text
                  x={coords.center.x}
                  y={coords.center.y}
                  textAnchor="middle"
                  fill="white"
                  className="text-xs font-bold tracking-wide pointer-events-none select-none"
                >
                  {seg.emoji} {seg.label}: {seg.count} ({seg.pct.toFixed(1)}%)
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-6 border-t border-slate-100 pt-4 w-full text-[11px] font-semibold text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#0f172a" }} />
          <span>Total Leads</span>
        </div>
        {segments.slice(1).map(seg => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span>{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
