// components/leads/LeadsMonthComparison.tsx
import React from 'react'
import { LeadsMonthlyRow } from '@/lib/types'
import { getLeadsMonthComparison } from '@/lib/sheets'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeadsMonthComparisonProps {
  rows: LeadsMonthlyRow[]
  monthA: string
  monthB: string
}

export default function LeadsMonthComparison({ rows, monthA, monthB }: LeadsMonthComparisonProps) {
  const { a, b, deltas } = getLeadsMonthComparison(rows, monthA, monthB)

  const metrics = [
    { label: '📋 Total Leads', valA: a.totalLeads, valB: b.totalLeads, delta: deltas.totalLeads, key: 'totalLeads' },
    { label: '🌐 Website Leads', valA: a.websiteLeads, valB: b.websiteLeads, delta: deltas.websiteLeads, key: 'websiteLeads' },
    { label: '🔍 Organic Leads', valA: a.organicLeads, valB: b.organicLeads, delta: deltas.organicLeads, key: 'organicLeads' },
    { label: '📦 Oracle Fusion SCM Leads', valA: a.scmLeads, valB: b.scmLeads, delta: deltas.scmLeads, key: 'scmLeads' },
    { label: '💜 Oracle Fusion HCM Leads', valA: a.hcmLeads, valB: b.hcmLeads, delta: deltas.hcmLeads, key: 'hcmLeads' },
    { label: '💚 Oracle Fusion Financials Leads', valA: a.financialsLeads, valB: b.financialsLeads, delta: deltas.financialsLeads, key: 'financialsLeads' },
    { label: '🧡 Oracle Fusion Tech + OIC Leads', valA: a.techOicLeads, valB: b.techOicLeads, delta: deltas.techOicLeads, key: 'techOicLeads' },
    { label: '💙 Oracle Fusion PPM Leads', valA: a.ppmLeads, valB: b.ppmLeads, delta: deltas.ppmLeads, key: 'ppmLeads' },
    { label: '⚙️ SAP / EBS / Others Leads', valA: a.sapEbsOthersLeads, valB: b.sapEbsOthersLeads, delta: deltas.sapEbsOthersLeads, key: 'sapEbsOthersLeads' },
    { label: '🏆 Enrolled', valA: a.enrolled, valB: b.enrolled, delta: deltas.enrolled, key: 'enrolled', highlight: 'text-emerald-600 font-bold' },
    { label: '🔥 High Potential', valA: a.highPotential, valB: b.highPotential, delta: deltas.highPotential, key: 'highPotential', highlight: 'text-blue-600 font-bold' },
    { label: '⚡ Medium Potential', valA: a.mediumPotential, valB: b.mediumPotential, delta: deltas.mediumPotential, key: 'mediumPotential' },
    { label: '❄️ Fresh/Unqualified', valA: a.freshUnqualified, valB: b.freshUnqualified, delta: deltas.freshUnqualified, key: 'freshUnqualified' },
    { label: '🗑️ Low/Cold', valA: a.lowCold, valB: b.lowCold, delta: deltas.lowCold, key: 'lowCold' },
    { label: '📈 Conversion Rate (%)', valA: a.convRate, valB: b.convRate, delta: deltas.convRate, key: 'convRate', isPercent: true }
  ]

  const formatVal = (v: number, isPercent = false) => isPercent ? `${v.toFixed(1)}%` : v.toLocaleString()
  const formatDelta = (d: number, isPercent = false) => {
    if (isPercent) {
      const prefix = d > 0 ? '+' : ''
      return `${prefix}${d.toFixed(1)}pp`
    }
    return d > 0 ? `+${d}` : `${d}`
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-sm">📅 Period Comparison</h3>
        <p className="text-xs text-slate-400 mt-0.5">Side-by-side performance audit between selected months</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-900 text-slate-200 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
              <th className="px-6 py-3.5">Metric</th>
              <th className="px-4 py-3.5 text-right">{monthA}</th>
              <th className="px-4 py-3.5 text-right">{monthB}</th>
              <th className="px-4 py-3.5 text-right">Δ Absolute</th>
              <th className="px-6 py-3.5 text-right">Δ % Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {metrics.map(m => {
              const delta = m.delta
              const isPositive = delta > 0
              const isNegative = delta < 0
              
              // Calculate percentage change defensively
              let pctChange = ''
              if (m.isPercent) {
                pctChange = '-'
              } else if (m.valB === 0) {
                pctChange = m.valA > 0 ? 'New' : '0%'
              } else {
                const computed = ((m.valA - m.valB) / m.valB) * 100
                pctChange = computed > 0 ? `+${computed.toFixed(1)}%` : `${computed.toFixed(1)}%`
              }

              // Color indicators
              const badgeClass = isPositive 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                : isNegative 
                  ? 'bg-red-50 text-red-800 border-red-100' 
                  : 'bg-slate-50 text-slate-500 border-slate-100'

              return (
                <tr key={m.key} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-700">{m.label}</td>
                  <td className={cn("px-4 py-4 text-right font-mono font-bold text-slate-800", m.highlight)}>
                    {formatVal(m.valA, m.isPercent)}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-slate-500">
                    {formatVal(m.valB, m.isPercent)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={cn("px-2 py-0.5 rounded-lg text-xs font-bold border inline-flex items-center gap-0.5", badgeClass)}>
                      {isPositive && <ArrowUpRight className="w-3 h-3 text-emerald-600" />}
                      {isNegative && <ArrowDownRight className="w-3 h-3 text-red-600" />}
                      {!isPositive && !isNegative && <Minus className="w-3 h-3 text-slate-400" />}
                      {formatDelta(delta, m.isPercent)}
                    </span>
                  </td>
                  <td className={cn("px-6 py-4 text-right font-mono font-bold", 
                    isPositive && !m.isPercent ? 'text-emerald-600' : 
                    isNegative && !m.isPercent ? 'text-red-500' : 'text-slate-500'
                  )}>
                    {pctChange}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
