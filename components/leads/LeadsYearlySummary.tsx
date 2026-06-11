// components/leads/LeadsYearlySummary.tsx
import React from 'react'
import { LeadsYearlyDetailRow } from '@/lib/types'

interface LeadsYearlySummaryProps {
  rows: LeadsYearlyDetailRow[]
}

export default function LeadsYearlySummary({ rows }: LeadsYearlySummaryProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-sm">📊 Yearly Leads Performance</h3>
        <p className="text-xs text-slate-400 mt-0.5">Aggregated metrics grouped into calendar years</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-900 text-slate-200 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
              <th className="px-6 py-3.5">Year</th>
              <th className="px-4 py-3.5 text-right">Total Leads</th>
              <th className="px-4 py-3.5 text-right text-slate-400 font-semibold">Website Leads</th>
              <th className="px-4 py-3.5 text-right text-slate-400 font-semibold">Organic Leads</th>
              <th className="px-4 py-3.5 text-right text-pink-400 font-semibold">LLM Leads</th>
              <th className="px-4 py-3.5 text-right text-emerald-400 font-bold">Enrolled</th>
              <th className="px-4 py-3.5 text-right text-blue-400 font-semibold">High Potential</th>
              <th className="px-6 py-3.5 text-right">Conv Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((y) => (
              <tr key={y.year} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800 text-base">{y.year}</td>
                <td className="px-4 py-4 text-right font-mono font-bold text-slate-900">{y.totalLeads.toLocaleString()}</td>
                <td className="px-4 py-4 text-right font-mono text-slate-500">{y.websiteLeads.toLocaleString()}</td>
                <td className="px-4 py-4 text-right font-mono text-slate-500">{y.organicLeads.toLocaleString()}</td>
                <td className="px-4 py-4 text-right font-mono text-pink-600 font-bold">{(y.llmLeads || 0).toLocaleString()}</td>
                <td className="px-4 py-4 text-right font-mono text-emerald-600 font-bold">{y.enrolled.toLocaleString()}</td>
                <td className="px-4 py-4 text-right font-mono text-blue-600 font-semibold">{y.highPotential.toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                  {y.convRate.toFixed(1)}%
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">No leads data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
