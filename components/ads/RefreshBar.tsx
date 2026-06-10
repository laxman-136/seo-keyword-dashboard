// components/ads/RefreshBar.tsx
'use client';

import React from 'react'
import { RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RefreshBarProps {
  loading: boolean
  refreshing: boolean
  lastUpdated?: string
  onRefresh: () => void
  dark?: boolean
}

export default function RefreshBar({ loading, refreshing, lastUpdated, onRefresh, dark = false }: RefreshBarProps) {
  const formatTime = (isoString?: string) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      return ''
    }
  }

  const formattedTime = formatTime(lastUpdated)

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2 rounded-2xl border",
      dark 
        ? "bg-slate-900/60 border-slate-800 text-slate-200" 
        : "bg-slate-50 border-slate-200/80 text-slate-700"
    )}>
      <div className={cn(
        "flex items-center gap-1.5 text-[10px] font-semibold",
        dark ? "text-slate-400" : "text-slate-500"
      )}>
        <span className={cn("w-2 h-2 rounded-full", refreshing || loading ? "bg-amber-400 animate-pulse" : "bg-emerald-500")} />
        <span>
          {refreshing || loading
            ? "Syncing live campaigns..."
            : formattedTime 
              ? `Last synced at ${formattedTime}`
              : "Live insights loaded"
          }
        </span>
      </div>

      <button
        onClick={onRefresh}
        disabled={loading || refreshing}
        className={cn(
          "p-1.5 rounded-lg border transition-all disabled:opacity-40 disabled:pointer-events-none",
          dark 
            ? "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-900 hover:border-slate-800" 
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300",
          (loading || refreshing) && "cursor-not-allowed"
        )}
        title="Sync campaigns now"
      >
        <RotateCw className={cn("w-3.5 h-3.5", (loading || refreshing) && cn("animate-spin", dark ? "text-indigo-400" : "text-blue-600"))} />
      </button>
    </div>
  )
}
