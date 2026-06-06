// components/ads/MetaCampaignTable.tsx
'use client';

import React, { useState } from 'react'
import { MetaCampaign, MetaAdSet, MetaAd } from '@/lib/types'
import { useMetaAdSets, useMetaAds } from '@/hooks/useMetaAdsData'
import { MetricConfig } from '@/lib/metrics-config'
import { ChevronDown, ChevronRight, Play, Pause, Search, Eye, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetaCampaignTableProps {
  campaigns: MetaCampaign[]
  visibleMetrics: MetricConfig[]
}

// Format helpers
function formatCell(val: any, format: MetricConfig['format']): string {
  if (val === undefined || val === null) return '-'
  const num = Number(val)
  if (isNaN(num)) return String(val)

  switch (format) {
    case 'currency':
      return `₹${Math.round(num).toLocaleString()}`
    case 'percent':
      return `${num.toFixed(2)}%`
    case 'multiplier':
      return `${num.toFixed(1)}x`
    case 'number':
      return Math.round(num).toLocaleString()
    default:
      return String(val)
  }
}

export default function MetaCampaignTable({ campaigns, visibleMetrics }: MetaCampaignTableProps) {
  const [filterText, setFilterText] = useState('')

  const filtered = campaigns.filter(c => 
    c.name.toLowerCase().includes(filterText.toLowerCase()) ||
    c.objective.toLowerCase().includes(filterText.toLowerCase())
  )

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Table Filter Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <span className="text-xs font-extrabold text-slate-700">Meta Campaigns Insights</span>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-700"
          />
        </div>
      </div>

      {/* Main campaigns table */}
      <div className="overflow-x-auto text-left">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-150 bg-slate-50 text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
              <th className="py-3 px-4 w-10" />
              <th className="py-3 px-2 min-w-[200px]">Campaign Name</th>
              <th className="py-3 px-3 text-center">Status</th>
              {visibleMetrics.map(m => (
                <th key={m.id} className="py-3 px-3 text-right">{m.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {filtered.length > 0 ? (
              filtered.map(c => (
                <CampaignRow key={c.id} campaign={c} visibleMetrics={visibleMetrics} />
              ))
            ) : (
              <tr>
                <td colSpan={visibleMetrics.length + 3} className="py-8 text-center text-xs text-slate-400 font-medium">
                  No active campaigns found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── CAMPAIGN ROW SUB-COMPONENT ─────────────────────────────
function CampaignRow({ campaign, visibleMetrics }: { campaign: MetaCampaign; visibleMetrics: MetricConfig[] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isActive = campaign.status === 'ACTIVE'

  return (
    <>
      <tr className={cn(
        "text-xs transition-colors hover:bg-slate-50/50",
        isExpanded && "bg-slate-50/30"
      )}>
        <td className="py-3 px-4 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            {isExpanded 
              ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            }
          </button>
        </td>
        <td className="py-3 px-2">
          <div className="font-bold text-slate-800 leading-tight">{campaign.name}</div>
          <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">{campaign.objective}</div>
        </td>
        <td className="py-3 px-3 text-center">
          <div className="flex items-center justify-center">
            {isActive ? (
              <span className="flex items-center gap-1 text-[9px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                <Play className="w-2.5 h-2.5 fill-emerald-600 stroke-none" /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[9px] font-extrabold bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-250">
                <Pause className="w-2.5 h-2.5 fill-slate-400 stroke-none" /> Paused
              </span>
            )}
          </div>
        </td>
        {visibleMetrics.map(m => {
          const val = (campaign as any)[m.id]
          return (
            <td key={m.id} className="py-3 px-3 text-right font-mono font-bold text-slate-700">
              {formatCell(val, m.format)}
            </td>
          )
        })}
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={visibleMetrics.length + 3} className="bg-slate-50/20 py-2.5 pl-12 pr-4">
            <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-xs bg-white">
              <div className="p-3 border-b border-slate-100 bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                📢 Target Ad Sets under this Campaign
              </div>
              <AdSetList campaignId={campaign.id} visibleMetrics={visibleMetrics} />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── ADSET LIST SUB-COMPONENT ──────────────────────────────
function AdSetList({ campaignId, visibleMetrics }: { campaignId: string; visibleMetrics: MetricConfig[] }) {
  const { adSets, loading, error } = useMetaAdSets(campaignId)

  if (loading) {
    return <div className="py-6 text-center text-xs text-slate-400 font-semibold">Loading Ad Sets...</div>
  }
  if (error) {
    return <div className="py-6 text-center text-xs text-rose-500 font-bold">{error}</div>
  }
  if (adSets.length === 0) {
    return <div className="py-6 text-center text-xs text-slate-400 font-semibold">No Ad Sets found.</div>
  }

  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-slate-150 bg-slate-50/50 text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
          <th className="py-2.5 px-3 w-10" />
          <th className="py-2.5 px-2">Ad Set Name</th>
          <th className="py-2.5 px-3 text-center">Status</th>
          {visibleMetrics.map(m => (
            <th key={m.id} className="py-2.5 px-3 text-right">{m.label}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {adSets.map(adSet => (
          <AdSetRow key={adSet.id} adSet={adSet} visibleMetrics={visibleMetrics} />
        ))}
      </tbody>
    </table>
  )
}

// ── ADSET ROW SUB-COMPONENT ────────────────────────────────
function AdSetRow({ adSet, visibleMetrics }: { adSet: MetaAdSet; visibleMetrics: MetricConfig[] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isActive = adSet.status === 'ACTIVE'

  return (
    <>
      <tr className="text-[11px] transition-colors hover:bg-slate-50/30">
        <td className="py-2.5 px-3 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 rounded hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            {isExpanded 
              ? <ChevronDown className="w-3 h-3 text-slate-500" />
              : <ChevronRight className="w-3 h-3 text-slate-500" />
            }
          </button>
        </td>
        <td className="py-2.5 px-2">
          <div className="font-bold text-slate-800 leading-tight">{adSet.name}</div>
          <div className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">{adSet.optimizationGoal}</div>
        </td>
        <td className="py-2.5 px-3 text-center">
          <div className="flex items-center justify-center">
            {isActive ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-300" title="Paused" />
            )}
          </div>
        </td>
        {visibleMetrics.map(m => {
          const val = (adSet as any)[m.id]
          return (
            <td key={m.id} className="py-2.5 px-3 text-right font-mono font-bold text-slate-600">
              {formatCell(val, m.format)}
            </td>
          )
        })}
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={visibleMetrics.length + 3} className="bg-slate-50/10 py-2 pl-12 pr-4">
            <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
              <div className="p-2.5 border-b border-slate-100 bg-slate-50 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                🖼️ Active Creatives & Ads
              </div>
              <AdList adSetId={adSet.id} visibleMetrics={visibleMetrics} />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── AD LIST SUB-COMPONENT ──────────────────────────────────
function AdList({ adSetId, visibleMetrics }: { adSetId: string; visibleMetrics: MetricConfig[] }) {
  const { ads, loading, error } = useMetaAds(adSetId)

  if (loading) {
    return <div className="py-4 text-center text-xs text-slate-400 font-semibold">Loading Ads...</div>
  }
  if (error) {
    return <div className="py-4 text-center text-xs text-rose-500 font-bold">{error}</div>
  }
  if (ads.length === 0) {
    return <div className="py-4 text-center text-xs text-slate-400 font-semibold">No Ads found.</div>
  }

  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50/50 text-[8px] uppercase tracking-wider font-extrabold text-slate-400">
          <th className="py-2 px-3 w-10">Creative</th>
          <th className="py-2 px-2">Ad Name</th>
          <th className="py-2 px-3 text-center">Status</th>
          {visibleMetrics.map(m => (
            <th key={m.id} className="py-2 px-3 text-right">{m.label}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {ads.map(ad => {
          const isActive = ad.status === 'ACTIVE'
          return (
            <tr key={ad.id} className="text-[10px] transition-colors hover:bg-slate-50/20">
              <td className="py-2 px-3">
                {ad.previewUrl ? (
                  <img src={ad.previewUrl} alt="ad preview" className="w-8 h-8 rounded-md object-cover border border-slate-200" />
                ) : (
                  <div className="w-8 h-8 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
              </td>
              <td className="py-2 px-2">
                <div className="font-bold text-slate-800 leading-tight">{ad.name}</div>
                <div className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">{ad.creativeType}</div>
              </td>
              <td className="py-2 px-3 text-center">
                <div className="flex items-center justify-center">
                  {isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  )}
                </div>
              </td>
              {visibleMetrics.map(m => {
                const val = (ad as any)[m.id]
                return (
                  <td key={m.id} className="py-2 px-3 text-right font-mono font-bold text-slate-500">
                    {formatCell(val, m.format)}
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
