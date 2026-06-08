// components/analytics/GA4Components.tsx
import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import {
  TrendingUp, TrendingDown, Users, Monitor, MapPin, Activity, HelpCircle,
  FileText, Smartphone, Laptop, Tablet, Hourglass, Percent
} from 'lucide-react'
import { GA4Overview, GA4TrafficSource, GA4LandingPage, GA4DeviceData, GA4GeoData, GA4DailyPoint, GA4SourceLandingRow } from '@/lib/types'

// ─── KPI CARD ─────────────────────────────────────────────────────────────
interface GA4KPICardProps {
  title: string
  value: string | number
  delta?: number
  subText: string
  icon: React.ReactNode
  reverseColor?: boolean
}

export function GA4KPICard({ title, value, delta, subText, icon, reverseColor = false }: GA4KPICardProps) {
  const isPositive = delta !== undefined ? delta >= 0 : true
  const hasDelta = delta !== undefined

  // Reverse color rule for bounce rate (higher is worse)
  const successColor = reverseColor ? (isPositive ? 'text-rose-500' : 'text-emerald-500') : (isPositive ? 'text-emerald-500' : 'text-rose-500')
  const SuccessIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">{icon}</div>
      </div>
      <div>
        <h3 className="text-3xl font-extrabold text-slate-800">{value}</h3>
        <div className="flex items-center gap-1.5 mt-2">
          {hasDelta && (
            <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${successColor}`}>
              <SuccessIcon className="w-3.5 h-3.5" />
              {Math.abs(delta)}%
            </span>
          )}
          <span className="text-xs text-slate-400 font-medium">{subText}</span>
        </div>
      </div>
    </div>
  )
}

// ─── TREND CHART ──────────────────────────────────────────────────────────
interface GA4TrendChartProps {
  trendData: GA4DailyPoint[]
}

export function GA4TrendChart({ trendData }: GA4TrendChartProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="mb-4">
        <h4 className="text-base font-bold text-slate-800">Traffic & Conversion Daily Trend</h4>
        <p className="text-xs text-slate-400">Daily sessions, active users, and goal conversions tracked in real-time</p>
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="sessions" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSessions)" name="Sessions" strokeWidth={2} />
            <Area type="monotone" dataKey="conversions" stroke="#f97316" fillOpacity={1} fill="url(#colorConversions)" name="Conversions (Forms)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── TRAFFIC SOURCE TABLE ──────────────────────────────────────────────────
interface TrafficSourceTableProps {
  sources: GA4TrafficSource[]
}

export function TrafficSourceTable({ sources }: TrafficSourceTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h4 className="text-base font-bold text-slate-800">Traffic Source Breakdown</h4>
        <p className="text-xs text-slate-400">Default acquisition channel groups and referrer sources</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
              <th className="py-3 px-5">Channel Group</th>
              <th className="py-3 px-5">Source / Medium</th>
              <th className="py-3 px-5 text-center">Sessions</th>
              <th className="py-3 px-5 text-center">Users</th>
              <th className="py-3 px-5 text-center">Bounce Rate</th>
              <th className="py-3 px-5 text-center">Avg Session</th>
              <th className="py-3 px-5 text-center">Conversions</th>
              <th className="py-3 px-5 text-center">Conv. Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {sources.map((s, idx) => (
              <tr key={`${s.source}-${idx}`} className="hover:bg-slate-50/50">
                <td className="py-3.5 px-5">
                  <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold">{s.channelGroup}</span>
                </td>
                <td className="py-3.5 px-5 text-slate-500 font-normal">{s.source} / {s.medium}</td>
                <td className="py-3.5 px-5 text-center">{s.sessions.toLocaleString()}</td>
                <td className="py-3.5 px-5 text-center">{s.users.toLocaleString()}</td>
                <td className="py-3.5 px-5 text-center text-slate-500">{s.bounceRate}%</td>
                <td className="py-3.5 px-5 text-center text-slate-500">{Math.floor(s.avgSessionDuration / 60)}:{(s.avgSessionDuration % 60).toString().padStart(2, '0')}</td>
                <td className="py-3.5 px-5 text-center font-bold text-slate-800">{s.conversions}</td>
                <td className="py-3.5 px-5 text-center">
                  <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">{s.conversionRate}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── LANDING PAGE TABLE ────────────────────────────────────────────────────
interface LandingPageTableProps {
  pages: GA4LandingPage[]
}

export function LandingPageTable({ pages }: LandingPageTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h4 className="text-base font-bold text-slate-800">Landing Page Performance</h4>
        <p className="text-xs text-slate-400">Visitor entry page paths sorted by conversions</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
              <th className="py-3.5 px-6">Page Path</th>
              <th className="py-3.5 px-6 text-center">Sessions</th>
              <th className="py-3.5 px-6 text-center">Users</th>
              <th className="py-3.5 px-6 text-center">Bounce Rate</th>
              <th className="py-3.5 px-6 text-center">Avg Time</th>
              <th className="py-3.5 px-6 text-center">Conversions</th>
              <th className="py-3.5 px-6 text-center">Conv. Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {pages.map((p) => (
              <tr key={p.pagePath} className="hover:bg-slate-50/50">
                <td className="py-4 px-6">
                  <p className="font-bold text-slate-800 truncate max-w-[280px]" title={p.pageTitle}>{p.pagePath}</p>
                  <p className="text-[10px] text-slate-400 font-normal truncate max-w-[280px] mt-0.5">{p.pageTitle}</p>
                </td>
                <td className="py-4 px-6 text-center">{p.sessions.toLocaleString()}</td>
                <td className="py-4 px-6 text-center">{p.users.toLocaleString()}</td>
                <td className="py-4 px-6 text-center text-slate-500">{p.bounceRate}%</td>
                <td className="py-4 px-6 text-center text-slate-500">{Math.floor(p.avgSessionDuration / 60)}:{(p.avgSessionDuration % 60).toString().padStart(2, '0')}</td>
                <td className="py-4 px-6 text-center font-bold text-slate-800">{p.conversions}</td>
                <td className="py-4 px-6 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full font-bold ${
                    p.conversionRate >= 6 ? 'bg-emerald-50 text-emerald-700' :
                    p.conversionRate >= 4 ? 'bg-blue-50 text-blue-700' :
                    'bg-slate-50 text-slate-500'
                  }`}>{p.conversionRate}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── DEVICE DONUT CHART ────────────────────────────────────────────────────
interface DeviceDonutChartProps {
  devices: GA4DeviceData[]
}

export function DeviceDonutChart({ devices }: DeviceDonutChartProps) {
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b']
  const iconMap: Record<string, React.ReactNode> = {
    desktop: <Laptop className="w-4 h-4 text-blue-500" />,
    mobile: <Smartphone className="w-4 h-4 text-emerald-500" />,
    tablet: <Tablet className="w-4 h-4 text-amber-500" />
  }

  const pieData = devices.map(d => ({
    name: d.device.toUpperCase(),
    value: d.sessions
  }))

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <h4 className="text-base font-bold text-slate-800">Sessions by Device</h4>
        <p className="text-xs text-slate-400">Desktop vs mobile and tablet visitor share</p>
      </div>
      <div className="h-[180px] flex items-center justify-center relative my-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-extrabold text-slate-800">
            {devices.reduce((sum, d) => sum + d.sessions, 0).toLocaleString()}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Sessions</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {devices.map((d, idx) => (
          <div key={d.device} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx] }} />
              {iconMap[d.device] || <Monitor className="w-4 h-4 text-slate-400" />}
              <span className="text-slate-600 font-medium capitalize">{d.device}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-semibold">{d.sessions.toLocaleString()} sessions</span>
              <span className="text-slate-800 font-bold">{d.conversionRate}% CR</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── GEO TABLE ─────────────────────────────────────────────────────────────
interface GeoTableProps {
  geo: GA4GeoData[]
}

export function GeoTable({ geo }: GeoTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
      <div className="p-5 border-b border-slate-100">
        <h4 className="text-base font-bold text-slate-800">Top Geographic Locations</h4>
        <p className="text-xs text-slate-400">Top cities and states sending student traffic</p>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
              <th className="py-2.5 px-4"><MapPin className="w-3.5 h-3.5 inline mr-1" /> Location</th>
              <th className="py-2.5 px-4 text-center">Sessions</th>
              <th className="py-2.5 px-4 text-center">Conversions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
            {geo.slice(0, 7).map((g, idx) => (
              <tr key={`${g.city}-${idx}`} className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-bold text-slate-800">{g.city}, <span className="text-slate-400 font-normal">{g.region}</span></td>
                <td className="py-3 px-4 text-center">{g.sessions.toLocaleString()}</td>
                <td className="py-3 px-4 text-center text-slate-800 font-bold">{g.conversions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── SOURCE LANDING HEATMAP ─────────────────────────────────────────────────
interface SourceLandingHeatmapProps {
  matrix: GA4SourceLandingRow[]
}

export function SourceLandingHeatmap({ matrix }: SourceLandingHeatmapProps) {
  const sources = Array.from(new Set(matrix.map(m => m.channelGroup)))
  const pages = Array.from(new Set(matrix.map(m => m.landingPage)))

  const getCellData = (source: string, page: string) => {
    return matrix.find(m => m.channelGroup === source && m.landingPage === page)
  }

  const getHeatmapColor = (cr: number) => {
    if (cr === 0) return 'bg-slate-50 text-slate-400'
    if (cr < 3) return 'bg-emerald-50 text-emerald-700'
    if (cr < 6) return 'bg-emerald-100 text-emerald-800'
    if (cr < 9) return 'bg-emerald-200 text-emerald-950 font-bold'
    return 'bg-emerald-300 text-emerald-950 font-extrabold'
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="mb-4">
        <h4 className="text-base font-bold text-slate-800">Traffic Source × Landing Page Matrix</h4>
        <p className="text-xs text-slate-400">Conversion rates by acquisition source and matching landing page destination</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border border-slate-200 text-xs font-semibold text-center border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-400 font-bold">
              <th className="py-3 px-4 text-left border-r border-slate-200">Acquisition Group</th>
              {pages.map(page => (
                <th key={page} className="py-3 px-3 border-r border-slate-200 max-w-[120px] truncate" title={page}>{page}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {sources.map(src => (
              <tr key={src}>
                <td className="py-3 px-4 text-left font-bold bg-slate-50/50 border-r border-slate-200">{src}</td>
                {pages.map(page => {
                  const cell = getCellData(src, page)
                  const cr = cell?.conversionRate || 0
                  return (
                    <td key={page} className={`py-3 px-3 border-r border-slate-200 transition-colors ${getCellColor(cr)}`} title={`${cell?.conversions || 0} conversions / ${cell?.sessions || 0} sessions`}>
                      {cell ? `${cr.toFixed(1)}%` : '—'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  function getCellColor(cr: number) {
    if (cr <= 0) return 'bg-slate-50/30 text-slate-400'
    if (cr < 2.5) return 'bg-indigo-50/30 text-indigo-600'
    if (cr < 5.0) return 'bg-indigo-50 text-indigo-700'
    if (cr < 7.5) return 'bg-indigo-100 text-indigo-900 font-bold'
    return 'bg-indigo-200 text-indigo-950 font-extrabold'
  }
}

// ─── WEBSITE FUNNEL VISUALIZATION ───────────────────────────────────────────
interface WebsiteFunnelVizProps {
  sessions: number
  courseViews: number
  demoViews: number
  formCompletes: number
}

export function WebsiteFunnelViz({ sessions, courseViews, demoViews, formCompletes }: WebsiteFunnelVizProps) {
  const steps = [
    { name: '1. Sessions (Homepage)', value: sessions, pct: 100, desc: 'Initial visitor landing page entry' },
    { name: '2. Course Page Views', value: courseViews, pct: sessions > 0 ? (courseViews / sessions) * 100 : 0, desc: 'Explored curriculum and fees modules' },
    { name: '3. Contact/Demo Page Visits', value: demoViews, pct: courseViews > 0 ? (demoViews / courseViews) * 100 : 0, desc: 'Navigated to booking registration panel' },
    { name: '4. Form Submitted (Goal)', value: formCompletes, pct: demoViews > 0 ? (formCompletes / demoViews) * 100 : 0, desc: 'Completed online request submission' }
  ]

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="mb-6">
        <h4 className="text-base font-bold text-slate-800">GA4 Path-to-Conversion Funnel</h4>
        <p className="text-xs text-slate-400">Step-by-step visitor progression and bounce leakage rate across website pages</p>
      </div>
      <div className="space-y-5">
        {steps.map((step, idx) => {
          const barWidth = Math.max(8, step.pct)
          const dropRate = idx > 0 && steps[idx - 1].value > 0 ? ((steps[idx - 1].value - step.value) / steps[idx - 1].value) * 100 : 0

          return (
            <div key={step.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>{step.name}</span>
                <div className="flex gap-3">
                  <span className="text-slate-400 font-medium">{step.value.toLocaleString()} visits</span>
                  <span className="text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded">{step.pct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-50 h-5 rounded-lg overflow-hidden border border-slate-100 flex">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-r-md transition-all duration-500" style={{ width: `${barWidth}%` }} />
              </div>
              {idx > 0 && (
                <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1 pl-2">
                  <span>⚠️ Drop-off leak: {dropRate.toFixed(1)}% did not proceed</span>
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
