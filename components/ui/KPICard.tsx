// components/ui/KPICard.tsx
import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export type KPICardVariant = 'green' | 'blue' | 'yellow' | 'orange' | 'red' | 'gray'

interface KPICardProps {
  title: string
  value: number
  prevValue?: number
  variant: KPICardVariant
}

export default function KPICard({
  title,
  value,
  prevValue = 0,
  variant
}: KPICardProps) {
  
  const delta = value - prevValue
  const isPositive = delta > 0
  const isNegative = delta < 0
  
  // Custom styled tokens mapping each band variant to its premium styles
  const styles: Record<KPICardVariant, {
    bg: string
    border: string
    titleText: string
    numberText: string
    deltaBg: string
    deltaText: string
  }> = {
    green: {
      bg: 'bg-emerald-50/50 hover:bg-emerald-50/80',
      border: 'border-emerald-100',
      titleText: 'text-emerald-700',
      numberText: 'text-emerald-600',
      deltaBg: 'bg-emerald-100/70',
      deltaText: 'text-emerald-800'
    },
    blue: {
      bg: 'bg-blue-50/50 hover:bg-blue-50/80',
      border: 'border-blue-100',
      titleText: 'text-blue-700',
      numberText: 'text-blue-600',
      deltaBg: 'bg-blue-100/70',
      deltaText: 'text-blue-800'
    },
    yellow: {
      bg: 'bg-amber-50/50 hover:bg-amber-50/80',
      border: 'border-amber-100',
      titleText: 'text-amber-700',
      numberText: 'text-amber-600',
      deltaBg: 'bg-amber-100/70',
      deltaText: 'text-amber-800'
    },
    orange: {
      bg: 'bg-orange-50/50 hover:bg-orange-50/80',
      border: 'border-orange-100',
      titleText: 'text-orange-700',
      numberText: 'text-orange-600',
      deltaBg: 'bg-orange-100/70',
      deltaText: 'text-orange-800'
    },
    red: {
      bg: 'bg-red-50/50 hover:bg-red-50/80',
      border: 'border-red-100',
      titleText: 'text-red-700',
      numberText: 'text-red-600',
      deltaBg: 'bg-red-100/70',
      deltaText: 'text-red-800'
    },
    gray: {
      bg: 'bg-slate-50/60 hover:bg-slate-50/90',
      border: 'border-slate-200',
      titleText: 'text-slate-500',
      numberText: 'text-slate-700',
      deltaBg: 'bg-slate-200/60',
      deltaText: 'text-slate-700'
    }
  }

  const s = styles[variant]

  return (
    <div className={cn(
      "card kpi-card p-3 sm:p-4 md:p-6 rounded-2xl border transition-all duration-200 shadow-sm flex flex-col justify-between",
      s.bg,
      s.border
    )}>
      {/* Card Header Title */}
      <h3 className={cn("text-xs font-bold uppercase tracking-wider", s.titleText)}>
        {title}
      </h3>

      {/* Value section */}
      <div className="flex items-baseline justify-between mt-2 sm:mt-3 md:mt-4">
        <span className={cn("text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight", s.numberText)}>
          {value}
        </span>

        {/* Vs Last Month Delta Tag */}
        <div className={cn(
          "flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shrink-0",
          isPositive ? 'bg-emerald-100/80 text-emerald-800' :
          isNegative ? 'bg-red-100/80 text-red-800' : 'bg-slate-100 text-slate-500'
        )}>
          {isPositive ? (
            <>
              <TrendingUp className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5" />
              <span className="hidden sm:inline">+{delta} ↑</span>
              <span className="sm:hidden">+{delta}</span>
            </>
          ) : isNegative ? (
            <>
              <TrendingDown className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5" />
              <span className="hidden sm:inline">{delta} ↓</span>
              <span className="sm:hidden">{delta}</span>
            </>
          ) : (
            <>
              <Minus className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5" />
              <span>Flat</span>
            </>
          )}
        </div>
      </div>

      {/* Previous month baseline text */}
      <div className="text-[8px] sm:text-[10px] text-slate-400 mt-1 sm:mt-2 font-medium hidden sm:block">
        vs last month baseline: <span className="font-semibold text-slate-500">{prevValue}</span>
      </div>
    </div>
  )
}
