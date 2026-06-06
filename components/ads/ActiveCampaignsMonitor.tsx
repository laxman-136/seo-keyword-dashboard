// components/ads/ActiveCampaignsMonitor.tsx
'use client';

import React from 'react'
import { Play, TrendingUp, Target, DollarSign, Award, Percent } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActiveCampaignsMonitorProps {
  campaigns: any[]
  platform: 'meta' | 'google'
}

export default function ActiveCampaignsMonitor({ campaigns, platform }: ActiveCampaignsMonitorProps) {
  const isActiveMeta = (c: any) => platform === 'meta' && c.status === 'ACTIVE'
  const isActiveGoogle = (c: any) => platform === 'google' && c.status === 'ENABLED'

  const activeCampaigns = campaigns.filter(c => isActiveMeta(c) || isActiveGoogle(c))

  if (activeCampaigns.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-xs text-center">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400 mb-2">
          <Play className="w-4 h-4 rotate-90" />
        </span>
        <h4 className="text-xs font-extrabold text-slate-700">No campaigns are currently active</h4>
        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Adjust status filters or refresh to check connection.</p>
      </div>
    )
  }

  // Format currency helper
  const formatCost = (val: number) => {
    return `₹${Math.round(val).toLocaleString()}`
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Live Active Campaigns ({activeCampaigns.length})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {activeCampaigns.map(c => {
          const isMeta = platform === 'meta'
          const pctUsed = c.budgetPercentUsed || 0
          
          return (
            <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-350 hover:shadow-md">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                
                {/* Left side: Campaign basic info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                      {isMeta ? 'Meta Ads' : 'Google Ads'}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-800 truncate leading-none mt-0.5" title={c.name}>
                      {c.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-slate-400 shrink-0" />
                      {isMeta ? c.objective : c.type}
                    </span>
                    {c.startTime && (
                      <span>Start: {new Date(c.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })}</span>
                    )}
                  </div>
                </div>

                {/* Middle: Pacing progress bar */}
                <div className="w-full lg:w-64 shrink-0 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    <span>Budget Pacing</span>
                    <span className="text-slate-600">{pctUsed.toFixed(0)}% Used</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        pctUsed >= 90 ? "bg-rose-500" : pctUsed >= 75 ? "bg-amber-500" : "bg-emerald-500"
                      )}
                      style={{ width: `${Math.min(100, pctUsed)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mt-1.5 font-mono">
                    <span>Spent: {formatCost(c.spend)}</span>
                    <span>Daily: {formatCost(c.dailyBudget)}</span>
                  </div>
                </div>

                {/* Right: Campaign stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0 lg:w-[480px]">
                  {/* Impressions */}
                  <div className="border-l border-slate-100 pl-3">
                    <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">Impressions</span>
                    <span className="block text-xs font-extrabold text-slate-700 font-mono mt-0.5">{c.impressions.toLocaleString()}</span>
                  </div>

                  {/* Clicks */}
                  <div className="border-l border-slate-100 pl-3">
                    <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">Clicks (CTR)</span>
                    <span className="block text-xs font-extrabold text-slate-700 font-mono mt-0.5">
                      {c.clicks.toLocaleString()} <span className="text-[9px] text-slate-400 font-semibold">({c.ctr.toFixed(2)}%)</span>
                    </span>
                  </div>

                  {/* Platform-specific conversions */}
                  {isMeta ? (
                    <>
                      <div className="border-l border-slate-100 pl-3">
                        <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest text-blue-600">Form Leads</span>
                        <span className="block text-xs font-extrabold text-slate-700 font-mono mt-0.5">{c.leadFormFills.toLocaleString()}</span>
                      </div>
                      <div className="border-l border-slate-100 pl-3">
                        <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest text-emerald-600">Web Leads</span>
                        <span className="block text-xs font-extrabold text-slate-700 font-mono mt-0.5">{c.websiteLeads.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="border-l border-slate-100 pl-3">
                        <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">Conversions</span>
                        <span className="block text-xs font-extrabold text-slate-700 font-mono mt-0.5">{c.conversions.toLocaleString()}</span>
                      </div>
                      <div className="border-l border-slate-100 pl-3">
                        <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">Cost / Conv</span>
                        <span className="block text-xs font-extrabold text-slate-700 font-mono mt-0.5">
                          {c.costPerConversion > 0 ? formatCost(c.costPerConversion) : '-'}
                        </span>
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
