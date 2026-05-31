// components/ui/GroupBadge.tsx
import React from 'react'
import { cn } from '@/lib/utils'

interface GroupBadgeProps {
  group: string
}

export default function GroupBadge({ group }: GroupBadgeProps) {
  
  // Dynamic styles mapping each of the 13 keyword groups to premium, distinct HSL colors
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    'Oracle Fusion SCM': {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-150'
    },
    'Oracle Fusion Financials': {
      bg: 'bg-violet-50',
      text: 'text-violet-700',
      border: 'border-violet-150'
    },
    'Oracle Fusion HCM': {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-150'
    },
    'Oracle Fusion Technical': {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-150'
    },
    'Oracle Fusion Procurement': {
      bg: 'bg-cyan-50',
      text: 'text-cyan-700',
      border: 'border-cyan-150'
    },
    'Oracle Recruiting & WMS': {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-150'
    },
    'Oracle Integration & GTM': {
      bg: 'bg-fuchsia-50',
      text: 'text-fuchsia-700',
      border: 'border-fuchsia-150'
    },
    'Oracle Fusion Manufacturing': {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-150'
    },
    'Oracle Fusion PPM': {
      bg: 'bg-pink-50',
      text: 'text-pink-700',
      border: 'border-pink-150'
    },
    'SAP': {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-150'
    },
    'Salesforce & Others': {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-150'
    },
    'DevOps & Cloud': {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-150'
    },
    'Data & Azure': {
      bg: 'bg-lime-50',
      text: 'text-lime-700',
      border: 'border-lime-150'
    }
  }

  // Fallback if unrecognized group name
  const s = styles[group] || {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200'
  }

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border truncate max-w-[180px] tracking-wide",
      s.bg,
      s.text,
      s.border
    )}>
      {group}
    </span>
  )
}
