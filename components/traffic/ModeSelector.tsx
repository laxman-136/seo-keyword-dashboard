// components/traffic/ModeSelector.tsx
'use client';

import React from 'react'
import { cn } from '@/lib/utils'

interface ModeSelectorProps {
  value: 'monthly' | 'quarterly' | 'yearly'
  onChange: (val: 'monthly' | 'quarterly' | 'yearly') => void
}

export default function ModeSelector({ value, onChange }: ModeSelectorProps) {
  const modes: { label: string; key: typeof value }[] = [
    { label: 'Monthly', key: 'monthly' },
    { label: 'Quarterly', key: 'quarterly' },
    { label: 'Yearly', key: 'yearly' }
  ]

  return (
    <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0 shadow-inner">
      {modes.map(m => {
        const isActive = value === m.key
        return (
          <button
            key={m.key}
            onClick={() => onChange(m.key)}
            className={cn(
              "px-4 py-1.5 rounded-lg transition-all",
              isActive 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
