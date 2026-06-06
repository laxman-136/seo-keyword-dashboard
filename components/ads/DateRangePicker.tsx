// components/ads/DateRangePicker.tsx
'use client';

import React, { useState } from 'react'
import { useDateRange } from '@/hooks/useDateRange'
import { DatePreset } from '@/lib/dateRange'
import { Calendar, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DateRangePicker() {
  const { preset, from, to, label, setDateRange } = useDateRange()
  const [isOpen, setIsOpen] = useState(false)
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  
  // Custom picker dates
  const [customFrom, setCustomFrom] = useState(from || '')
  const [customTo, setCustomTo] = useState(to || '')

  const presets: Array<{ value: DatePreset; label: string }> = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last_3_days', label: 'Last 3 Days' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_14_days', label: 'Last 14 Days' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_3_months', label: 'Last 3 Months' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const handlePresetSelect = (value: DatePreset) => {
    if (value === 'custom') {
      setIsCustomOpen(true)
      setIsOpen(false)
    } else {
      setDateRange(value)
      setIsOpen(false)
      setIsCustomOpen(false)
    }
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customFrom && customTo) {
      setDateRange('custom', customFrom, customTo)
      setIsCustomOpen(false)
    }
  }

  return (
    <div className="relative z-40">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-sm text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 outline-none"
      >
        <Calendar className="w-4 h-4 text-slate-400" />
        <span>{label}</span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* Preset Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-150 rounded-2xl shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-150">
            {presets.map((p) => {
              const isSelected = preset === p.value
              return (
                <button
                  key={p.value}
                  onClick={() => handlePresetSelect(p.value)}
                  className={cn(
                    "flex items-center justify-between w-full px-4 py-2 text-left text-xs font-medium transition-colors hover:bg-slate-50",
                    isSelected ? "text-blue-600 bg-blue-50/40 font-bold" : "text-slate-600"
                  )}
                >
                  <span>{p.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Custom Picker Modal */}
      {isCustomOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-[1px] z-50" onClick={() => setIsCustomOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" /> Custom Date Range
            </h4>
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-700"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-700"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg transition-colors shadow-sm shadow-blue-500/20"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
