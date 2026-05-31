// components/traffic/TrafficKPICard.tsx
import React from 'react'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrafficKPICardProps {
  title: string
  value: string | number
  prevValue?: number
  isText?: boolean
  icon: LucideIcon
}

export default function TrafficKPICard({
  title,
  value,
  prevValue,
  isText = false,
  icon: Icon
}: TrafficKPICardProps) {
  
  let deltaPercent = 0
  let isPositive = false
  let isNegative = false

  if (!isText && typeof value === 'number' && typeof prevValue === 'number' && prevValue > 0) {
    const diff = value - prevValue
    deltaPercent = (diff / prevValue) * 100
    isPositive = diff > 0
    isNegative = diff < 0
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </h3>
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shadow-sm">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-4">
        <span className="text-3xl font-extrabold tracking-tight text-slate-800">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>

        {/* Delta Percentage Badge */}
        {!isText && prevValue !== undefined && prevValue > 0 && (
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shrink-0",
            isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
            isNegative ? 'bg-red-50 text-red-700 border border-red-100' : 
            'bg-slate-50 text-slate-500 border border-slate-200'
          )}>
            {isPositive ? (
              <>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>{deltaPercent.toFixed(1)}% ▲</span>
              </>
            ) : isNegative ? (
              <>
                <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                <span>{Math.abs(deltaPercent).toFixed(1)}% ▼</span>
              </>
            ) : (
              <>
                <Minus className="w-3.5 h-3.5 text-slate-400" />
                <span>Flat</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Prev baseline text */}
      {!isText && prevValue !== undefined && (
        <div className="text-[10px] text-slate-400 mt-2 font-medium">
          vs previous period: <span className="font-semibold text-slate-500">{prevValue.toLocaleString()}</span>
        </div>
      )}
      
      {isText && (
        <div className="text-[10px] text-slate-400 mt-2 font-medium">
          Primary acquisition driver
        </div>
      )}
    </div>
  )
}
