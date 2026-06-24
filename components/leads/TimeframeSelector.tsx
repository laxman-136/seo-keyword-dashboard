// components/leads/TimeframeSelector.tsx
'use client';

import React, { useState } from 'react'
import { Calendar, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimeframeSelectorProps {
  selectedTimeframe: number // 3, 6, 12
  onChange: (months: number) => void
  dark?: boolean
}

export default function TimeframeSelector({ selectedTimeframe, onChange, dark = false }: TimeframeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const options = [
    { value: 3, label: 'Quarterly (3 Months)' },
    { value: 6, label: '6 Months' },
    { value: 12, label: 'Yearly (12 Months)' }
  ]

  const selectedLabel = options.find(o => o.value === selectedTimeframe)?.label || '6 Months'

  const handleSelect = (val: number) => {
    onChange(val)
    setIsOpen(false)
  }

  return (
    <div className="relative z-45">
      {/* Click overlay to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2.5 px-4 py-2.5 border rounded-xl shadow-sm text-xs font-semibold transition-all outline-none",
          dark 
            ? "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-slate-700" 
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
        )}
      >
        <Calendar className="w-4 h-4 text-slate-400" />
        <span>{selectedLabel}</span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* Preset Dropdown */}
      {isOpen && (
        <div className={cn(
          "absolute right-0 mt-2 w-56 border rounded-2xl shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-150 z-50",
          dark 
            ? "bg-slate-950 border-slate-800 text-slate-200" 
            : "bg-white border-slate-150 text-slate-700"
        )}>
          {options.map((o) => {
            const isSelected = selectedTimeframe === o.value
            return (
              <button
                key={o.value}
                onClick={() => handleSelect(o.value)}
                className={cn(
                  "flex items-center justify-between w-full px-4 py-2 text-left text-xs font-medium transition-colors",
                  dark 
                    ? "hover:bg-slate-900/60" 
                    : "hover:bg-slate-50",
                  isSelected 
                    ? dark 
                      ? "text-indigo-400 bg-indigo-500/10 font-bold" 
                      : "text-blue-600 bg-blue-50/40 font-bold" 
                    : dark 
                      ? "text-slate-300" 
                      : "text-slate-600"
                )}
              >
                <span>{o.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-500" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
