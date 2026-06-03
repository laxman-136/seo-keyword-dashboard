// components/revenue/RevenueMonthSelector.tsx
'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RevenueMonthSelectorProps {
  months: string[]
  selected: string
  onChange: (m: string) => void
  selectedCompare?: string
  onChangeCompare?: (m: string) => void
  label?: string
}

export default function RevenueMonthSelector({
  months,
  selected,
  onChange,
  selectedCompare,
  onChangeCompare,
  label = 'Analyze Month'
}: RevenueMonthSelectorProps) {
  const [compareOpen, setCompareOpen] = useState(false)
  const [mainOpen, setMainOpen] = useState(false)
  const compareRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)

  const usePills = months.length <= 7

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (compareRef.current && !compareRef.current.contains(e.target as Node)) {
        setCompareOpen(false)
      }
      if (mainRef.current && !mainRef.current.contains(e.target as Node)) {
        setMainOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const parseMonth = (m: string) => {
    const parts = m.trim().split(' ')
    return { short: parts[0] ?? m, year: parts[1] ?? '' }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* ── PRIMARY MONTH SELECTOR ── */}
      <div className="flex flex-col gap-1.5">
        {/* Label row */}
        <div className="flex items-center gap-1.5 px-0.5">
          <div className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center border border-slate-700">
            <Calendar className="w-3 h-3 text-violet-400" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em]">
            {label}
          </span>
        </div>

        {/* PILL TABS — when ≤7 months */}
        {usePills && (
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-inner">
            {months.map((m, idx) => {
              const { short, year } = parseMonth(m)
              const isActive = m === selected
              const isLatest = idx === months.length - 1

              return (
                <button
                  key={m}
                  onClick={() => onChange(m)}
                  title={m}
                  className={cn(
                    'relative flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl text-center transition-all duration-200 select-none focus:outline-none min-w-[64px]',
                    isActive
                      ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  )}
                >
                  {isLatest && !isActive && (
                    <span className="absolute -top-1.5 -right-1 text-[7px] font-extrabold bg-emerald-500 text-white px-1 py-[1px] rounded-full leading-none tracking-wide shadow-sm animate-pulse">
                      NEW
                    </span>
                  )}
                  <span className={cn(
                    'text-[12px] font-bold leading-none',
                    isActive ? 'text-white' : 'text-slate-300'
                  )}>
                    {short}
                  </span>
                  <span className={cn(
                    'text-[9px] font-medium mt-[2px] leading-none',
                    isActive ? 'text-violet-200' : 'text-slate-500'
                  )}>
                    {year}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* DROPDOWN — when >7 months */}
        {!usePills && (
          <div ref={mainRef} className="relative">
            <button
              onClick={() => setMainOpen(v => !v)}
              className={cn(
                'flex items-center gap-2.5 pl-4 pr-3 py-2.5 rounded-xl border text-sm font-bold transition-all duration-150 min-w-[160px] shadow-sm outline-none',
                mainOpen
                  ? 'border-violet-500 bg-slate-800 text-violet-400 ring-2 ring-violet-500/10'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
              )}
            >
              <div className={cn(
                'w-2 h-2 rounded-full transition-colors',
                mainOpen ? 'bg-violet-400' : 'bg-emerald-400'
              )} />
              <span className="flex-1 text-left">{selected}</span>
              <ChevronDown className={cn(
                'w-4 h-4 transition-transform duration-200',
                mainOpen ? 'rotate-180 text-violet-400' : 'text-slate-500'
              )} />
            </button>

            {mainOpen && (
              <div className="absolute top-full mt-2 left-0 z-50 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 min-w-[180px]">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2">
                  Select Month
                </p>
                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  {months.map((m, idx) => {
                    const isActive = m === selected
                    const isLatest = idx === months.length - 1
                    return (
                      <button
                        key={m}
                        onClick={() => { onChange(m); setMainOpen(false) }}
                        className={cn(
                          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-medium text-left transition-all',
                          isActive
                            ? 'bg-slate-800 text-violet-400 font-semibold'
                            : 'hover:bg-slate-800/60 text-slate-300'
                        )}
                      >
                        <span>{m}</span>
                        <div className="flex items-center gap-1.5">
                          {isLatest && !isActive && (
                            <span className="text-[8px] font-bold bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full">
                              NEW
                            </span>
                          )}
                          {isActive && <Check className="w-3.5 h-3.5 text-violet-400" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── COMPARE DROPDOWN (optional) ── */}
      {onChangeCompare && selectedCompare !== undefined && (
        <div ref={compareRef} className="relative flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 px-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em]">
              Compare vs
            </span>
          </div>

          <button
            onClick={() => setCompareOpen(v => !v)}
            className={cn(
              'flex items-center gap-2.5 pl-4 pr-3 py-2.5 rounded-xl border text-sm font-bold transition-all duration-150 min-w-[150px] shadow-sm outline-none',
              compareOpen
                ? 'border-amber-500 bg-slate-800 text-amber-400 ring-2 ring-amber-500/10'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
            )}
          >
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="flex-1 text-left">{selectedCompare || 'Select'}</span>
            <ChevronDown className={cn(
              'w-4 h-4 transition-transform duration-200',
              compareOpen ? 'rotate-180 text-amber-500' : 'text-slate-500'
            )} />
          </button>

          {compareOpen && (
            <div className="absolute top-full mt-2 left-0 z-50 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 min-w-[160px]">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2">
                Compare Month
              </p>
              {months.map(m => {
                const isDisabled = m === selected
                const isChosen = m === selectedCompare
                return (
                  <button
                    key={m}
                    disabled={isDisabled}
                    onClick={() => { onChangeCompare(m); setCompareOpen(false) }}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-medium text-left transition-all',
                      isDisabled ? 'opacity-30 cursor-not-allowed text-slate-600'
                        : isChosen ? 'bg-slate-800 text-amber-400 font-semibold'
                        : 'hover:bg-slate-800/60 text-slate-300'
                    )}
                  >
                    <span>{m}</span>
                    {isChosen && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
