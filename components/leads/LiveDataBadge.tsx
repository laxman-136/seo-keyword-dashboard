// components/leads/LiveDataBadge.tsx
import React from 'react'

export default function LiveDataBadge() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-250 rounded-xl">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span className="text-xs font-bold text-emerald-700 select-none">Live · TeleCRM</span>
    </div>
  )
}
