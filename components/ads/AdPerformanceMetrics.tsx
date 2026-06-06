// components/ads/AdPerformanceMetrics.tsx
'use client';

import React from 'react'
import { TrendingUp, MousePointer, Award, HelpCircle, DollarSign, Eye, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number
  description?: string
  icon: React.ReactNode
  accentColor?: 'blue' | 'cyan' | 'indigo' | 'emerald' | 'rose'
  winnerBadge?: string
}

function MetricCard({ label, value, description, icon, accentColor = 'blue', winnerBadge }: MetricCardProps) {
  const accentClasses = {
    blue: "text-blue-600 bg-blue-50/50 border-blue-100",
    cyan: "text-cyan-600 bg-cyan-50/50 border-cyan-100",
    indigo: "text-indigo-600 bg-indigo-50/50 border-indigo-100",
    emerald: "text-emerald-600 bg-emerald-50/50 border-emerald-100",
    rose: "text-rose-600 bg-rose-50/50 border-rose-100"
  }

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm relative transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      {winnerBadge && (
        <span className="absolute top-3 right-3 text-[8px] font-extrabold px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200/80 shadow-xs uppercase tracking-wider">
          🏆 {winnerBadge} Win
        </span>
      )}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</span>
        <div className={cn("p-2 rounded-xl border", accentClasses[accentColor])}>
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
          {value}
        </h3>
        {description && (
          <p className="text-[10px] text-slate-400 font-medium mt-1.5 leading-normal">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

interface AdPerformanceMetricsProps {
  metrics: {
    spend: number
    impressions: number
    clicks: number
    ctr: number
    cpc: number
    conversions: number
    leads?: number
    cpl?: number
    leadFormFills?: number
    websiteLeads?: number
    costPerLeadForm?: number
    costPerWebsiteLead?: number
  }
  platform?: 'meta' | 'google' | 'combined'
  winners?: Record<string, 'meta' | 'google'>
}

export default function AdPerformanceMetrics({ metrics, platform = 'combined', winners }: AdPerformanceMetricsProps) {
  const isMeta = platform === 'meta'
  const isGoogle = platform === 'google'

  // Format currency
  const formatCost = (val: number) => {
    return `₹${Math.round(val).toLocaleString()}`
  }

  const formatCostDecimal = (val: number) => {
    return `₹${val.toFixed(2)}`
  }

  return (
    <div className={cn(
      "grid gap-4",
      isMeta ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
    )}>
      <MetricCard
        label="Total Spend"
        value={formatCost(metrics.spend)}
        description={isMeta ? "Meta Campaign Spend" : isGoogle ? "Google Campaign Cost" : "Combined Ads Investment"}
        icon={<DollarSign className="w-4 h-4" />}
        accentColor={isMeta ? 'blue' : isGoogle ? 'cyan' : 'indigo'}
        winnerBadge={winners?.spend === 'meta' ? 'Meta' : winners?.spend === 'google' ? 'Google' : undefined}
      />

      <MetricCard
        label="Impressions"
        value={metrics.impressions.toLocaleString()}
        description="Total exposures of your ads"
        icon={<Eye className="w-4 h-4" />}
        accentColor="indigo"
        winnerBadge={winners?.impressions === 'meta' ? 'Meta' : winners?.impressions === 'google' ? 'Google' : undefined}
      />

      <MetricCard
        label="Clicks"
        value={metrics.clicks.toLocaleString()}
        description={`Click-through Rate: ${metrics.ctr.toFixed(2)}%`}
        icon={<MousePointer className="w-4 h-4" />}
        accentColor="emerald"
        winnerBadge={winners?.clicks === 'meta' ? 'Meta' : winners?.clicks === 'google' ? 'Google' : undefined}
      />

      {isMeta ? (
        <>
          <MetricCard
            label="Lead Form Fills"
            value={(metrics.leadFormFills || 0).toLocaleString()}
            description={
              metrics.costPerLeadForm !== undefined && metrics.costPerLeadForm > 0
                ? `Cost Per Form: ${formatCostDecimal(metrics.costPerLeadForm)}`
                : "No form conversions"
            }
            icon={<Award className="w-4 h-4" />}
            accentColor={(metrics.leadFormFills || 0) > 0 ? 'emerald' : 'rose'}
          />

          <MetricCard
            label="Website Leads"
            value={(metrics.websiteLeads || 0).toLocaleString()}
            description={
              metrics.costPerWebsiteLead !== undefined && metrics.costPerWebsiteLead > 0
                ? `Cost Per Lead: ${formatCostDecimal(metrics.costPerWebsiteLead)}`
                : "No website conversions"
            }
            icon={<Award className="w-4 h-4" />}
            accentColor={(metrics.websiteLeads || 0) > 0 ? 'emerald' : 'rose'}
          />
        </>
      ) : (
        <MetricCard
          label={platform === 'combined' ? "Total Conversions" : "Conversions (Leads)"}
          value={metrics.conversions.toLocaleString()}
          description={
            metrics.cpl !== undefined
              ? `Cost Per Lead: ${formatCostDecimal(metrics.cpl)}`
              : metrics.cpc > 0 
                ? `Average CPC: ${formatCostDecimal(metrics.cpc)}` 
                : "No conversions recorded"
          }
          icon={<Award className="w-4 h-4" />}
          accentColor={metrics.conversions > 0 ? 'emerald' : 'rose'}
          winnerBadge={winners?.conversions === 'meta' ? 'Meta' : winners?.conversions === 'google' ? 'Google' : undefined}
        />
      )}
    </div>
  )
}
