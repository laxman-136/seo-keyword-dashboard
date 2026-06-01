// components/layout/Header.tsx
'use client';

import React from 'react'
import { RefreshCw, FileText, Calendar, AlertTriangle, CloudSun } from 'lucide-react'
import { formatMonthLabel } from '@/lib/utils'

interface HeaderProps {
  title: string
  currentMonth?: string
  previousMonth?: string
  lastUpdated?: string
  isMock?: boolean
  warningText?: string | null
  onRefresh?: () => void
  isRefreshing?: boolean
}

export default function Header({
  title,
  currentMonth = '',
  previousMonth = '',
  lastUpdated = '',
  isMock = false,
  warningText,
  onRefresh,
  isRefreshing = false
}: HeaderProps) {
  
  const handlePrint = () => {
    window.print()
  }

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between shadow-sm relative z-10 no-print">
      {/* Title & Timing info */}
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
          
          {isMock && (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Demo Mock Data
            </span>
          )}
          
          {!isMock && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CloudSun className="w-3.5 h-3.5 text-emerald-500" />
              Live Sheets API
            </span>
          )}
        </div>

        {currentMonth && (
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-700">{formatMonthLabel(currentMonth)}</span>
            {previousMonth && (
              <>
                <span className="text-slate-300">|</span>
                <span>vs Previous: <span className="font-medium text-slate-600">{formatMonthLabel(previousMonth)}</span></span>
              </>
            )}
            {lastUpdated && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-xs text-slate-400">Updated: {lastUpdated}</span>
              </>
            )}
          </div>
        )}
        {warningText && (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="font-semibold">Data warning:</span> {warningText}
          </div>
        )}
      </div>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-medium text-sm rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Cache'}</span>
          </button>
        )}

        <button
          onClick={handlePrint}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-slate-900/10 hover:shadow-slate-950/20"
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Export to PDF</span>
        </button>
      </div>
    </header>
  )
}
