// components/revenue/RevenueYearlySummary.tsx
import React from 'react'
import { RevenueYearlyRow } from '@/lib/types'
import { formatCurrency } from '@/lib/sheets'
import ROASBadge from './ROASBadge'

interface RevenueYearlySummaryProps {
  rows: RevenueYearlyRow[]
}

export default function RevenueYearlySummary({ rows }: RevenueYearlySummaryProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-sm">📊 Yearly Revenue Summary</h3>
        <p className="text-xs text-slate-400 mt-0.5">Aggregated yearly financial returns, student acquisitions, and blending performance audits</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-900 text-slate-200 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
              <th className="px-6 py-3.5">Year</th>
              <th className="px-4 py-3.5 text-right">Conversions</th>
              <th className="px-4 py-3.5 text-right">Gross Revenue</th>
              <th className="px-4 py-3.5 text-right text-slate-400 font-semibold">Avg. Fee</th>
              <th className="px-4 py-3.5 text-right text-slate-400 font-semibold">Ad Spend</th>
              <th className="px-4 py-3.5 text-right text-slate-400 font-semibold">Paid Rev</th>
              <th className="px-4 py-3.5 text-center">Overall ROAS</th>
              <th className="px-6 py-3.5 text-right text-emerald-400 font-bold">Organic Rev</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((y) => (
              <tr key={y.year} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 font-extrabold text-slate-950 text-base">{y.year}</td>
                <td className="px-4 py-4 text-right font-mono text-slate-900 font-semibold">{y.conversions.toLocaleString()}</td>
                <td className="px-4 py-4 text-right font-mono text-emerald-600 font-bold">{formatCurrency(y.totalRevenue)}</td>
                <td className="px-4 py-4 text-right font-mono text-slate-600">{formatCurrency(y.avgFee)}</td>
                <td className="px-4 py-4 text-right font-mono text-red-655 font-medium">{y.totalAdSpend > 0 ? formatCurrency(y.totalAdSpend) : '—'}</td>
                <td className="px-4 py-4 text-right font-mono text-slate-600">{y.paidRevenue > 0 ? formatCurrency(y.paidRevenue) : '—'}</td>
                <td className="px-4 py-3.5 text-center">
                  {y.totalAdSpend > 0 ? <ROASBadge roas={y.overallROAS} /> : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-6 py-4 text-right font-mono font-bold text-emerald-700">{formatCurrency(y.organicRevenue)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400 font-medium">No yearly revenue data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
