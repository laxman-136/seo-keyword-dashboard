// components/leads/RefreshBar.tsx
'use client';

import React from 'react'
import { RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RefreshBarProps {
  loading: boolean
  refreshing: boolean
  lastUpdated?: string
  onRefresh: () => void
}

export default function RefreshBar({ loading, refreshing, lastUpdated, onRefresh }: RefreshBarProps) {
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
    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-2xl">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
        <span className={cn("w-2 h-2 rounded-full", refreshing || loading ? "bg-amber-400 animate-pulse" : "bg-emerald-500")} />
        <span>
          {refreshing || loading
            ? "Syncing TeleCRM leads..."
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
          "p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all hover:border-slate-300 disabled:opacity-40 disabled:pointer-events-none",
          (loading || refreshing) && "cursor-not-allowed"
        )}
        title="Sync leads now"
      >
        <RotateCw className={cn("w-3.5 h-3.5", (loading || refreshing) && "animate-spin text-emerald-600")} />
      </button>
    </div>
  )
}
