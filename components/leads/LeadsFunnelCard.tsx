// components/leads/LeadsFunnelCard.tsx
import React from 'react'
import { LeadsFunnelData } from '@/lib/types'
import { cn } from '@/lib/utils'

interface FunnelItem {
  name: string
  count: number
  pct: number
  emoji: string
  color: string
  bg: string
  textColor: string
  borderColor: string
}

interface LeadsFunnelCardProps {
  funnel: LeadsFunnelData
  compareWith?: LeadsFunnelData
  compareLabel?: string
  title?: string
}

const ITEMS: Array<Omit<FunnelItem, 'count' | 'pct'>> = [
  { name: 'Enrolled',          emoji: '🏆', color: '#16a34a', bg: 'bg-emerald-500', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' },
  { name: 'High Potential',    emoji: '🔥', color: '#2563eb', bg: 'bg-blue-500',    textColor: 'text-blue-700',    borderColor: 'border-blue-200'    },
  { name: 'Medium Potential',  emoji: '⚡', color: '#ca8a04', bg: 'bg-amber-500',   textColor: 'text-amber-700',   borderColor: 'border-amber-200'   },
  { name: 'Fresh/Unqualified', emoji: '❄️', color: '#6b7280', bg: 'bg-slate-400',   textColor: 'text-slate-600',   borderColor: 'border-slate-200'   },
  { name: 'Low/Cold',          emoji: '🗑️', color: '#dc2626', bg: 'bg-red-500',     textColor: 'text-red-700',     borderColor: 'border-red-200'     },
]

function getFunnelValues(funnel: LeadsFunnelData): Array<{ count: number; pct: number }> {
  return [
    { count: funnel.enrolled,        pct: funnel.enrolledPct        },
    { count: funnel.highPotential,   pct: funnel.highPotentialPct   },
    { count: funnel.mediumPotential, pct: funnel.mediumPotentialPct },
    { count: funnel.freshUnqualified,pct: funnel.freshUnqualifiedPct},
    { count: funnel.lowCold,         pct: funnel.lowColdPct         },
  ]
}

export default function LeadsFunnelCard({
  funnel,
  compareWith,
  compareLabel = 'Prev Month',
  title = 'Pipeline Funnel',
}: LeadsFunnelCardProps) {
  const current = getFunnelValues(funnel)
  const prev = compareWith ? getFunnelValues(compareWith) : null

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">🎯 {title}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Lead status distribution & conversion stages</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
            {funnel.total} leads
          </span>
          {compareWith && (
            <span className="text-[11px] font-bold text-violet-600 bg-violet-50 border border-violet-200 px-3 py-1 rounded-xl">
              vs {compareLabel}: {compareWith.total}
            </span>
          )}
        </div>
      </div>

      {/* Column headers when comparing */}
      {prev && (
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span>Stage</span>
          <span className="text-right min-w-[52px]">Current</span>
          <span className="text-right min-w-[52px]">{compareLabel}</span>
          <span className="text-right min-w-[44px]">Δ</span>
        </div>
      )}

      {/* Funnel rows */}
      <div className="px-5 py-4 space-y-4">
        {ITEMS.map((item, idx) => {
          const cur = current[idx]
          const pre = prev ? prev[idx] : null
          const delta = pre ? cur.count - pre.count : null

          return (
            <div key={item.name}>
              {/* Label row */}
              <div className={cn(
                'flex items-center gap-x-4 mb-2',
                prev ? 'grid grid-cols-[1fr_auto_auto_auto]' : 'justify-between'
              )}>
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 min-w-0">
                  <span className="text-base shrink-0">{item.emoji}</span>
                  <span className="truncate">{item.name}</span>
                </span>

                {/* Current value */}
                <span className={cn(
                  'text-sm font-extrabold font-mono min-w-[52px] text-right',
                  item.textColor
                )}>
                  {cur.count}
                  <span className="text-[10px] font-normal text-slate-400 ml-1">({cur.pct.toFixed(0)}%)</span>
                </span>

                {/* Prev value */}
                {pre && (
                  <span className="text-sm font-mono text-slate-400 min-w-[52px] text-right">
                    {pre.count}
                  </span>
                )}

                {/* Delta */}
                {delta !== null && (
                  <span className={cn(
                    'text-[11px] font-bold min-w-[44px] text-right',
                    delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-500' : 'text-slate-400'
                  )}>
                    {delta > 0 ? `+${delta}` : delta === 0 ? '—' : delta}
                  </span>
                )}

                {/* No compare: just pct */}
                {!prev && (
                  <span className="text-xs font-semibold text-slate-400">{cur.pct.toFixed(1)}%</span>
                )}
              </div>

              {/* Progress bar(s) */}
              <div className="relative">
                {/* Background track */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', item.bg)}
                    style={{ width: `${Math.max(cur.pct, 1)}%`, opacity: 0.9 }}
                  />
                </div>
                {/* Prev month overlay marker */}
                {pre && pre.pct > 0 && (
                  <div
                    className="absolute top-0 h-2.5 w-0.5 bg-slate-400/60 rounded-full"
                    style={{ left: `${Math.min(pre.pct, 99)}%` }}
                    title={`${compareLabel}: ${pre.count} (${pre.pct.toFixed(1)}%)`}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Conversion rate footer */}
      <div className="mx-5 mb-4 mt-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Conversion Rate</p>
          <p className="text-lg font-extrabold text-emerald-700 mt-0.5">
            {funnel.total > 0 ? ((funnel.enrolled / funnel.total) * 100).toFixed(1) : '0.0'}%
          </p>
        </div>
        {compareWith && compareWith.total > 0 && (
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{compareLabel}</p>
            <p className="text-lg font-extrabold text-slate-500 mt-0.5">
              {((compareWith.enrolled / compareWith.total) * 100).toFixed(1)}%
            </p>
          </div>
        )}
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Leads / Enroll</p>
          <p className="text-lg font-extrabold text-slate-800 mt-0.5">
            {funnel.enrolled > 0 ? Math.round(funnel.total / funnel.enrolled) : '—'}×
          </p>
        </div>
      </div>
    </div>
  )
}
