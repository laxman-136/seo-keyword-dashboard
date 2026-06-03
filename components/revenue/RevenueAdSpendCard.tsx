// components/revenue/RevenueAdSpendCard.tsx
import React from 'react'
import { RevenueMonthlyRow } from '@/lib/types'
import { formatCurrency } from '@/lib/sheets'
import ROASBadge from './ROASBadge'
import { TrendingUp, Percent, DollarSign, Users } from 'lucide-react'

interface RevenueAdSpendCardProps {
  row: RevenueMonthlyRow
}

export default function RevenueAdSpendCard({ row }: RevenueAdSpendCardProps) {
  const totalSpend = row.totalAdSpend || 0
  const googleSpend = row.googleAdSpend || 0
  const metaSpend = row.metaAdSpend || 0
  const paidRevenue = row.paidRevenue || 0
  const roas = row.overallROAS || 0

  const googlePct = totalSpend > 0 ? (googleSpend / totalSpend) * 100 : 0
  const metaPct = totalSpend > 0 ? (metaSpend / totalSpend) * 100 : 0

  const paidConversions = (row.googleAdsConversions || 0) + (row.metaAdsConversions || 0)
  const cac = paidConversions > 0 ? Math.round(totalSpend / paidConversions) : 0

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-805 text-sm">💰 Budget Efficiency Overview</h3>
          <p className="text-xs text-slate-400 mt-0.5">Summary of paid advertising investments and performance</p>
        </div>
        <ROASBadge roas={roas} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        {/* Metric 1 */}
        <div className="bg-slate-50 border border-slate-100/80 rounded-xl p-4 space-y-1 flex flex-col justify-between">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none">Total Ad Spend</p>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{formatCurrency(totalSpend)}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            Google: <span className="font-semibold text-slate-700">{googlePct.toFixed(0)}%</span> | Meta: <span className="font-semibold text-slate-700">{metaPct.toFixed(0)}%</span>
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-50 border border-slate-100/80 rounded-xl p-4 space-y-1 flex flex-col justify-between">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none">Paid Ads Revenue</p>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-600">{formatCurrency(paidRevenue)}</span>
          </div>
          <p className="text-[10px] text-slate-550 mt-2">
            Revenue from paid ads
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-50 border border-slate-100/80 rounded-xl p-4 space-y-1 flex flex-col justify-between">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none">Enrollment CAC</p>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-xl sm:text-2xl font-black text-indigo-600">{formatCurrency(cac)}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            Across <span className="font-semibold text-slate-700">{paidConversions}</span> enrolls
          </p>
        </div>
      </div>

      {/* Visual Progress Split */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Google Ads ({formatCurrency(googleSpend)})</span>
          <span className="flex items-center gap-1.5">Meta Ads ({formatCurrency(metaSpend)}) <span className="w-2.5 h-2.5 rounded-full bg-pink-500" /></span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
          <div className="h-full bg-orange-500" style={{ width: `${googlePct}%` }} title={`Google Spend: ${googlePct.toFixed(1)}%`} />
          <div className="h-full bg-pink-500" style={{ width: `${metaPct}%` }} title={`Meta Spend: ${metaPct.toFixed(1)}%`} />
        </div>
      </div>
    </div>
  )
}
