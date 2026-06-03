// components/revenue/RevenueCourseTable.tsx
import React from 'react'
import { RevenueCourseAggregate } from '@/lib/types'
import { formatCurrency } from '@/lib/sheets'
import ROASBadge from './ROASBadge'
import { Layers, User } from 'lucide-react'

interface RevenueCourseTableProps {
  courses: RevenueCourseAggregate[]
}

export default function RevenueCourseTable({ courses }: RevenueCourseTableProps) {
  const totalConversions = courses.reduce((acc, c) => acc + c.conversions, 0)
  const totalRevenue = courses.reduce((acc, c) => acc + c.revenue, 0)
  const totalAdSpend = courses.reduce((acc, c) => acc + c.totalAdSpend, 0)
  const totalPaidRevenue = courses.reduce((acc, c) => acc + c.paidRevenue, 0)
  
  const avgFee = totalConversions > 0 ? Math.round(totalRevenue / totalConversions) : 0
  const overallROAS = totalAdSpend > 0 ? totalPaidRevenue / totalAdSpend : 0
  const totalDemos = courses.reduce((acc, c) => acc + c.totalDemoAttended, 0)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col justify-between">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-sm">🎓 Course-Wise Revenue Breakdown</h3>
        <p className="text-xs text-slate-400 mt-0.5">Enrollments, yields, fee averages, ad investments, ROAS metrics, and demo participation</p>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-900 text-slate-200 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
              <th className="px-5 py-3">Course / Batch</th>
              <th className="px-4 py-3 text-right">Conversions</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3 text-right">Rev. Share</th>
              <th className="px-4 py-3 text-right">Avg. Fee</th>
              <th className="px-4 py-3 text-right">Ad Spend</th>
              <th className="px-4 py-3 text-center">ROAS</th>
              <th className="px-5 py-3 text-right">Demos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {courses.map(c => (
              <tr key={c.courseName} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-5 py-3.5 text-slate-800 whitespace-nowrap">
                  <div className="font-bold text-slate-850">{c.courseName}</div>
                  {c.batchNo && (
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      <span className="flex items-center gap-0.5"><Layers className="w-2.5 h-2.5" /> {c.batchNo}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><User className="w-2.5 h-2.5" /> {c.faculty}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-slate-900">{c.conversions.toLocaleString()}</td>
                <td className="px-4 py-3.5 text-right text-emerald-600 font-bold">{formatCurrency(c.revenue)}</td>
                <td className="px-4 py-3.5 text-right font-semibold text-slate-650">{c.revenueSharePct.toFixed(1)}%</td>
                <td className="px-4 py-3.5 text-right text-slate-600 font-medium">{formatCurrency(c.avgFee)}</td>
                <td className="px-4 py-3.5 text-right font-mono text-slate-700">{c.totalAdSpend > 0 ? formatCurrency(c.totalAdSpend) : '—'}</td>
                <td className="px-4 py-3.5 text-center">
                  {c.totalAdSpend > 0 ? <ROASBadge roas={c.roas} /> : <span className="text-slate-400 text-xs">—</span>}
                </td>
                <td className="px-5 py-3.5 text-right font-bold text-violet-650 font-mono">{c.totalDemoAttended.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
              <td className="px-5 py-3.5 uppercase tracking-wider text-xs">TOTAL / AVG</td>
              <td className="px-4 py-3.5 text-right font-mono">{totalConversions.toLocaleString()}</td>
              <td className="px-4 py-3.5 text-right text-emerald-750">{formatCurrency(totalRevenue)}</td>
              <td className="px-4 py-3.5 text-right">100%</td>
              <td className="px-4 py-3.5 text-right text-slate-750">{formatCurrency(avgFee)}</td>
              <td className="px-4 py-3.5 text-right font-mono">{totalAdSpend > 0 ? formatCurrency(totalAdSpend) : '—'}</td>
              <td className="px-4 py-3.5 text-center">
                {totalAdSpend > 0 ? <ROASBadge roas={overallROAS} /> : <span className="text-slate-450 text-xs">—</span>}
              </td>
              <td className="px-5 py-3.5 text-right text-violet-750 font-mono">{totalDemos.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
