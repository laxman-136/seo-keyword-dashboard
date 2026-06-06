// components/ads/PrepaidBalanceCard.tsx
'use client';

import React from 'react'
import { Wallet, Info, AlertTriangle, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PrepaidBalanceCardProps {
  platform: 'meta' | 'google' | 'combined'
  prepaidBalance?: number
  spend: number
  metaPrepaid?: number
  googlePrepaid?: number
  metaSpend?: number
  googleSpend?: number
}

export default function PrepaidBalanceCard({
  platform,
  prepaidBalance,
  spend,
  metaPrepaid,
  googlePrepaid,
  metaSpend,
  googleSpend
}: PrepaidBalanceCardProps) {
  const isCombined = platform === 'combined'
  
  // Resolve prepaid balance based on platform
  const effectivePrepaid = isCombined 
    ? (metaPrepaid || 0) + (googlePrepaid || 0)
    : (prepaidBalance || 0)

  const remaining = Math.max(0, effectivePrepaid - spend)
  const percentUsed = effectivePrepaid > 0 ? (spend / effectivePrepaid) * 100 : 0
  const percentRemaining = Math.max(0, 100 - percentUsed)

  // Determine alert level
  let status: 'healthy' | 'warning' | 'critical' | 'not_configured' = 'healthy'
  if (effectivePrepaid === 0) {
    status = 'not_configured'
  } else if (percentRemaining <= 15) {
    status = 'critical'
  } else if (percentRemaining <= 30) {
    status = 'warning'
  }

  const formatCost = (val: number) => {
    return `₹${Math.round(val).toLocaleString()}`
  }

  if (status === 'not_configured') {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              {isCombined ? 'Unified' : isCombined ? 'Meta' : 'Google'} Prepaid Balance
            </h4>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Set your prepaid balance in Settings to track remaining ad account funds.
            </p>
          </div>
        </div>
        <a 
          href="/settings"
          className="self-start sm:self-auto flex items-center gap-1 text-[10px] font-extrabold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg border border-violet-100 transition-all select-none"
        >
          <span>Configure Prepaid Balance</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md">
      
      {/* Wallet Summary */}
      <div className={cn(
        "p-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100 shrink-0 md:w-80",
        status === 'critical' ? "bg-rose-50/20" : status === 'warning' ? "bg-amber-50/20" : "bg-slate-50/20"
      )}>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              {isCombined ? 'Combined Account Wallet' : platform === 'meta' ? 'Meta Ads Balance' : 'Google Ads Balance'}
            </span>
            <span className={cn(
              "text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border tracking-wider flex items-center gap-1",
              status === 'critical' && "bg-rose-50 text-rose-700 border-rose-100",
              status === 'warning' && "bg-amber-50 text-amber-700 border-amber-100",
              status === 'healthy' && "bg-emerald-50 text-emerald-700 border-emerald-100"
            )}>
              {status === 'critical' ? (
                <><AlertTriangle className="w-2.5 h-2.5" /> Low Funds</>
              ) : status === 'warning' ? (
                <><AlertTriangle className="w-2.5 h-2.5" /> Moderate Balance</>
              ) : (
                <><CheckCircle2 className="w-2.5 h-2.5" /> Healthy Balance</>
              )}
            </span>
          </div>
          
          <div className="mt-4">
            <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Estimated Remaining</span>
            <h3 className={cn(
              "text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 leading-none font-mono",
              status === 'critical' ? "text-rose-600" : "text-slate-800"
            )}>
              {formatCost(remaining)}
            </h3>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-150 flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <Wallet className="w-3.5 h-3.5 text-slate-450 shrink-0" />
          <span>Prepaid Budget: {formatCost(effectivePrepaid)}</span>
        </div>
      </div>

      {/* Progress & Details */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4 bg-white">
        
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
            <span>Funding Consumption</span>
            <span className="text-slate-650">{percentRemaining.toFixed(0)}% Funds Available</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                status === 'critical' ? "bg-rose-500" : status === 'warning' ? "bg-amber-500" : "bg-emerald-500"
              )}
              style={{ width: `${Math.min(100, percentRemaining)}%` }}
            />
          </div>
          
          {/* Legend Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-xs font-bold text-slate-600 font-mono">
            <div>
              <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest font-sans">Prepaid Total</span>
              <span className="block text-slate-700 mt-0.5">{formatCost(effectivePrepaid)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest font-sans">Ad Spend</span>
              <span className="block text-slate-700 mt-0.5">{formatCost(spend)}</span>
            </div>
            {isCombined && (
              <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3">
                <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest font-sans">Split By Platform</span>
                <span className="block text-[10px] text-slate-500 mt-0.5 font-sans font-semibold">
                  Google: <span className="font-mono font-extrabold">{formatCost(googleSpend || 0)}</span> | Meta: <span className="font-mono font-extrabold">{formatCost(metaSpend || 0)}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer / Info banner */}
        <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500 leading-normal font-medium">
          <Info className="w-3.5 h-3.5 text-slate-450 shrink-0 mt-0.5" />
          <p>
            Estimated remaining balance is computed from the prepaid balance configured in your settings minus the ad spend in the current active date range.
            {status === 'critical' && <strong className="text-rose-600 block mt-1">⚠️ Warning: Balance is running low! Please refill your ad account soon.</strong>}
          </p>
        </div>

      </div>

    </div>
  )
}
