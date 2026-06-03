// components/revenue/RevenueSourceTable.tsx
import React from 'react'
import { RevenueSourceBreakdown } from '@/lib/types'
import { formatCurrency } from '@/lib/sheets'

interface RevenueSourceTableProps {
  sources: RevenueSourceBreakdown[]
}

export default function RevenueSourceTable({ sources }: RevenueSourceTableProps) {
  const totalConversions = sources.reduce((acc, s) => acc + s.conversions, 0)
  const totalRevenue = sources.reduce((acc, s) => acc + s.revenue, 0)
  const avgFee = totalConversions > 0 ? Math.round(totalRevenue / totalConversions) : 0

  const getSourceIcon = (src: string) => {
    const s = src.toLowerCase()
    if (s.includes('organic')) return '🔍'
    if (s.includes('website')) return '🌐'
    if (s.includes('referral')) return '🤝'
    if (s.includes('google')) return '🔥'
    if (s.includes('facebook') || s.includes('meta')) return '📱'
    return '🚶'
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col justify-between">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-sm">🌐 Revenue by Acquisition Source</h3>
        <p className="text-xs text-slate-400 mt-0.5">Conversions, revenue yields, shares, and average pricing breakdown by channel</p>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-900 text-slate-200 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
              <th className="px-5 py-3">Source</th>
              <th className="px-4 py-3 text-right">Conversions</th>
              <th className="px-4 py-3 text-right">Conv. Share</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3 text-right">Rev. Share</th>
              <th className="px-5 py-3 text-right">Avg. Fee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {sources.map(s => (
              <tr key={s.source} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-slate-700 flex items-center gap-2">
                  <span className="text-base shrink-0">{getSourceIcon(s.source)}</span>
                  <span className="truncate">{s.source}</span>
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-slate-900">{s.conversions.toLocaleString()}</td>
                <td className="px-4 py-3.5 text-right font-semibold text-slate-500">{s.convSharePct.toFixed(1)}%</td>
                <td className="px-4 py-3.5 text-right text-emerald-600 font-bold">{formatCurrency(s.revenue)}</td>
                <td className="px-4 py-3.5 text-right text-indigo-600 font-semibold">{s.revenueSharePct.toFixed(1)}%</td>
                <td className="px-5 py-3.5 text-right font-bold text-slate-800">{formatCurrency(s.avgFee)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
              <td className="px-5 py-3.5 uppercase tracking-wider text-xs">TOTAL</td>
              <td className="px-4 py-3.5 text-right font-mono">{totalConversions.toLocaleString()}</td>
              <td className="px-4 py-3.5 text-right">100%</td>
              <td className="px-4 py-3.5 text-right text-emerald-700">{formatCurrency(totalRevenue)}</td>
              <td className="px-4 py-3.5 text-right text-indigo-700">100%</td>
              <td className="px-5 py-3.5 text-right text-violet-750 font-extrabold">{formatCurrency(avgFee)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
