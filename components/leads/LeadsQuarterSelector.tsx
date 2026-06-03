// components/leads/LeadsQuarterSelector.tsx
'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeadsQuarterSelectorProps {
  quarters: string[]
  selected: string
  onChange: (q: string) => void
  selectedCompare?: string
  onChangeCompare?: (q: string) => void
  label?: string
}

export default function LeadsQuarterSelector({
  quarters,
  selected,
  onChange,
  selectedCompare,
  onChangeCompare,
  label = 'Analyze Quarter'
}: LeadsQuarterSelectorProps) {
  const [compareOpen, setCompareOpen] = useState(false)
  const [mainOpen, setMainOpen] = useState(false)
  const compareRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)

  const usePills = quarters.length <= 6

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

  const parseQuarter = (q: string) => {
    const parts = q.trim().split(' ')
    return { year: parts[0] ?? '', qtr: parts[1] ?? q }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* ── PRIMARY QUARTER SELECTOR ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 px-0.5">
          <div className="w-5 h-5 rounded-md bg-violet-100 flex items-center justify-center">
            <Calendar className="w-3 h-3 text-violet-600" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em]">
            {label}
          </span>
        </div>

        {/* PILL TABS — when ≤6 quarters */}
        {usePills && (
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200/80 rounded-2xl p-1 shadow-inner">
            {quarters.map((q, idx) => {
              const { year, qtr } = parseQuarter(q)
              const isActive = q === selected
              const isLatest = idx === quarters.length - 1

              return (
                <button
                  key={q}
                  onClick={() => onChange(q)}
                  title={q}
                  className={cn(
                    'relative flex flex-col items-center justify-center px-4 py-1.5 rounded-xl text-center transition-all duration-200 select-none focus:outline-none min-w-[70px]',
                    isActive
                      ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 scale-[1.02]'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white hover:shadow-sm'
                  )}
                >
                  {isLatest && !isActive && (
                    <span className="absolute -top-1.5 -right-1 text-[7px] font-extrabold bg-emerald-500 text-white px-1 py-[1px] rounded-full leading-none tracking-wide shadow-sm animate-pulse">
                      NEW
                    </span>
                  )}
                  <span className={cn(
                    'text-[12px] font-bold leading-none',
                    isActive ? 'text-white' : 'text-slate-700'
                  )}>
                    {qtr}
                  </span>
                  <span className={cn(
                    'text-[9px] font-medium mt-[2px] leading-none',
                    isActive ? 'text-violet-200' : 'text-slate-400'
                  )}>
                    {year}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* DROPDOWN — when >6 quarters */}
        {!usePills && (
          <div ref={mainRef} className="relative">
            <button
              onClick={() => setMainOpen(v => !v)}
              className={cn(
                'flex items-center gap-2.5 pl-4 pr-3 py-2.5 rounded-xl border text-sm font-bold transition-all duration-150 min-w-[160px] shadow-sm outline-none',
                mainOpen
                  ? 'border-violet-400 bg-violet-50 text-violet-750 ring-2 ring-violet-400/20'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-violet-300 hover:bg-violet-50/40'
              )}
            >
              <div className={cn(
                'w-2 h-2 rounded-full transition-colors',
                mainOpen ? 'bg-violet-500' : 'bg-emerald-500'
              )} />
              <span className="flex-1 text-left">{selected}</span>
              <ChevronDown className={cn(
                'w-4 h-4 transition-transform duration-200',
                mainOpen ? 'rotate-180 text-violet-500' : 'text-slate-400'
              )} />
            </button>

            {mainOpen && (
              <div className="absolute top-full mt-2 left-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 p-1.5 min-w-[180px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
                  Select Quarter
                </p>
                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  {quarters.map((q, idx) => {
                    const isActive = q === selected
                    const isLatest = idx === quarters.length - 1
                    return (
                      <button
                        key={q}
                        onClick={() => { onChange(q); setMainOpen(false) }}
                        className={cn(
                          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-medium text-left transition-all',
                          isActive
                            ? 'bg-violet-50 text-violet-700 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        )}
                      >
                        <span>{q}</span>
                        <div className="flex items-center gap-1.5">
                          {isLatest && !isActive && (
                            <span className="text-[8px] font-bold bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">
                              NEW
                            </span>
                          )}
                          {isActive && <Check className="w-3.5 h-3.5 text-violet-500" />}
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

      {/* ── COMPARE DROPDOWN ── */}
      {onChangeCompare && selectedCompare !== undefined && (
        <div ref={compareRef} className="relative flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 px-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em]">
              Compare vs
            </span>
          </div>

          <button
            onClick={() => setCompareOpen(v => !v)}
            className={cn(
              'flex items-center gap-2.5 pl-4 pr-3 py-2.5 rounded-xl border text-sm font-bold transition-all duration-150 min-w-[150px] shadow-sm outline-none',
              compareOpen
                ? 'border-amber-400 bg-amber-50 text-amber-700 ring-2 ring-amber-400/20'
                : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/40'
            )}
          >
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="flex-1 text-left">{selectedCompare || 'Select'}</span>
            <ChevronDown className={cn(
              'w-4 h-4 transition-transform duration-200',
              compareOpen ? 'rotate-180 text-amber-500' : 'text-slate-400'
            )} />
          </button>

          {compareOpen && (
            <div className="absolute top-full mt-2 left-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 p-1.5 min-w-[160px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
                Compare Quarter
              </p>
              {quarters.map(q => {
                const isDisabled = q === selected
                const isChosen = q === selectedCompare
                return (
                  <button
                    key={q}
                    disabled={isDisabled}
                    onClick={() => { onChangeCompare(q); setCompareOpen(false) }}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-medium text-left transition-all',
                      isDisabled ? 'opacity-30 cursor-not-allowed text-slate-400'
                        : isChosen ? 'bg-amber-50 text-amber-700 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    <span>{q}</span>
                    {isChosen && <Check className="w-3.5 h-3.5 text-amber-500" />}
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
