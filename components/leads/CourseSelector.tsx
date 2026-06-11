// components/leads/CourseSelector.tsx
'use client';

import React, { useState } from 'react'
import { BookOpen, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CourseSelectorProps {
  selectedCourse: string
  onChange: (course: string) => void
  dark?: boolean
}

export default function CourseSelector({ selectedCourse, onChange, dark = false }: CourseSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const courses = [
    { value: 'all', label: 'All Courses' },
    { value: 'Oracle Fusion SCM', label: 'Oracle Fusion SCM' },
    { value: 'Oracle Fusion HCM', label: 'Oracle Fusion HCM' },
    { value: 'Oracle Fusion Financials', label: 'Oracle Fusion Financials' },
    { value: 'Oracle Fusion Technical', label: 'Oracle Fusion Technical' },
    { value: 'Oracle Fusion PPM', label: 'Oracle Fusion PPM' },
    { value: 'Oracle Fusion WMS', label: 'Oracle Fusion WMS' },
    { value: 'Oracle Integration', label: 'Oracle Integration' },
    { value: 'SAP', label: 'SAP' }
  ]

  const selectedLabel = courses.find(c => c.value === selectedCourse)?.label || 'All Courses'

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
  }

  return (
    <div className="relative z-40">
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
        <BookOpen className="w-4 h-4 text-slate-400" />
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
          {courses.map((c) => {
            const isSelected = selectedCourse === c.value
            return (
              <button
                key={c.value}
                onClick={() => handleSelect(c.value)}
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
                <span>{c.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-500" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
