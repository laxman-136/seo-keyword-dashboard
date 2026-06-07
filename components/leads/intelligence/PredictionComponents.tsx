// components/leads/intelligence/PredictionComponents.tsx
import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { Target, Zap, TrendingUp, Star, Info } from 'lucide-react'

interface LeadScoreCardsProps {
  highCount: number
  mediumCount: number
  lowCount: number
  veryLowCount: number
  totalScored: number
}

export function LeadScoreCards({ highCount, mediumCount, lowCount, veryLowCount, totalScored }: LeadScoreCardsProps) {
  const pct = (n: number) => totalScored > 0 ? ((n / totalScored) * 100).toFixed(1) : '0'
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">🔥 High Priority</span>
          <Zap className="w-5 h-5 text-emerald-500" />
        </div>
        <h3 className="text-3xl font-extrabold text-emerald-700">{highCount.toLocaleString()}</h3>
        <p className="text-xs text-emerald-400 mt-1">{pct(highCount)}% of scored leads · Score 80–100</p>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-blue-100 bg-blue-50/20 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">⚡ Medium Priority</span>
          <TrendingUp className="w-5 h-5 text-blue-500" />
        </div>
        <h3 className="text-3xl font-extrabold text-blue-700">{mediumCount.toLocaleString()}</h3>
        <p className="text-xs text-blue-400 mt-1">{pct(mediumCount)}% of scored leads · Score 50–79</p>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-yellow-100 bg-yellow-50/20 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">🟡 Low Priority</span>
          <Target className="w-5 h-5 text-yellow-500" />
        </div>
        <h3 className="text-3xl font-extrabold text-yellow-700">{lowCount.toLocaleString()}</h3>
        <p className="text-xs text-yellow-400 mt-1">{pct(lowCount)}% of scored leads · Score 20–49</p>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-slate-100 bg-slate-50/20 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">⚫ Very Low</span>
          <Info className="w-5 h-5 text-slate-400" />
        </div>
        <h3 className="text-3xl font-extrabold text-slate-600">{veryLowCount.toLocaleString()}</h3>
        <p className="text-xs text-slate-400 mt-1">{pct(veryLowCount)}% of scored leads · Score 0–19</p>
      </div>
    </div>
  )
}

interface ScoreDistributionChartProps {
  bins: Array<{ label: string; count: number }>
}

export function ScoreDistributionChart({ bins }: ScoreDistributionChartProps) {
  const COLORS = bins.map((_, i) => {
    const ratio = i / bins.length
    if (ratio < 0.3) return '#ef4444'
    if (ratio < 0.6) return '#f59e0b'
    if (ratio < 0.8) return '#3b82f6'
    return '#10b981'
  })

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="mb-4">
        <h4 className="text-base font-bold text-slate-800">Priority Score Distribution</h4>
        <p className="text-xs text-slate-400">Histogram of conversion probability scores across the current lead pipeline</p>
      </div>
      <div className="min-h-[280px]">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={bins} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
            <Bar dataKey="count" name="Leads" radius={[4,4,0,0]}>
              {bins.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface HighProbLead {
  leadId: string
  name: string
  course: string
  score: number
  category: string
  status: string
  ageInDays: number
  topFactor: string
}

interface HighProbLeadsTableProps {
  leads: HighProbLead[]
}

export function HighProbLeadsTable({ leads }: HighProbLeadsTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h4 className="text-base font-bold text-slate-800">High Priority Leads — Close-Ready Pipeline</h4>
        <p className="text-xs text-slate-400">Leads with highest predicted conversion probability. Prioritise calling these first.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
              <th className="py-3 px-5">Lead</th>
              <th className="py-3 px-5">Course</th>
              <th className="py-3 px-5 text-center">Score</th>
              <th className="py-3 px-5">Current Status</th>
              <th className="py-3 px-5 text-center">Age</th>
              <th className="py-3 px-5">Top Scoring Factor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {leads.slice(0, 20).map(l => (
              <tr key={l.leadId} className="hover:bg-slate-50/50">
                <td className="py-3.5 px-5">
                  <p className="font-bold text-slate-800">{l.name || 'Unknown'}</p>
                </td>
                <td className="py-3.5 px-5 text-slate-500 max-w-[140px] truncate">{l.course || '—'}</td>
                <td className="py-3.5 px-5 text-center">
                  <span className={`inline-flex px-2.5 py-1 rounded-full font-extrabold text-xs ${
                    l.score >= 80 ? 'bg-emerald-50 text-emerald-700' :
                    l.score >= 50 ? 'bg-blue-50 text-blue-700' :
                    'bg-yellow-50 text-yellow-700'
                  }`}>{l.score}</span>
                </td>
                <td className="py-3.5 px-5">
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{l.status || 'Fresh'}</span>
                </td>
                <td className="py-3.5 px-5 text-center text-slate-400">{Math.round(l.ageInDays)}d</td>
                <td className="py-3.5 px-5 text-slate-500 text-[11px] max-w-[160px] truncate">{l.topFactor}</td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">No scored leads available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface ScoringFactorChartProps {}

export function ScoringFactorChart({}: ScoringFactorChartProps) {
  const factors = [
    { factor: 'Demo Attended', impact: 25, type: 'positive' },
    { factor: 'Lead Disinterest', impact: -40, type: 'negative' },
    { factor: 'Potential Lead 100', impact: 20, type: 'positive' },
    { factor: 'Demo Interest', impact: 18, type: 'positive' },
    { factor: 'Referral Source', impact: 20, type: 'positive' },
    { factor: 'Fresh (<3 days)', impact: 15, type: 'positive' },
    { factor: 'Junk Classification', impact: -50, type: 'negative' },
    { factor: 'Course Demand (High)', impact: 15, type: 'positive' },
    { factor: 'Wrong Number', impact: -45, type: 'negative' },
    { factor: 'Google Ads Source', impact: 10, type: 'positive' },
    { factor: 'Fee Discussed', impact: 10, type: 'positive' },
    { factor: 'Email Provided', impact: 5, type: 'positive' },
    { factor: 'Lead Age >90d', impact: -15, type: 'negative' },
  ]
  const sorted = [...factors].sort((a, b) => b.impact - a.impact)

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="mb-4">
        <h4 className="text-base font-bold text-slate-800">Scoring Factor Reference</h4>
        <p className="text-xs text-slate-400">How each signal contributes to or reduces a lead's conversion probability score</p>
      </div>
      <div className="min-h-[320px]">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 30, left: 130, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#f1f5f9" />
            <XAxis type="number" stroke="#94a3b8" fontSize={11} domain={[-60, 30]} />
            <YAxis dataKey="factor" type="category" stroke="#94a3b8" fontSize={10} width={120} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              formatter={(v: any) => [`${v > 0 ? '+' : ''}${v} pts`, 'Score Impact']}
            />
            <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
              {sorted.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.impact > 0 ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
