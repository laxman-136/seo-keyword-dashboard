// components/revenue/RevenueQuarterComparisonTable.tsx
import React from 'react'
import { RevenueQuarterlyDetailRow } from '@/lib/types'
import { getRevenueQuarterComparison, formatCurrency } from '@/lib/sheets'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RevenueQuarterComparisonTableProps {
  rows: RevenueQuarterlyDetailRow[]
  quarterA: string
  quarterB: string
}

export default function RevenueQuarterComparisonTable({ rows, quarterA, quarterB }: RevenueQuarterComparisonTableProps) {
  const { a, b, deltas } = getRevenueQuarterComparison(rows, quarterA, quarterB)

  const calcROAS = (rev: number, spend: number) => {
    return spend > 0 ? parseFloat((rev / spend).toFixed(2)) : 0
  }

  const roasA_google = calcROAS(a.googleAdsRevenue, a.googleAdSpend)
  const roasB_google = calcROAS(b.googleAdsRevenue, b.googleAdSpend)
  const roasA_meta = calcROAS(a.metaAdsRevenue, a.metaAdSpend)
  const roasB_meta = calcROAS(b.metaAdsRevenue, b.metaAdSpend)

  const metrics = [
    { label: '💰 Gross Revenue', valA: a.totalRevenue, valB: b.totalRevenue, delta: deltas.totalRevenue, key: 'totalRevenue', isCurrency: true, highlight: 'text-emerald-650 font-extrabold' },
    { label: '🎓 Student Enrollments', valA: a.conversions, valB: b.conversions, delta: deltas.conversions, key: 'conversions', highlight: 'text-blue-600 font-bold' },
    { label: '🎫 Average Ticket Size', valA: a.avgFee, valB: b.avgFee, delta: deltas.avgFee, key: 'avgFee', isCurrency: true },
    
    { label: '🔍 Organic Revenue', valA: a.organicRevenue, valB: b.organicRevenue, delta: deltas.organicRevenue, key: 'organicRevenue', isCurrency: true },
    { label: '🔍 Organic Conversions', valA: a.organicConversions, valB: b.organicConversions, delta: deltas.organicConversions, key: 'organicConversions' },
    
    { label: '🔥 Paid Ads Revenue', valA: a.paidRevenue, valB: b.paidRevenue, delta: deltas.paidRevenue, key: 'paidRevenue', isCurrency: true },
    { label: '🔥 Paid Ads Conversions', valA: (a.googleAdsConversions + a.metaAdsConversions), valB: (b.googleAdsConversions + b.metaAdsConversions), delta: ((a.googleAdsConversions + a.metaAdsConversions) - (b.googleAdsConversions + b.metaAdsConversions)), key: 'paidConversions' },
    
    { label: '📢 Total Ad Spend', valA: a.totalAdSpend, valB: b.totalAdSpend, delta: deltas.totalAdSpend, key: 'totalAdSpend', isCurrency: true, highlight: 'text-red-600' },
    { label: '📢 Google Ads Spend', valA: a.googleAdSpend, valB: b.googleAdSpend, delta: deltas.googleAdSpend, key: 'googleAdSpend', isCurrency: true },
    { label: '📢 Meta Ads Spend', valA: a.metaAdSpend, valB: b.metaAdSpend, delta: deltas.metaAdSpend, key: 'metaAdSpend', isCurrency: true },
    
    { label: '📈 Blended ROAS', valA: a.overallROAS, valB: b.overallROAS, delta: deltas.overallROAS, key: 'overallROAS', isROAS: true, highlight: 'text-violet-600 font-bold' },
    { label: '📈 Google Ads ROAS', valA: roasA_google, valB: roasB_google, delta: roasA_google - roasB_google, key: 'googleROAS', isROAS: true },
    { label: '📈 Meta Ads ROAS', valA: roasA_meta, valB: roasB_meta, delta: roasA_meta - roasB_meta, key: 'metaROAS', isROAS: true },

    { label: '🌐 Website Revenue', valA: a.websiteRevenue, valB: b.websiteRevenue, delta: deltas.websiteRevenue, key: 'websiteRevenue', isCurrency: true },
    { label: '🤝 Referral Revenue', valA: a.referralRevenue, valB: b.referralRevenue, delta: deltas.referralRevenue, key: 'referralRevenue', isCurrency: true },
    { label: '🚶 Direct/Walk-in Revenue', valA: a.directRevenue, valB: b.directRevenue, delta: deltas.directRevenue, key: 'directRevenue', isCurrency: true },
  ]

  const formatVal = (v: number, isCurrency = false, isROAS = false) => {
    if (isCurrency) return formatCurrency(v)
    if (isROAS) return v === 0 ? 'N/A' : `${v.toFixed(2)}x`
    return v.toLocaleString()
  }

  const formatDelta = (d: number, isCurrency = false, isROAS = false) => {
    const abs = Math.abs(d)
    const sign = d > 0 ? '+' : '-'
    if (isCurrency) return `${sign}${formatCurrency(abs)}`
    if (isROAS) return `${sign}${abs.toFixed(2)}x`
    return `${sign}${abs.toLocaleString()}`
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-sm">📅 Quarterly Period Comparison</h3>
        <p className="text-xs text-slate-400 mt-0.5">Side-by-side quarterly performance audit between selected quarters</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-900 text-slate-200 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
              <th className="px-6 py-3.5">Metric</th>
              <th className="px-4 py-3.5 text-right">{quarterA}</th>
              <th className="px-4 py-3.5 text-right">{quarterB}</th>
              <th className="px-4 py-3.5 text-right">Δ Absolute</th>
              <th className="px-6 py-3.5 text-right">Δ % Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {metrics.map(m => {
              const delta = m.delta
              const isPositive = delta > 0
              const isNegative = delta < 0
              
              let pctChange = ''
              if (m.isROAS) {
                pctChange = '-'
              } else if (m.valB === 0) {
                pctChange = m.valA > 0 ? 'New' : '0%'
              } else {
                const computed = ((m.valA - m.valB) / m.valB) * 100
                pctChange = computed > 0 ? `+${computed.toFixed(1)}%` : `${computed.toFixed(1)}%`
              }

              const isSpendMetric = m.key.toLowerCase().includes('spend')
              const badgeClass = delta === 0
                ? 'bg-slate-50 text-slate-500 border-slate-100'
                : isPositive
                  ? (isSpendMetric ? 'bg-red-50 text-red-800 border-red-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100')
                  : (isSpendMetric ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100')

              return (
                <tr key={m.key} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap">{m.label}</td>
                  <td className={cn("px-4 py-4 text-right font-mono font-bold text-slate-800", m.highlight)}>
                    {formatVal(m.valA, m.isCurrency, m.isROAS)}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-slate-500">
                    {formatVal(m.valB, m.isCurrency, m.isROAS)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={cn("px-2 py-0.5 rounded-lg text-xs font-bold border inline-flex items-center gap-0.5", badgeClass)}>
                      {isPositive && <ArrowUpRight className={cn("w-3 h-3", isSpendMetric ? 'text-red-600' : 'text-emerald-600')} />}
                      {isNegative && <ArrowDownRight className={cn("w-3 h-3", isSpendMetric ? 'text-emerald-600' : 'text-red-600')} />}
                      {!isPositive && !isNegative && <Minus className="w-3 h-3 text-slate-400" />}
                      {delta === 0 ? 'No change' : formatDelta(delta, m.isCurrency, m.isROAS)}
                    </span>
                  </td>
                  <td className={cn("px-6 py-4 text-right font-mono font-bold", 
                    pctChange === '-' ? 'text-slate-400' :
                    isPositive ? (isSpendMetric ? 'text-red-500' : 'text-emerald-600') : 
                    isNegative ? (isSpendMetric ? 'text-emerald-600' : 'text-red-500') : 'text-slate-500'
                  )}>
                    {pctChange}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
