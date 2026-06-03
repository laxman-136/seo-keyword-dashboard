// components/revenue/RevenueOrganicPaidCard.tsx
import React from 'react'
import { RevenueMonthlyRow } from '@/lib/types'
import { formatCurrency } from '@/lib/sheets'

interface RevenueOrganicPaidCardProps {
  row: RevenueMonthlyRow
}

export default function RevenueOrganicPaidCard({ row }: RevenueOrganicPaidCardProps) {
  // Organic/Direct sources: Organic + Referrals + Direct/Walk-in
  const organicRev = (row.organicRevenue || 0) + (row.referralRevenue || 0) + (row.directRevenue || 0)
  const organicConv = (row.organicConversions || 0) + (row.referralConversions || 0) + (row.directConversions || 0)
  const organicTicket = organicConv > 0 ? Math.round(organicRev / organicConv) : 0

  // Paid sources: Google Ads + Meta Ads
  const paidRev = row.paidRevenue || 0
  const paidConv = (row.googleAdsConversions || 0) + (row.metaAdsConversions || 0)
  const paidTicket = paidConv > 0 ? Math.round(paidRev / paidConv) : 0

  // Website source
  const webRev = row.websiteRevenue || 0
  const webConv = row.websiteConversions || 0
  const webTicket = webConv > 0 ? Math.round(webRev / webConv) : 0

  const totalRev = row.totalRevenue || 1

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div>
        <h3 className="font-bold text-slate-805 text-sm">⚖️ Performance Source Comparison</h3>
        <p className="text-xs text-slate-400 mt-0.5">Yield comparison of organic/referrals vs paid marketing channels vs website chatbot leads</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Organic Stream */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Organic & Referrals</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(organicRev)}</p>
            <p className="text-[10px] text-slate-450 mt-0.5">Share: {((organicRev / totalRev) * 100).toFixed(1)}%</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs font-semibold text-slate-600 flex justify-between">
            <span>Conversions: {organicConv}</span>
            <span>Avg: {formatCurrency(organicTicket)}</span>
          </div>
        </div>

        {/* Paid Ads Stream */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-orange-600 tracking-wider">Paid Ads campaigns</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(paidRev)}</p>
            <p className="text-[10px] text-slate-450 mt-0.5">Share: {((paidRev / totalRev) * 100).toFixed(1)}%</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs font-semibold text-slate-600 flex justify-between">
            <span>Conversions: {paidConv}</span>
            <span>Avg: {formatCurrency(paidTicket)}</span>
          </div>
        </div>

        {/* Website Chatbot/Inbound Stream */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Website Chatbot</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(webRev)}</p>
            <p className="text-[10px] text-slate-450 mt-0.5">Share: {((webRev / totalRev) * 100).toFixed(1)}%</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs font-semibold text-slate-600 flex justify-between">
            <span>Conversions: {webConv}</span>
            <span>Avg: {formatCurrency(webTicket)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
