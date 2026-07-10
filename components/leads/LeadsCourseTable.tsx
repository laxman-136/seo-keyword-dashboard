// components/leads/LeadsCourseTable.tsx
import React from 'react'
import { LeadsCourseAggregate } from '@/lib/types'
import { cn } from '@/lib/utils'

interface LeadsCourseTableProps {
  courses: LeadsCourseAggregate[]
}

export default function LeadsCourseTable({ courses }: LeadsCourseTableProps) {
  
  const getConvColorClass = (rate: number) => {
    if (rate >= 10) return 'bg-emerald-50 text-emerald-800 border-emerald-200'
    if (rate >= 5) return 'bg-blue-50 text-blue-800 border-blue-200'
    if (rate >= 1) return 'bg-amber-50/70 text-amber-800 border-amber-200'
    return 'bg-red-50 text-red-800 border-red-200'
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-sm">📚 Detailed Course Performance</h3>
        <p className="text-xs text-slate-400 mt-0.5">Comprehensive lead tracking, status categories, and enrollment rates per subject area</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-900 text-slate-200 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
              <th className="px-6 py-3.5">#</th>
              <th className="px-4 py-3.5">Course Name</th>
              <th className="px-4 py-3.5 text-right">Total Leads</th>
              <th className="px-4 py-3.5 text-right text-indigo-400 font-semibold">Paid Ads</th>
              <th className="px-4 py-3.5 text-right text-slate-400 font-semibold">Website</th>
              <th className="px-4 py-3.5 text-right text-slate-400 font-semibold">Organic</th>
              <th className="px-4 py-3.5 text-right text-pink-400 font-semibold">LLM</th>
              <th className="px-4 py-3.5 text-right text-emerald-400 font-bold">Enrolled</th>
              <th className="px-4 py-3.5 text-right text-emerald-400 font-bold">Cash Received</th>
              <th className="px-4 py-3.5 text-right text-indigo-400 font-bold">Contract Value</th>
              <th className="px-4 py-3.5 text-right text-blue-400 font-semibold">High Pot</th>
              <th className="px-4 py-3.5 text-right text-amber-400">Med Pot</th>
              <th className="px-4 py-3.5 text-right text-slate-450">Fresh</th>
              <th className="px-4 py-3.5 text-right text-red-400">Low/Cold</th>
              <th className="px-6 py-3.5 text-right">Conv Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.map((c, i) => {
              const rank = i + 1
              const rowHighlight = rank === 1 ? 'bg-amber-50/15' : rank === 2 ? 'bg-slate-50/20' : rank === 3 ? 'bg-orange-50/10' : ''
              
              return (
                <tr key={c.courseName} className={cn("hover:bg-slate-50/60 transition-colors", rowHighlight)}>
                  <td className="px-6 py-4 font-bold text-slate-400">{rank}</td>
                  <td className="px-4 py-4 font-semibold text-slate-800">{c.courseName}</td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-slate-900">{c.total.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-mono text-indigo-650 font-semibold">{c.ads.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-mono text-slate-500">{c.website.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-mono text-slate-500">{c.organic.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-mono text-pink-600 font-medium">{c.llm.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-mono text-emerald-600 font-bold">{c.enrolled.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-mono text-emerald-650 font-bold">₹{(c.revenueCash || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-4 text-right font-mono text-indigo-650 font-bold">₹{(c.revenueContract || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-4 text-right font-mono text-blue-600 font-semibold">{c.highPotential.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-mono text-amber-600">{c.mediumPotential.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-mono text-slate-500">{c.freshUnqualified.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-mono text-red-500">{c.lowCold.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border inline-block", getConvColorClass(c.convRate))}>
                      {c.convRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              )
            })}
            {courses.length === 0 && (
              <tr>
                <td colSpan={15} className="text-center py-10 text-slate-400 font-medium">No course detail data found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
