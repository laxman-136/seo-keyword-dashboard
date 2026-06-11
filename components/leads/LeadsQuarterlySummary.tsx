// components/leads/LeadsQuarterlySummary.tsx
import React, { useMemo } from 'react'
import { LeadsMonthlyRow } from '@/lib/types'

interface LeadsQuarterlySummaryProps {
  rows: LeadsMonthlyRow[]
}

interface QuarterRow {
  year: number
  quarter: string
  totalLeads: number
  websiteLeads: number
  organicLeads: number
  llmLeads: number
  enrolled: number
  highPotential: number
  convRate: number
}

export default function LeadsQuarterlySummary({ rows }: LeadsQuarterlySummaryProps) {
  const quarterlyData = useMemo(() => {
    if (!rows || rows.length === 0) return []

    // Helper to parse Month Year to date
    const parseMonthToDate = (m: string) => {
      const parts = m.split(' ')
      if (parts.length < 2) return new Date(m)
      const months: Record<string, number> = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 }
      return new Date(parseInt(parts[1], 10), months[parts[0].toLowerCase().substring(0, 3)] ?? 0, 1)
    }

    const groups: Record<string, LeadsMonthlyRow[]> = {}
    rows.forEach(row => {
      const date = parseMonthToDate(row.month)
      const year = date.getFullYear()
      const month = date.getMonth() // 0-11
      let q = 'Q1'
      if (month >= 9) q = 'Q4'
      else if (month >= 6) q = 'Q3'
      else if (month >= 3) q = 'Q2'

      const key = `${year}-${q}`
      if (!groups[key]) groups[key] = []
      groups[key].push(row)
    })

    const result: QuarterRow[] = Object.entries(groups).map(([key, list]) => {
      const [yearStr, quarter] = key.split('-')
      const year = parseInt(yearStr, 10)
      
      const totalLeads = list.reduce((sum, r) => sum + r.totalLeads, 0)
      const websiteLeads = list.reduce((sum, r) => sum + r.websiteLeads, 0)
      const organicLeads = list.reduce((sum, r) => sum + r.organicLeads, 0)
      const llmLeads = list.reduce((sum, r) => sum + (r.llmLeads || 0), 0)
      const enrolled = list.reduce((sum, r) => sum + r.enrolled, 0)
      const highPotential = list.reduce((sum, r) => sum + r.highPotential, 0)
      const convRate = totalLeads > 0 ? (enrolled / totalLeads) * 100 : 0

      return {
        year,
        quarter,
        totalLeads,
        websiteLeads,
        organicLeads,
        llmLeads,
        enrolled,
        highPotential,
        convRate
      }
    })

    // Sort chronologically (newest first for tables)
    return result.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.quarter.localeCompare(a.quarter)
    })
  }, [rows])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-sm">📊 Quarterly Leads Performance</h3>
        <p className="text-xs text-slate-400 mt-0.5">Aggregated metrics grouped into calendar quarters</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-900 text-slate-200 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
              <th className="px-6 py-3.5">Year</th>
              <th className="px-4 py-3.5">Quarter</th>
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
            {quarterlyData.map((q, idx) => (
              <tr key={`${q.year}-${q.quarter}`} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{q.year}</td>
                <td className="px-4 py-4 font-bold text-slate-700">{q.quarter}</td>
                <td className="px-4 py-4 text-right font-mono font-bold text-slate-900">{q.totalLeads.toLocaleString()}</td>
                <td className="px-4 py-4 text-right font-mono text-slate-500">{q.websiteLeads.toLocaleString()}</td>
                <td className="px-4 py-4 text-right font-mono text-slate-500">{q.organicLeads.toLocaleString()}</td>
                <td className="px-4 py-4 text-right font-mono text-pink-600 font-bold">{q.llmLeads.toLocaleString()}</td>
                <td className="px-4 py-4 text-right font-mono text-emerald-600 font-bold">{q.enrolled.toLocaleString()}</td>
                <td className="px-4 py-4 text-right font-mono text-blue-600 font-semibold">{q.highPotential.toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                  {q.convRate.toFixed(1)}%
                </td>
              </tr>
            ))}
            {quarterlyData.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400 font-medium">No leads data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
