// components/leads/intelligence/PipelineComponents.tsx
import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { DollarSign, TrendingUp, Target, AlertTriangle, Package } from 'lucide-react'

interface PipelineValueCardsProps {
  theoreticalValue: number
  expectedValue: number
  highPotentialValue: number
  totalLeads: number
  avgFee: number
}

export function PipelineValueCards({ theoreticalValue, expectedValue, highPotentialValue, totalLeads, avgFee }: PipelineValueCardsProps) {
  const toLakhs = (v: number) => `₹${(v / 100000).toFixed(1)}L`

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Theoretical Pipeline</span>
          <Package className="w-5 h-5 text-slate-400" />
        </div>
        <h3 className="text-3xl font-extrabold text-slate-800">{toLakhs(theoreticalValue)}</h3>
        <p className="text-xs text-slate-400 mt-1">If every lead enrolled at avg fee</p>
        <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 font-semibold">{totalLeads} leads × {toLakhs(avgFee)} avg</div>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm bg-indigo-50/20 hover:border-indigo-300 transition-all">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Expected Revenue</span>
          <DollarSign className="w-5 h-5 text-indigo-500" />
        </div>
        <h3 className="text-3xl font-extrabold text-indigo-700">{toLakhs(expectedValue)}</h3>
        <p className="text-xs text-indigo-400 mt-1">Weighted by historical conv rates</p>
        <div className="mt-4 pt-3 border-t border-indigo-100 text-xs text-indigo-500 font-bold">Realistic 30-day forecast</div>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm bg-emerald-50/20 hover:border-emerald-300 transition-all">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">High Potential Value</span>
          <TrendingUp className="w-5 h-5 text-emerald-500" />
        </div>
        <h3 className="text-3xl font-extrabold text-emerald-700">{toLakhs(highPotentialValue)}</h3>
        <p className="text-xs text-emerald-400 mt-1">From High Potential category only</p>
        <div className="mt-4 pt-3 border-t border-emerald-100 text-xs text-emerald-600 font-bold">Focus closing these first</div>
      </div>
    </div>
  )
}

interface PipelineCategory {
  category: string
  count: number
  avgFee: number
  totalValue: number
  convRate: number
  expectedValue: number
}

interface PipelineCategoryTableProps {
  categories: PipelineCategory[]
}

export function PipelineCategoryTable({ categories }: PipelineCategoryTableProps) {
  const toLakhs = (v: number) => `₹${(v / 100000).toFixed(1)}L`
  const COLORS: Record<string, string> = {
    'High Potential': '#6366f1',
    'Medium Potential': '#3b82f6',
    'Fresh/Unqualified': '#94a3b8',
    'Low/Cold': '#ef4444',
    'Enrolled': '#10b981',
  }

  const chartData = categories.map(c => ({
    name: c.category.split(' ')[0],
    Expected: Math.round(c.expectedValue / 100000),
    Theoretical: Math.round(c.totalValue / 100000),
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h4 className="text-base font-bold text-slate-800 mb-1">Pipeline Value by Stage</h4>
        <p className="text-xs text-slate-400 mb-5">Expected vs theoretical revenue potential (₹ in Lakhs)</p>
        <div className="min-h-[280px]">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} unit="L" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }} formatter={(v: any) => [`₹${v}L`, '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Theoretical" fill="#e2e8f0" radius={[4,4,0,0]} />
              <Bar dataKey="Expected" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100">
          <h4 className="text-base font-bold text-slate-800">Category Breakdown</h4>
        </div>
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Count</th>
                <th className="py-3 px-4 text-right">Conv%</th>
                <th className="py-3 px-4 text-right">Expected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {categories.map(c => (
                <tr key={c.category} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[c.category] || '#94a3b8' }} />
                    <span className="text-[11px] font-bold text-slate-700">{c.category.replace(' Potential', '').replace('Fresh/', 'Fresh/')}</span>
                  </td>
                  <td className="py-3 px-4 text-right">{c.count}</td>
                  <td className="py-3 px-4 text-right text-indigo-600">{c.convRate.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600">{toLakhs(c.expectedValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

interface RevenueForecastProps {
  expectedEnrollments: number
  expectedRevenueLakhs: number
  projectionBasis: string
}

export function RevenueForecast({ expectedEnrollments, expectedRevenueLakhs, projectionBasis }: RevenueForecastProps) {
  return (
    <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-indigo-300" />
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">30-Day Revenue Forecast</span>
          </div>
          <h3 className="text-4xl font-extrabold text-white">₹{expectedRevenueLakhs.toFixed(1)} L</h3>
          <p className="text-sm text-indigo-300 mt-2">Based on {projectionBasis}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm border border-white/10">
            <p className="text-2xl font-extrabold text-white">{expectedEnrollments}</p>
            <p className="text-[10px] text-indigo-300 font-bold mt-1 uppercase">Exp. Enrollments</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm border border-white/10">
            <p className="text-2xl font-extrabold text-white">₹{(expectedRevenueLakhs * 100000 / Math.max(expectedEnrollments, 1) / 1000).toFixed(0)}K</p>
            <p className="text-[10px] text-indigo-300 font-bold mt-1 uppercase">Avg per Student</p>
          </div>
        </div>
      </div>
    </div>
  )
}
