// components/leads/LeadsChannelTable.tsx
import React from 'react'
import { LeadsChannelSplit } from '@/lib/types'

interface LeadsChannelTableProps {
  split: LeadsChannelSplit[]
}

export default function LeadsChannelTable({ split }: LeadsChannelTableProps) {
  const totalLeads = split.reduce((acc, s) => acc + s.leads, 0)
  const totalEnrolled = split.reduce((acc, s) => acc + s.enrolled, 0)
  const totalHighPotential = split.reduce((acc, s) => acc + s.highPotential, 0)
  const totalConvRate = totalLeads > 0 ? (totalEnrolled / totalLeads) * 100 : 0

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col justify-between">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-sm">🌐 Acquisition Channels</h3>
        <p className="text-xs text-slate-400 mt-0.5">Leads volume and quality splits by website and organic chatbot referrals</p>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-900 text-slate-200 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
              <th className="px-5 py-3">Channel</th>
              <th className="px-4 py-3 text-right">Leads</th>
              <th className="px-4 py-3 text-right">Share</th>
              <th className="px-4 py-3 text-right">Enrolled</th>
              <th className="px-4 py-3 text-right font-medium">High Pot</th>
              <th className="px-5 py-3 text-right">Conv %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {split.map(s => {
              const getChannelIcon = (ch: string) => {
                if (ch.includes('Website')) return '🌐'
                if (ch === 'LLM') return '🤖'
                return '🔍'
              }
              return (
                <tr key={s.channel} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-700 flex items-center gap-2">
                    <span>{getChannelIcon(s.channel)}</span>
                    <span>{s.channel}</span>
                  </td>
                <td className="px-4 py-3.5 text-right font-mono text-slate-900">{s.leads.toLocaleString()}</td>
                <td className="px-4 py-3.5 text-right font-semibold text-slate-600">{s.sharePercent.toFixed(1)}%</td>
                <td className="px-4 py-3.5 text-right text-emerald-600 font-bold">{s.enrolled.toLocaleString()}</td>
                <td className="px-4 py-3.5 text-right text-blue-600 font-semibold">{s.highPotential.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-right font-bold text-slate-800">{s.convRate.toFixed(1)}%</td>
              </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
              <td className="px-5 py-3.5 uppercase tracking-wider text-xs">TOTAL</td>
              <td className="px-4 py-3.5 text-right font-mono">{totalLeads.toLocaleString()}</td>
              <td className="px-4 py-3.5 text-right">100%</td>
              <td className="px-4 py-3.5 text-right text-emerald-700">{totalEnrolled.toLocaleString()}</td>
              <td className="px-4 py-3.5 text-right text-blue-700">{totalHighPotential.toLocaleString()}</td>
              <td className="px-5 py-3.5 text-right text-violet-750 font-extrabold">{totalConvRate.toFixed(1)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
