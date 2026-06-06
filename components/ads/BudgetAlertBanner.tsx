// components/ads/BudgetAlertBanner.tsx
'use client';

import React, { useState } from 'react'
import { AdsBudgetAlert } from '@/lib/types'
import { AlertTriangle, AlertCircle, ChevronDown, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BudgetAlertBannerProps {
  alerts: AdsBudgetAlert[]
}

export default function BudgetAlertBanner({ alerts }: BudgetAlertBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-1">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
        <div>
          <h4 className="text-xs font-bold text-emerald-800">All campaign budgets healthy</h4>
          <p className="text-[10px] text-emerald-600/90 mt-0.5 font-medium">Daily budget limits are running within secure parameters across Google & Meta Ads.</p>
        </div>
      </div>
    )
  }

  // Count severity levels
  const exhaustedCount = alerts.filter(a => a.alertLevel === 'exhausted').length
  const criticalCount = alerts.filter(a => a.alertLevel === 'critical').length
  const warningCount = alerts.filter(a => a.alertLevel === 'warning').length

  const mainAlert = alerts[0]

  return (
    <div className={cn(
      "border rounded-2xl p-4 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-1",
      exhaustedCount > 0 
        ? "bg-rose-50/60 border-rose-200" 
        : criticalCount > 0 
          ? "bg-amber-50/60 border-amber-200" 
          : "bg-yellow-50/50 border-yellow-200"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          {exhaustedCount > 0 ? (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          )}

          <div>
            <h4 className={cn(
              "text-xs font-bold",
              exhaustedCount > 0 
                ? "text-rose-950" 
                : "text-amber-950"
            )}>
              Ad Budget Alert: {alerts.length} Campaign{alerts.length > 1 ? 's' : ''} require attention
            </h4>
            <p className={cn(
              "text-[10px] mt-0.5 font-medium",
              exhaustedCount > 0 ? "text-rose-700" : "text-amber-700"
            )}>
              {exhaustedCount > 0 && `${exhaustedCount} exhausted (100%+ spent) `}
              {criticalCount > 0 && `${criticalCount} critical (90%+ spent) `}
              {warningCount > 0 && `${warningCount} warning (75%+ spent)`}
            </p>
          </div>
        </div>

        {alerts.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl shadow-xs transition-all hover:bg-slate-50"
          >
            <span>{isExpanded ? "Hide Details" : "View Details"}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isExpanded && "rotate-180")} />
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 pt-3.5 border-t border-dashed border-slate-200/80 space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {alerts.map((alert, idx) => {
            const isExhausted = alert.alertLevel === 'exhausted'
            const isCritical = alert.alertLevel === 'critical'
            
            return (
              <div 
                key={`${alert.platform}-${alert.campaignId}-${idx}`} 
                className="flex items-center justify-between gap-4 p-2 bg-white/70 border border-slate-100 rounded-xl"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn(
                    "text-[8px] font-extrabold px-1.5 py-0.5 rounded-sm shrink-0 uppercase tracking-wider",
                    alert.platform === 'meta' ? "bg-blue-100 text-blue-800" : "bg-cyan-100 text-cyan-800"
                  )}>
                    {alert.platform}
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 truncate">{alert.campaignName}</span>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold text-slate-700">₹{Math.round(alert.spentToday)}</span>
                    <span className="text-slate-400 text-[9px] font-medium"> / ₹{Math.round(alert.dailyBudget)} daily</span>
                  </div>

                  <span className={cn(
                    "text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0",
                    isExhausted 
                      ? "bg-rose-100 text-rose-800" 
                      : isCritical 
                        ? "bg-amber-100 text-amber-800" 
                        : "bg-yellow-100 text-yellow-800"
                  )}>
                    {alert.percentUsed.toFixed(0)}% Used
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
