// components/revenue/RevenueQuarterlySummary.tsx
import React from 'react'
import { RevenueQuarterlyRow } from '@/lib/types'
import { formatCurrency } from '@/lib/sheets'
import ROASBadge from './ROASBadge'

interface RevenueQuarterlySummaryProps {
  rows: RevenueQuarterlyRow[]
}

export default function RevenueQuarterlySummary({ rows }: RevenueQuarterlySummaryProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-sm">📊 Quarterly Revenue summary</h3>
        <p className="text-xs text-slate-400 mt-0.5">Aggregated financial yields and ad campaigns return split by calendar quarters</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-900 text-slate-200 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
              <th className="px-6 py-3.5">Year</th>
              <th className="px-4 py-3.5">Quarter</th>
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
            {rows.map((q) => (
              <tr key={`${q.year}-${q.quarter}`} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{q.year}</td>
                <td className="px-4 py-4 font-bold text-slate-700">{q.quarter}</td>
                <td className="px-4 py-4 text-right font-mono text-slate-900 font-semibold">{q.conversions.toLocaleString()}</td>
                <td className="px-4 py-4 text-right font-mono text-emerald-600 font-bold">{formatCurrency(q.totalRevenue)}</td>
                <td className="px-4 py-4 text-right font-mono text-slate-655">{formatCurrency(q.avgFee)}</td>
                <td className="px-4 py-4 text-right font-mono text-red-655 font-medium">{q.totalAdSpend > 0 ? formatCurrency(q.totalAdSpend) : '—'}</td>
                <td className="px-4 py-4 text-right font-mono text-slate-600">{q.paidRevenue > 0 ? formatCurrency(q.paidRevenue) : '—'}</td>
                <td className="px-4 py-3.5 text-center">
                  {q.totalAdSpend > 0 ? <ROASBadge roas={q.overallROAS} /> : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-6 py-4 text-right font-mono font-bold text-emerald-700">{formatCurrency(q.organicRevenue)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-10 text-slate-400 font-medium">No quarterly revenue data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
