// components/revenue/ROASBadge.tsx
import React from 'react'

interface ROASBadgeProps {
  roas: number
}

export default function ROASBadge({ roas }: ROASBadgeProps) {
  let bg = 'rgba(107, 114, 128, 0.1)'
  let fg = '#9ca3af'
  let label = 'N/A'

  if (roas > 0) {
    label = `${roas.toFixed(2)}x`
    if (roas >= 4) {
      bg = 'rgba(22, 163, 74, 0.15)'
      fg = '#4ade80'
      label += ' 🟢'
    } else if (roas >= 2) {
      bg = 'rgba(234, 179, 8, 0.15)'
      fg = '#facc15'
      label += ' 🟡'
    } else if (roas >= 1) {
      bg = 'rgba(249, 115, 22, 0.15)'
      fg = '#fb923c'
      label += ' 🟠'
    } else {
      bg = 'rgba(239, 68, 68, 0.15)'
      fg = '#f87171'
      label += ' 🔴'
    }
  }

  return (
    <span
      className="px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 border border-transparent whitespace-nowrap"
      style={{ backgroundColor: bg, color: fg, borderColor: `${fg}20` }}
    >
      {label}
    </span>
  )
}
