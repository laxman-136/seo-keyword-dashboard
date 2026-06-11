// components/leads/LeadsKPICard.tsx
import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export type LeadsKPICardVariant = 'blue' | 'indigo' | 'green' | 'emerald' | 'amber' | 'purple' | 'red' | 'gray' | 'pink'

interface LeadsKPICardProps {
  title: string
  value: number
  prevValue?: number
  icon: string
  variant: LeadsKPICardVariant
  isPercent?: boolean
  subtitle?: string
}

const STYLES: Record<LeadsKPICardVariant, {
  gradient: string
  iconBg: string
  accentBar: string
  valueText: string
  badgePos: string
  badgeNeg: string
}> = {
  blue:    { gradient: 'from-blue-50 to-white',    iconBg: 'bg-blue-100',    accentBar: 'bg-blue-400',    valueText: 'text-blue-900',   badgePos: 'bg-emerald-50 border-emerald-200 text-emerald-700', badgeNeg: 'bg-red-50 border-red-200 text-red-700' },
  indigo:  { gradient: 'from-indigo-50 to-white',  iconBg: 'bg-indigo-100',  accentBar: 'bg-indigo-400',  valueText: 'text-indigo-900', badgePos: 'bg-emerald-50 border-emerald-200 text-emerald-700', badgeNeg: 'bg-red-50 border-red-200 text-red-700' },
  green:   { gradient: 'from-emerald-50 to-white', iconBg: 'bg-emerald-100', accentBar: 'bg-emerald-400', valueText: 'text-emerald-900',badgePos: 'bg-emerald-50 border-emerald-200 text-emerald-700', badgeNeg: 'bg-red-50 border-red-200 text-red-700' },
  emerald: { gradient: 'from-teal-50 to-white',    iconBg: 'bg-teal-100',    accentBar: 'bg-teal-400',    valueText: 'text-teal-900',   badgePos: 'bg-emerald-50 border-emerald-200 text-emerald-700', badgeNeg: 'bg-red-50 border-red-200 text-red-700' },
  amber:   { gradient: 'from-amber-50 to-white',   iconBg: 'bg-amber-100',   accentBar: 'bg-amber-400',   valueText: 'text-amber-900',  badgePos: 'bg-emerald-50 border-emerald-200 text-emerald-700', badgeNeg: 'bg-red-50 border-red-200 text-red-700' },
  purple:  { gradient: 'from-violet-50 to-white',  iconBg: 'bg-violet-100',  accentBar: 'bg-violet-400',  valueText: 'text-violet-900', badgePos: 'bg-emerald-50 border-emerald-200 text-emerald-700', badgeNeg: 'bg-red-50 border-red-200 text-red-700' },
  red:     { gradient: 'from-red-50 to-white',     iconBg: 'bg-red-100',     accentBar: 'bg-red-400',     valueText: 'text-red-900',    badgePos: 'bg-emerald-50 border-emerald-200 text-emerald-700', badgeNeg: 'bg-red-50 border-red-200 text-red-700' },
  gray:    { gradient: 'from-slate-50 to-white',   iconBg: 'bg-slate-100',   accentBar: 'bg-slate-300',   valueText: 'text-slate-800',  badgePos: 'bg-emerald-50 border-emerald-200 text-emerald-700', badgeNeg: 'bg-red-50 border-red-200 text-red-700' },
  pink:    { gradient: 'from-pink-50 to-white',    iconBg: 'bg-pink-100',    accentBar: 'bg-pink-400',    valueText: 'text-pink-900',   badgePos: 'bg-emerald-50 border-emerald-200 text-emerald-700', badgeNeg: 'bg-red-50 border-red-200 text-red-700' },
}

export default function LeadsKPICard({
  title,
  value,
  prevValue = 0,
  icon,
  variant,
  isPercent = false,
  subtitle,
}: LeadsKPICardProps) {
  const s = STYLES[variant]
  const delta = value - prevValue
  const isPositive = delta > 0
  const isNegative = delta < 0
  const pctChange = prevValue > 0 ? ((delta / prevValue) * 100).toFixed(1) : null

  const formatVal = (v: number) =>
    isPercent ? `${v.toFixed(1)}%` : v.toLocaleString()

  const formatDelta = (d: number) => {
    const abs = Math.abs(d)
    const str = isPercent ? `${abs.toFixed(1)}pp` : abs.toLocaleString()
    return d > 0 ? `+${str}` : `-${str}`
  }

  return (
    <div className={cn(
      'relative group bg-gradient-to-b rounded-2xl border border-slate-200/80 shadow-sm',
      'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden',
      s.gradient
    )}>
      {/* Accent bar top */}
      <div className={cn('absolute top-0 left-0 right-0 h-[3px]', s.accentBar)} />

      <div className="p-5">
        {/* Header row: label + icon */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em] leading-none">
              {title}
            </p>
            {subtitle && (
              <p className="text-[10px] text-slate-400 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-sm',
            s.iconBg
          )}>
            {icon}
          </div>
        </div>

        {/* Value */}
        <p className={cn('text-3xl font-extrabold tracking-tight leading-none mb-3', s.valueText)}>
          {formatVal(value)}
        </p>

        {/* Footer: delta badge + prev month */}
        <div className="flex items-center justify-between gap-2">
          {/* Delta badge */}
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold',
            delta === 0
              ? 'bg-slate-50 border-slate-200 text-slate-500'
              : isPositive
                ? s.badgePos
                : s.badgeNeg
          )}>
            {isPositive
              ? <TrendingUp className="w-3 h-3" />
              : isNegative
                ? <TrendingDown className="w-3 h-3" />
                : <Minus className="w-3 h-3 text-slate-400" />}
            {delta === 0 ? 'No change' : formatDelta(delta)}
          </span>

          {/* % change vs prev */}
          {pctChange && (
            <span className="text-[10px] text-slate-400 font-medium">
              {delta > 0 ? '+' : ''}{pctChange}% MoM
            </span>
          )}
        </div>

        {/* Prev value footnote */}
        {prevValue > 0 && (
          <p className="text-[10px] text-slate-400 mt-2 font-medium">
            Prev: <span className="text-slate-500 font-semibold">{formatVal(prevValue)}</span>
          </p>
        )}
      </div>
    </div>
  )
}
