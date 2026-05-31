// components/traffic/PeriodSelector.tsx
'use client';

import React from 'react'

interface PeriodSelectorProps {
  mode: 'monthly' | 'quarterly' | 'yearly'
  value: string
  onChange: (val: string) => void
  months: string[] // "January-2024", ...
  years: number[]  // [2023, 2024, 2025, 2026]
  label?: string
}

export default function PeriodSelector({
  mode,
  value,
  onChange,
  months,
  years,
  label = 'Select Period'
}: PeriodSelectorProps) {
  
  // Generate quarters defensively from available years list
  const quarters = React.useMemo(() => {
    const list: string[] = []
    const sortedYears = [...years].sort((a, b) => b - a) // Latest years first
    sortedYears.forEach(yr => {
      list.push(`q4-${yr}`, `q3-${yr}`, `q2-${yr}`, `q1-${yr}`)
    })
    return list
  }, [years])

  // Format options for clean CEO readability
  const getOptionLabel = (option: string): string => {
    if (mode === 'quarterly') {
      const [qStr, yrStr] = option.toUpperCase().split('-')
      return `${qStr} ${yrStr}`
    }
    if (mode === 'monthly') {
      const [mName, yrStr] = option.split('-')
      return `${mName} ${yrStr}`
    }
    return option // Yearly is just the year string
  }

  // Determine selector options list
  const options = React.useMemo(() => {
    if (mode === 'yearly') {
      return [...years].sort((a, b) => b - a).map(String)
    }
    if (mode === 'quarterly') {
      return quarters
    }
    // Monthly mode (latest months first)
    return [...months].reverse()
  }, [mode, months, years, quarters])

  return (
    <div className="flex flex-col min-w-[140px]">
      {label && (
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 text-slate-600 font-semibold shadow-sm transition-all"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>
            {getOptionLabel(opt)}
          </option>
        ))}
      </select>
    </div>
  )
}
