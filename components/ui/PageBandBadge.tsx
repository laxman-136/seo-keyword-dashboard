// components/ui/PageBandBadge.tsx
import React from 'react'
import { PageBand } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PageBandBadgeProps {
  band: PageBand
}

export default function PageBandBadge({ band }: PageBandBadgeProps) {
  
  const styles: Record<PageBand, {
    bg: string
    text: string
    border: string
    dot: string
  }> = {
    'P1 Top (1-4)': {
      bg: 'bg-emerald-50 text-emerald-800',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500'
    },
    'P1 Good (5-10)': {
      bg: 'bg-blue-50 text-blue-800',
      text: 'text-blue-800',
      border: 'border-blue-200',
      dot: 'bg-blue-500'
    },
    'Page 2': {
      bg: 'bg-amber-50 text-amber-800',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500'
    },
    'Page 3': {
      bg: 'bg-orange-50 text-orange-800',
      text: 'text-orange-800',
      border: 'border-orange-200',
      dot: 'bg-orange-500'
    },
    'Page 4+': {
      bg: 'bg-red-50 text-red-800',
      text: 'text-red-800',
      border: 'border-red-200',
      dot: 'bg-red-500'
    },
    'Not Ranking': {
      bg: 'bg-slate-50 text-slate-600',
      text: 'text-slate-600',
      border: 'border-slate-200',
      dot: 'bg-slate-400'
    }
  }

  const s = styles[band] || styles['Not Ranking']

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm",
      s.bg,
      s.border
    )}>
      <span className={cn("w-2 h-2 rounded-full", s.dot)}></span>
      <span className={s.text}>{band}</span>
    </span>
  )
}
