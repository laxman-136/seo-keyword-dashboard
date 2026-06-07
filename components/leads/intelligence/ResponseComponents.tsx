// components/leads/intelligence/ResponseComponents.tsx
import React from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis
} from 'recharts'
import { Clock, ShieldAlert, Award, AlertTriangle, Zap, CheckCircle2, TrendingUp, Users } from 'lucide-react'

interface ResponseTimeCardsProps {
  avgResponseText: string
  pctUnder1Hour: number
  pctOver24Hour: number
  neverContactedCount: number
}

export function ResponseTimeCards({ 
  avgResponseText, pctUnder1Hour, pctOver24Hour, neverContactedCount 
}: ResponseTimeCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Avg Response Time */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Response Time</span>
          <Clock className="w-5 h-5 text-indigo-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-3xl font-extrabold text-slate-800">{avgResponseText}</h3>
          <p className="text-xs text-slate-400 font-medium">Speed to dial new leads</p>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>8% faster than last month</span>
        </div>
      </div>

      {/* Contacted < 1h % */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contacted &lt; 1 Hour</span>
          <Zap className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-3xl font-extrabold text-slate-800">{pctUnder1Hour.toFixed(1)}%</h3>
          <p className="text-xs text-slate-400 font-medium">Golden hour contact rate</p>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <span>Target: &gt; 50%</span>
        </div>
      </div>

      {/* Contacted > 24h % */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Delayed &gt; 24 Hours</span>
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-3xl font-extrabold text-slate-800">{pctOver24Hour.toFixed(1)}%</h3>
          <p className="text-xs text-slate-400 font-medium">Leads cold before call</p>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-red-500">
          <span>High risk of drop-off</span>
        </div>
      </div>

      {/* Never Contacted */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Never Contacted</span>
          <ShieldAlert className="w-5 h-5 text-red-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-3xl font-extrabold text-slate-800">{neverContactedCount.toLocaleString()}</h3>
          <p className="text-xs text-slate-400 font-medium">Leads untouched in CRM</p>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-red-600">
          <span>Requires urgent dialing</span>
        </div>
      </div>
    </div>
  )
}

interface ResponseDistributionChartProps {
  distribution: Array<{ name: string; percentage: number; count: number; color: string }>
}

export function ResponseDistributionChart({ distribution }: ResponseDistributionChartProps) {
  const chartData = distribution.map(d => ({
    name: d.name,
    'Percentage (%)': d.percentage,
    count: d.count
  }))

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
      <div className="mb-6">
        <h4 className="text-base font-bold text-slate-800">First Contact Delay Distribution</h4>
        <p className="text-xs text-slate-400">Timelines of how long new leads wait in queue before their first dial/contact attempt</p>
      </div>
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#f1f5f9" />
            <XAxis type="number" stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" />
            <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              formatter={(value: any, name: any, props: any) => [`${value}% (${props.payload.count} leads)`, 'Proportion']}
            />
            <Bar dataKey="Percentage (%)" fill="#6366f1" radius={[0, 4, 4, 0]}>
              {distribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Cell helper for color mapping
import { Cell } from 'recharts'

interface NeverContactedAlertProps {
  neverCount: number
  avgFee: number
  convRate: number
}

export function NeverContactedAlert({ neverCount, avgFee, convRate }: NeverContactedAlertProps) {
  const revenueLossLakhs = ((neverCount * (convRate / 100)) * avgFee) / 100000

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shrink-0 shadow-sm border border-red-200/50">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-red-900">Attention Required: Untouched Leads in Queue</h4>
          <p className="text-xs text-red-600 leading-relaxed max-w-[700px]">
            There are <strong>{neverCount} leads</strong> that have never been contacted by any agent. 
            At our average enrollment rate of {convRate.toFixed(1)}% and fees, this represents approximately 
            <strong> ₹{revenueLossLakhs.toFixed(1)} L</strong> in leakage/unrealized pipeline revenue.
          </p>
        </div>
      </div>
      <button 
        onClick={() => {
          alert('Lead list filtered. Dispatching dialer priority flows.')
        }}
        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 sm:w-auto text-center"
      >
        Distribute to Dialer Now →
      </button>
    </div>
  )
}

interface ResponseBySourceTableProps {
  sources: Array<{
    source: string
    totalLeads: number
    avgResponseHours: number
    pctUnder1Hour: number
    perfRating: string
  }>
}

export function ResponseBySourceTable({ sources }: ResponseBySourceTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
      <div className="p-6 border-b border-slate-100">
        <h4 className="text-base font-bold text-slate-800">Response Speed by Source Channel</h4>
        <p className="text-xs text-slate-400">Evaluating which marketing channels receive the fastest calling attempts</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
              <th className="py-3 px-6">Channel</th>
              <th className="py-3 px-6 text-center">Total</th>
              <th className="py-3 px-6 text-center">Avg Response</th>
              <th className="py-3 px-6 text-center">Dialed &lt; 1hr</th>
              <th className="py-3 px-6 text-center">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
            {sources.map((s) => (
              <tr key={s.source} className="hover:bg-slate-50/50">
                <td className="py-3 px-6 font-bold text-slate-800">{s.source}</td>
                <td className="py-3 px-6 text-center">{s.totalLeads}</td>
                <td className="py-3 px-6 text-center text-slate-700">{s.avgResponseHours.toFixed(1)} hrs</td>
                <td className="py-3 px-6 text-center text-indigo-600">{s.pctUnder1Hour.toFixed(0)}%</td>
                <td className="py-3 px-6 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold ${
                    s.perfRating === 'Excellent' ? 'bg-emerald-50 text-emerald-600' :
                    s.perfRating === 'Good' ? 'bg-blue-50 text-blue-600' :
                    s.perfRating === 'Fair' ? 'bg-yellow-50 text-yellow-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {s.perfRating}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface ResponseByAgentTableProps {
  agents: Array<{
    agent: string
    totalAssigned: number
    avgResponseHours: number
    pctUnder1Hour: number
    contactRate: number
  }>
}

export function ResponseByAgentTable({ agents }: ResponseByAgentTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
      <div className="p-6 border-b border-slate-100">
        <h4 className="text-base font-bold text-slate-800">Agent Calling Performance</h4>
        <p className="text-xs text-slate-400">Response speed and successful contact rates per active advisor</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
              <th className="py-3 px-6">Agent</th>
              <th className="py-3 px-6 text-center">Assigned</th>
              <th className="py-3 px-6 text-center">Avg Response</th>
              <th className="py-3 px-6 text-center">Dialed &lt; 1hr</th>
              <th className="py-3 px-6 text-center">Contact Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
            {agents.map((a) => (
              <tr key={a.agent} className="hover:bg-slate-50/50">
                <td className="py-3 px-6 font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[120px]">{a.agent.split('@')[0]}</span>
                </td>
                <td className="py-3 px-6 text-center">{a.totalAssigned}</td>
                <td className="py-3 px-6 text-center text-slate-700">{a.avgResponseHours.toFixed(1)} hrs</td>
                <td className="py-3 px-6 text-center text-indigo-600">{a.pctUnder1Hour.toFixed(0)}%</td>
                <td className="py-3 px-6 text-center text-emerald-600">{a.contactRate.toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface ResponseVsConversionChartProps {
  scatterData: Array<{ responseTimeBucket: string; avgResponseHours: number; conversionRate: number; label: string }>
}

export function ResponseVsConversionChart({ scatterData }: ResponseVsConversionChartProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
      <div className="mb-4">
        <h4 className="text-base font-bold text-slate-800">Response Speed vs Conversion Rate</h4>
        <p className="text-xs text-slate-400">Visual correlation between calling response delay and final student enrollment conversions</p>
      </div>
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              type="number" 
              dataKey="avgResponseHours" 
              name="Response Delay" 
              unit=" hrs" 
              stroke="#94a3b8" 
              fontSize={11} 
              label={{ value: 'Avg Response Delay (Hours)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
            />
            <YAxis 
              type="number" 
              dataKey="conversionRate" 
              name="Conversion Rate" 
              unit="%" 
              stroke="#94a3b8" 
              fontSize={11}
              label={{ value: 'Student Conversion Rate (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
            />
            <ZAxis type="category" dataKey="label" name="Bucket" />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              formatter={(value: any, name: any, props: any) => {
                if (name === 'Conversion Rate') return [`${value}%`, name]
                if (name === 'Response Delay') return [`${value} hours`, name]
                return [value, name]
              }}
            />
            <Scatter name="Response Performance" data={scatterData} fill="#f59e0b">
              {scatterData.map((entry, index) => {
                let color = '#ef4444' // red
                if (entry.avgResponseHours < 1) color = '#10b981' // green
                else if (entry.avgResponseHours < 4) color = '#3b82f6' // blue
                else if (entry.avgResponseHours < 24) color = '#f59e0b' // orange
                return <Cell key={`cell-${index}`} fill={color} r={10} />
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center justify-center gap-4 text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> &lt; 1hr</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> 1-4hr</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 4-24hr</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> &gt; 24hr</div>
      </div>
    </div>
  )
}
