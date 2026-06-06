// components/ads/GoogleSearchTermsTable.tsx
'use client';

import React, { useState } from 'react'
import { GoogleSearchTerm } from '@/lib/types'
import { Search, AlertTriangle, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GoogleSearchTermsTableProps {
  searchTerms: GoogleSearchTerm[]
}

const NEGATIVE_KWD_PATTERNS = [
  'free', 'job', 'jobs', 'vacancy', 'syllabus', 'salary', 'pdf', 'resume', 'download', 'question paper', 'interview question'
]

export default function GoogleSearchTermsTable({ searchTerms }: GoogleSearchTermsTableProps) {
  const [filterText, setFilterText] = useState('')
  const [showNegativesOnly, setShowNegativesOnly] = useState(false)

  // Checker function
  const isNegativeCandidate = (term: string): boolean => {
    const lower = term.toLowerCase()
    return NEGATIVE_KWD_PATTERNS.some(p => lower.includes(p))
  }

  const processedTerms = searchTerms.map(t => ({
    ...t,
    isNegativeCandidate: isNegativeCandidate(t.searchTerm)
  }))

  const filtered = processedTerms.filter(t => {
    const matchesSearch = t.searchTerm.toLowerCase().includes(filterText.toLowerCase()) ||
                          t.campaignName.toLowerCase().includes(filterText.toLowerCase())
    const matchesNegativeFilter = showNegativesOnly ? t.isNegativeCandidate : true
    return matchesSearch && matchesNegativeFilter
  })

  const totalNegatives = processedTerms.filter(t => t.isNegativeCandidate).length

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Table Header / Filters */}
      <div className="p-4 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
        <div>
          <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
            Search Queries Report
            {totalNegatives > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                {totalNegatives} Negative Candidate{totalNegatives > 1 ? 's' : ''}
              </span>
            )}
          </h4>
          <p className="text-[9px] text-slate-400 font-medium">Actual queries triggered by search campaigns. Review candidates for negative exclusion list.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          {/* Toggle Negatives Button */}
          <button
            onClick={() => setShowNegativesOnly(!showNegativesOnly)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold transition-all w-full sm:w-auto justify-center select-none outline-none",
              showNegativesOnly 
                ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/60 font-bold"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Negatives Only</span>
          </button>

          {/* Search Input */}
          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search queries..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500 transition-all font-medium text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto text-left flex-1 max-h-[360px] overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-150 text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
            <tr>
              <th className="py-2.5 px-4">Search Term Query</th>
              <th className="py-2.5 px-3">Campaign Group</th>
              <th className="py-2.5 px-3 text-center">Status Flag</th>
              <th className="py-2.5 px-3 text-right">Impressions</th>
              <th className="py-2.5 px-3 text-right">Clicks</th>
              <th className="py-2.5 px-3 text-right">CTR %</th>
              <th className="py-2.5 px-3 text-right">Cost</th>
              <th className="py-2.5 px-3 text-right">Conversions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filtered.length > 0 ? (
              filtered.map((t, idx) => (
                <tr key={`${t.searchTerm}-${idx}`} className={cn(
                  "transition-colors hover:bg-slate-50/50",
                  t.isNegativeCandidate && "bg-amber-50/10 hover:bg-amber-50/25"
                )}>
                  <td className="py-2.5 px-4 font-bold text-slate-800 min-w-[200px]">
                    {t.searchTerm}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-medium truncate max-w-[150px]">{t.campaignName}</td>
                  <td className="py-2.5 px-3 text-center">
                    {t.isNegativeCandidate ? (
                      <span className="inline-flex items-center gap-1 text-[8px] font-extrabold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200">
                        <AlertTriangle className="w-2.5 h-2.5 text-amber-500" /> Negative Match
                      </span>
                    ) : (
                      <span className="text-slate-300 font-mono text-[10px] font-medium">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-600">{t.impressions.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-600">{t.clicks.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-600">{t.ctr.toFixed(2)}%</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">₹{Math.round(t.spend).toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">{t.conversions.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-xs text-slate-400 font-semibold">
                  No search queries match active filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
