// components/revenue/RevenueCourseCard.tsx
import React from 'react'
import { RevenueCourseAggregate } from '@/lib/types'
import { formatCurrency, formatROAS } from '@/lib/sheets'
import { Trophy, Award, User, Layers, Calendar, Presentation } from 'lucide-react'
import { cn } from '@/lib/utils'
import ROASBadge from './ROASBadge'

interface RevenueCourseCardProps {
  course: RevenueCourseAggregate
  rank: number
}

export default function RevenueCourseCard({ course, rank }: RevenueCourseCardProps) {
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
          border: 'border-slate-300 bg-slate-50/20',
          title: 'border-slate-300 bg-slate-100/50 text-slate-700',
          icon: <Award className="w-3.5 h-3.5 text-slate-400 fill-slate-400" />,
          label: 'Rank #2 (Silver)'
        }
      case 3:
        return {
          border: 'border-orange-300 bg-orange-50/10',
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
  const totalRev = course.revenue || 1

  // Slices for stacked bar representing revenue source yield
  const paidRev = course.paidRevenue || 0
  const organicRev = course.organicRevenue || 0
  const otherRev = Math.max(0, course.revenue - paidRev - organicRev)

  const slices = [
    { name: 'Organic', amount: organicRev, color: '#16a34a' },
    { name: 'Paid Ads', amount: paidRev, color: '#ea580c' },
    { name: 'Direct/Web/Other', amount: otherRev, color: '#2563eb' }
  ].filter(s => s.amount > 0)

  return (
    <div className={cn(
      "p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-sm relative overflow-hidden bg-white",
      badge.border
    )}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-bold text-slate-800 text-sm leading-snug">{course.courseName}</h4>
          {course.batchNo && (
            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-0.5"><Layers className="w-3 h-3 text-slate-400" /> {course.batchNo}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5"><User className="w-3 h-3 text-slate-400" /> {course.faculty}</span>
            </div>
          )}
        </div>
        <span className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0", badge.title)}>
          {badge.icon}
          {badge.label}
        </span>
      </div>

      {/* Middle row — big number and metrics */}
      <div className="mt-4 flex items-baseline justify-between">
        <div>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{formatCurrency(course.revenue)}</span>
          <span className="text-slate-400 text-xs ml-1 font-semibold">({course.revenueSharePct}%)</span>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <span className="text-xs font-bold text-slate-700">Conversions: <span className="font-mono">{course.conversions}</span></span>
          {course.totalAdSpend > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">ROAS</span>
              <ROASBadge roas={course.roas} />
            </div>
          )}
        </div>
      </div>

      {/* Stacked Revenue Source Yield Bar */}
      <div className="mt-4">
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Revenue Channel Split</p>
        <div className="w-full h-3 bg-slate-50 border border-slate-100 rounded-full overflow-hidden flex">
          {slices.map(slice => {
            const widthPct = (slice.amount / totalRev) * 100
            return (
              <div
                key={slice.name}
                className="h-full first:rounded-l-full last:rounded-r-full hover:scale-y-110 transition-transform cursor-pointer"
                style={{ 
                  width: `${widthPct}%`, 
                  backgroundColor: slice.color 
                }}
                title={`${slice.name}: ${formatCurrency(slice.amount)} (${widthPct.toFixed(1)}%)`}
              />
            )
          })}
        </div>
      </div>

      {/* Breakdown Details */}
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acquisition yield</p>
          <p className="mt-1 text-slate-700 truncate">🔍 Organic: <span className="font-bold font-mono text-emerald-600">{formatCurrency(course.organicRevenue)}</span></p>
          <p className="text-slate-700 truncate">🌐 Paid Ads: <span className="font-bold font-mono text-orange-600">{formatCurrency(course.paidRevenue)}</span></p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Efficiency & Demos</p>
          <p className="mt-1 text-slate-700 truncate">🏛️ Avg. Fee: <span className="font-bold font-mono">{formatCurrency(course.avgFee)}</span></p>
          <p className="text-slate-700 truncate">👥 Demos: <span className="font-bold font-mono text-violet-600">{course.totalDemoAttended}</span></p>
        </div>
      </div>
    </div>
  )
}
