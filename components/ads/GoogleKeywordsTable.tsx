// components/ads/GoogleKeywordsTable.tsx
'use client';

import React, { useState } from 'react'
import { GoogleKeyword } from '@/lib/types'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GoogleKeywordsTableProps {
  keywords: GoogleKeyword[]
}

export default function GoogleKeywordsTable({ keywords }: GoogleKeywordsTableProps) {
  const [filterText, setFilterText] = useState('')

  const filtered = keywords.filter(k =>
    k.text.toLowerCase().includes(filterText.toLowerCase()) ||
    k.matchType.toLowerCase().includes(filterText.toLowerCase())
  )

  const getQualityScoreColor = (score: number | null) => {
    if (score === null) return "bg-slate-100 text-slate-400 border-slate-200"
    if (score >= 8) return "bg-emerald-50 text-emerald-700 border-emerald-200"
    if (score >= 5) return "bg-amber-50 text-amber-700 border-amber-200"
    return "bg-rose-50 text-rose-700 border-rose-250"
  }

  const getMatchTypeLabel = (type: string) => {
    if (type === 'EXACT') return "Exact Match"
    if (type === 'PHRASE') return "Phrase Match"
    return "Broad Match"
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Table Header / Filter */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h4 className="text-xs sm:text-sm font-extrabold text-slate-800">Target Keywords Performance</h4>
          <p className="text-[9px] text-slate-400 font-medium">Quality Scores and direct metrics for triggered keywords.</p>
        </div>
        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search keywords..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500 transition-all font-medium text-slate-700"
          />
        </div>
      </div>

      {/* Spreadsheet */}
      <div className="overflow-x-auto text-left flex-1 max-h-[360px] overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-150 text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
            <tr>
              <th className="py-2.5 px-4">Keyword Text</th>
              <th className="py-2.5 px-3">Match Type</th>
              <th className="py-2.5 px-3 text-center">Quality Score</th>
              <th className="py-2.5 px-3 text-right">Impressions</th>
              <th className="py-2.5 px-3 text-right">Clicks</th>
              <th className="py-2.5 px-3 text-right">CTR %</th>
              <th className="py-2.5 px-3 text-right">Cost</th>
              <th className="py-2.5 px-3 text-right">Conversions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filtered.length > 0 ? (
              filtered.map((k, idx) => (
                <tr key={`${k.id || k.text}-${idx}`} className="transition-colors hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-bold text-slate-800">{k.text}</td>
                  <td className="py-2.5 px-3">
                    <span className={cn(
                      "text-[9px] font-extrabold px-2 py-0.5 rounded-full border",
                      k.matchType === 'EXACT' 
                        ? "bg-blue-50 text-blue-700 border-blue-100" 
                        : k.matchType === 'PHRASE'
                          ? "bg-purple-50 text-purple-700 border-purple-100"
                          : "bg-orange-50 text-orange-700 border-orange-100"
                    )}>
                      {getMatchTypeLabel(k.matchType)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={cn(
                      "inline-block w-8 py-0.5 text-[10px] font-extrabold rounded-md border text-center font-mono",
                      getQualityScoreColor(k.qualityScore)
                    )}>
                      {k.qualityScore !== null ? `${k.qualityScore}/10` : '-'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-600">{k.impressions.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-600">{k.clicks.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-600">{k.ctr.toFixed(2)}%</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">₹{Math.round(k.spend).toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">{k.conversions.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-xs text-slate-400 font-semibold">
                  No active keywords matching search queries.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
