// components/leads/LeadsCourseCard.tsx
import React from 'react'
import { LeadsCourseAggregate } from '@/lib/types'
import { STATUS_COLORS } from '@/lib/sheets'
import { Trophy, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeadsCourseCardProps {
  course: LeadsCourseAggregate
  rank: number
}

export default function LeadsCourseCard({ course, rank }: LeadsCourseCardProps) {
  const getRankBadge = () => {
    switch (rank) {
      case 1:
        return {
          border: 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/10',
          title: 'border-amber-200 bg-amber-100/50 text-amber-800',
          icon: <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />,
          label: 'Rank #1 (Gold)'
        }
      case 2:
        return {
          border: 'border-slate-350 bg-slate-50/20',
          title: 'border-slate-300 bg-slate-100/50 text-slate-700',
          icon: <Award className="w-3.5 h-3.5 text-slate-400 fill-slate-400" />,
          label: 'Rank #2 (Silver)'
        }
      case 3:
        return {
          border: 'border-orange-350 bg-orange-50/10',
          title: 'border-orange-200 bg-orange-100/50 text-orange-850',
          icon: <Award className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />,
          label: 'Rank #3 (Bronze)'
        }
      default:
        return {
          border: 'border-slate-200 bg-white hover:border-slate-300',
          title: 'border-slate-100 bg-slate-50 text-slate-500',
          icon: null,
          label: `Rank #${rank}`
        }
    }
  }

  const badge = getRankBadge()
  const total = course.total || 1

  // Status slices for the horizontal stacked bar
  const funnelSlices = [
    { name: 'Enrolled', count: course.enrolled, color: STATUS_COLORS['Enrolled'] },
    { name: 'High Potential', count: course.highPotential, color: STATUS_COLORS['High Potential'] },
    { name: 'Medium Potential', count: course.mediumPotential, color: STATUS_COLORS['Medium Potential'] },
    { name: 'Fresh/Unqualified', count: course.freshUnqualified, color: STATUS_COLORS['Fresh/Unqualified'] },
    { name: 'Low/Cold', count: course.lowCold, color: STATUS_COLORS['Low/Cold'] }
  ].filter(s => s.count > 0)

  return (
    <div className={cn(
      "card p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-sm relative overflow-hidden bg-white",
      badge.border
    )}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-bold text-slate-800 text-sm leading-snug">{course.courseName}</h4>
        <span className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0", badge.title)}>
          {badge.icon}
          {badge.label}
        </span>
      </div>

      {/* Middle row — big number and metrics */}
      <div className="mt-4 flex items-baseline justify-between">
        <div>
          <span className="text-3xl font-extrabold text-slate-900">{course.total}</span>
          <span className="text-slate-400 text-xs ml-1 font-semibold">Leads ({course.sharePercent}%)</span>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-emerald-600">Conv: {course.convRate}%</p>
        </div>
      </div>

      {/* Stacked Funnel Bar */}
      <div className="mt-4">
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Pipeline Funnel</p>
        <div className="w-full h-3 bg-slate-50 border border-slate-100 rounded-full overflow-hidden flex">
          {funnelSlices.map(slice => {
            const widthPct = (slice.count / total) * 100
            return (
              <div
                key={slice.name}
                className="h-full first:rounded-l-full last:rounded-r-full hover:scale-y-110 transition-transform cursor-pointer"
                style={{ 
                  width: `${widthPct}%`, 
                  backgroundColor: slice.color 
                }}
                title={`${slice.name}: ${slice.count} leads (${widthPct.toFixed(1)}%)`}
              />
            )
          })}
        </div>
      </div>

      {/* Breakdown Details */}
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acquisition</p>
          <p className="mt-1 text-slate-700">🌐 Web: <span className="font-bold font-mono">{course.website}</span></p>
          <p className="text-slate-700">🔍 Org: <span className="font-bold font-mono">{course.organic}</span></p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quality status</p>
          <p className="mt-1 text-slate-700">🏆 Enr: <span className="font-bold font-mono text-emerald-600">{course.enrolled}</span></p>
          <p className="text-slate-700">🔥 High: <span className="font-bold font-mono text-blue-600">{course.highPotential}</span></p>
        </div>
      </div>
    </div>
  )
}
