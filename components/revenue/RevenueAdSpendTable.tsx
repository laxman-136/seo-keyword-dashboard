// components/revenue/RevenueAdSpendTable.tsx
import React from 'react'
import { AdSpendBreakdown } from '@/lib/types'
import { formatCurrency } from '@/lib/sheets'
import ROASBadge from './ROASBadge'

interface RevenueAdSpendTableProps {
  data: AdSpendBreakdown[]
}

export default function RevenueAdSpendTable({ data }: RevenueAdSpendTableProps) {
  // Filter courses with ad spend
  const activeData = data.filter(d => d.totalAdSpend > 0)

  const totalGoogleSpend = activeData.reduce((acc, d) => acc + d.googleSpend, 0)
  const totalMetaSpend = activeData.reduce((acc, d) => acc + d.metaSpend, 0)
  const totalAdSpend = activeData.reduce((acc, d) => acc + d.totalAdSpend, 0)
  
  const totalGoogleRevenue = activeData.reduce((acc, d) => acc + d.googleRevenue, 0)
  const totalMetaRevenue = activeData.reduce((acc, d) => acc + d.metaRevenue, 0)
  const totalPaidRevenue = activeData.reduce((acc, d) => acc + d.paidRevenue, 0)

  const overallGoogleROAS = totalGoogleSpend > 0 ? totalGoogleRevenue / totalGoogleSpend : 0
  const overallMetaROAS = totalMetaSpend > 0 ? totalMetaRevenue / totalMetaSpend : 0
  const overallROAS = totalAdSpend > 0 ? totalPaidRevenue / totalAdSpend : 0

  const totalGoogleDemos = activeData.reduce((acc, d) => acc + d.demoGoogle, 0)
  const totalMetaDemos = activeData.reduce((acc, d) => acc + d.demoMeta, 0)
  const totalDemos = totalGoogleDemos + totalMetaDemos

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-sm">📢 Course-Wise Ad Spend & ROAS Detail</h3>
        <p className="text-xs text-slate-400 mt-0.5">Drill-down comparison of advertising cost vs returns split by Google and Meta Ads</p>
      </div>

      <div className="overflow-x-auto flex-1">
        {activeData.length > 0 ? (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-900 text-slate-200 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
                <th className="px-5 py-3">Course</th>
                <th className="px-4 py-3 text-right">Google Spend</th>
                <th className="px-4 py-3 text-center">Google ROAS</th>
                <th className="px-4 py-3 text-right">Meta Spend</th>
                <th className="px-4 py-3 text-center">Meta ROAS</th>
                <th className="px-4 py-3 text-right">Total Spend</th>
                <th className="px-4 py-3 text-center">Overall ROAS</th>
                <th className="px-5 py-3 text-right">Demo (G/M)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {activeData.map(d => (
                <tr key={d.course} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-800">{d.course}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-slate-700">{formatCurrency(d.googleSpend)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <ROASBadge roas={d.googleROAS} />
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-slate-700">{formatCurrency(d.metaSpend)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <ROASBadge roas={d.metaROAS} />
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-slate-900 font-bold">{formatCurrency(d.totalAdSpend)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <ROASBadge roas={d.roas} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <span className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-100 text-orange-750 text-[10px] font-bold font-mono">G: {d.demoGoogle}</span>
                      <span className="px-2 py-0.5 rounded-md bg-pink-50 border border-pink-100 text-pink-750 text-[10px] font-bold font-mono">M: {d.demoMeta}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                <td className="px-5 py-3.5 uppercase tracking-wider text-xs">TOTAL</td>
                <td className="px-4 py-3.5 text-right font-mono text-slate-700">{formatCurrency(totalGoogleSpend)}</td>
                <td className="px-4 py-3.5 text-center">
                  <ROASBadge roas={overallGoogleROAS} />
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-slate-700">{formatCurrency(totalMetaSpend)}</td>
                <td className="px-4 py-3.5 text-center">
                  <ROASBadge roas={overallMetaROAS} />
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-slate-900 font-black">{formatCurrency(totalAdSpend)}</td>
                <td className="px-4 py-3.5 text-center">
                  <ROASBadge roas={overallROAS} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <span className="px-2 py-0.5 rounded-md bg-orange-100/60 border border-orange-200/40 text-orange-800 text-[10px] font-bold font-mono">G: {totalGoogleDemos}</span>
                    <span className="px-2 py-0.5 rounded-md bg-pink-100/60 border border-pink-200/40 text-pink-800 text-[10px] font-bold font-mono">M: {totalMetaDemos}</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <div className="p-8 text-center text-slate-400">
            No ad spend recorded for this selected month.
          </div>
        )}
      </div>
    </div>
  )
}
