// components/ui/MovementBadge.tsx
import React from 'react'
import { ArrowUp, ArrowDown, MoveRight, Sparkles, XCircle } from 'lucide-react'
import { Movement } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MovementBadgeProps {
  movement: Movement
  label?: string // Optional customized string (e.g. "↑ P2→P1")
}

export default function MovementBadge({ movement, label }: MovementBadgeProps) {
  
  const config: Record<Movement, {
    bg: string
    border: string
    text: string
    icon: React.ComponentType<{ className?: string }>
  }> = {
    'Improved': {
      bg: 'bg-emerald-50 text-emerald-700',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      icon: ArrowUp
    },
    'Dropped': {
      bg: 'bg-red-50 text-red-700',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: ArrowDown
    },
    'Neutral': {
      bg: 'bg-slate-50 text-slate-600',
      border: 'border-slate-200',
      text: 'text-slate-600',
      icon: MoveRight
    },
    'New Entry': {
      bg: 'bg-blue-50 text-blue-700',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: Sparkles
    },
    'Lost Ranking': {
      bg: 'bg-slate-950 text-slate-100',
      border: 'border-slate-800',
      text: 'text-slate-300',
      icon: XCircle
    },
    'No Data': {
      bg: 'bg-slate-50 text-slate-400',
      border: 'border-slate-200',
      text: 'text-slate-400',
      icon: MoveRight
    }
  }

  const active = config[movement] || config['No Data']
  const Icon = active.icon

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm shrink-0",
      active.bg,
      active.border
    )}>
      <Icon className="w-3.5 h-3.5" />
      <span className={active.text}>{label || movement}</span>
    </span>
  )
}
