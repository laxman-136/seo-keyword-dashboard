// components/leads/LeadsYearComparisonTable.tsx
import React from 'react'
import { LeadsYearlyDetailRow } from '@/lib/types'
import { getLeadsYearComparison } from '@/lib/sheets'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Globe, 
  Search, 
  Clipboard, 
  Award, 
  Flame, 
  Zap, 
  Snowflake, 
  Trash2, 
  Target 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeadsYearComparisonTableProps {
  rows: LeadsYearlyDetailRow[]
  yearA: string
  yearB: string
}

export default function LeadsYearComparisonTable({ rows, yearA, yearB }: LeadsYearComparisonTableProps) {
  const { a, b, deltas } = getLeadsYearComparison(rows, yearA, yearB)

  const formatVal = (v: number, isPercent = false) => isPercent ? `${v.toFixed(1)}%` : v.toLocaleString()
  
  const formatDelta = (d: number, isPercent = false) => {
    if (isPercent) {
      const prefix = d > 0 ? '+' : ''
      return `${prefix}${d.toFixed(1)}pp`
    }
    return d > 0 ? `+${d}` : `${d}`
  }

  // Defensively calculate percentage change
  const getPctChange = (valA: number, valB: number, isPercent = false) => {
    if (isPercent) return ''
    if (valB === 0) return valA > 0 ? 'New' : '0%'
    const computed = ((valA - valB) / valB) * 100
    return computed > 0 ? `+${computed.toFixed(1)}%` : `${computed.toFixed(1)}%`
  }

  // Acquisition metrics
  const acqMetrics = [
    { 
      title: 'Total Leads', 
      icon: <Clipboard className="w-4 h-4 text-blue-500" />, 
      valA: a.totalLeads, 
      valB: b.totalLeads, 
      delta: deltas.totalLeads,
      color: 'blue' 
    },
    { 
      title: 'Website Leads', 
      icon: <Globe className="w-4 h-4 text-indigo-500" />, 
      valA: a.websiteLeads, 
      valB: b.websiteLeads, 
      delta: deltas.websiteLeads,
      color: 'indigo'
    },
    { 
      title: 'Organic Leads', 
      icon: <Search className="w-4 h-4 text-emerald-500" />, 
      valA: a.organicLeads, 
      valB: b.organicLeads, 
      delta: deltas.organicLeads,
      color: 'emerald'
    }
  ]

  // Course metrics
  const courseMetrics = [
    { label: 'Oracle Fusion SCM', valA: a.scmLeads, valB: b.scmLeads, delta: deltas.scmLeads, icon: '📦' },
    { label: 'Oracle Fusion HCM', valA: a.hcmLeads, valB: b.hcmLeads, delta: deltas.hcmLeads, icon: '💜' },
    { label: 'Oracle Fusion Financials', valA: a.financialsLeads, valB: b.financialsLeads, delta: deltas.financialsLeads, icon: '💚' },
    { label: 'Oracle Fusion Tech + OIC', valA: a.techOicLeads, valB: b.techOicLeads, delta: deltas.techOicLeads, icon: '🧡' },
    { label: 'Oracle Fusion PPM', valA: a.ppmLeads, valB: b.ppmLeads, delta: deltas.ppmLeads, icon: '💙' },
    { label: 'SAP / EBS / Others', valA: a.sapEbsOthersLeads, valB: b.sapEbsOthersLeads, delta: deltas.sapEbsOthersLeads, icon: '⚙️' },
  ]

  // Funnel / Quality metrics
  const funnelMetrics = [
    { label: 'Enrolled', valA: a.enrolled, valB: b.enrolled, delta: deltas.enrolled, icon: <Award className="w-4 h-4" />, colorClass: 'bg-emerald-500 text-emerald-700', textColor: 'text-emerald-700', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-100' },
    { label: 'High Potential', valA: a.highPotential, valB: b.highPotential, delta: deltas.highPotential, icon: <Flame className="w-4 h-4" />, colorClass: 'bg-blue-500 text-blue-700', textColor: 'text-blue-700', badgeColor: 'bg-blue-50 text-blue-800 border-blue-100' },
    { label: 'Medium Potential', valA: a.mediumPotential, valB: b.mediumPotential, delta: deltas.mediumPotential, icon: <Zap className="w-4 h-4" />, colorClass: 'bg-amber-500 text-amber-700', textColor: 'text-amber-700', badgeColor: 'bg-amber-50 text-amber-800 border-amber-100' },
    { label: 'Fresh/Unqualified', valA: a.freshUnqualified, valB: b.freshUnqualified, delta: deltas.freshUnqualified, icon: <Snowflake className="w-4 h-4" />, colorClass: 'bg-slate-400 text-slate-600', textColor: 'text-slate-600', badgeColor: 'bg-slate-50 text-slate-500 border-slate-100' },
    { label: 'Low/Cold', valA: a.lowCold, valB: b.lowCold, delta: deltas.lowCold, icon: <Trash2 className="w-4 h-4" />, colorClass: 'bg-red-500 text-red-700', textColor: 'text-red-700', badgeColor: 'bg-red-50 text-red-850 border-red-100' },
  ]

  // Render delta badge
  const renderDeltaBadge = (delta: number, isPercent = false) => {
    const isPositive = delta > 0
    const isNegative = delta < 0
    
    const badgeClass = isPositive 
      ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
      : isNegative 
        ? 'bg-red-50 text-red-800 border-red-100' 
        : 'bg-slate-50 text-slate-500 border-slate-100'

    return (
      <span className={cn("px-2 py-0.5 rounded-lg text-xs font-bold border inline-flex items-center gap-0.5 shrink-0", badgeClass)}>
        {isPositive && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />}
        {isNegative && <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />}
        {!isPositive && !isNegative && <Minus className="w-3.5 h-3.5 text-slate-400" />}
        {formatDelta(delta, isPercent)}
      </span>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* ── HEADER OVERVIEW ── */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            📅 Yearly Performance Comparison
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing leads shift from <span className="font-semibold text-slate-200">{yearB}</span> to <span className="font-semibold text-slate-200">{yearA}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-850 p-1.5 rounded-xl border border-slate-700/60">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700/50 flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="text-xs font-semibold text-slate-300">{yearA}:</span>
            <span className="text-xs font-bold text-white font-mono">{a.totalLeads.toLocaleString()} leads</span>
          </div>
          <span className="text-xs font-bold text-slate-500 font-mono px-1">VS</span>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700/50 flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-xs font-semibold text-slate-400">{yearB}:</span>
            <span className="text-xs font-bold text-slate-200 font-mono">{b.totalLeads.toLocaleString()} leads</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: ACQUISITION VOLUMES ── */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">🌐 Acquisition Channels</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {acqMetrics.map(m => {
            const pctChangeStr = getPctChange(m.valA, m.valB)
            const isPositive = m.delta > 0
            const isNegative = m.delta < 0
            const maxVal = Math.max(m.valA, m.valB, 1)
            const barPctA = (m.valA / maxVal) * 100
            const barPctB = (m.valB / maxVal) * 100

            return (
              <div key={m.title} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-extrabold text-slate-700 flex items-center gap-2">
                      {m.icon}
                      {m.title}
                    </span>
                    {renderDeltaBadge(m.delta)}
                  </div>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-extrabold text-slate-900 font-mono">
                      {m.valA.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      vs {m.valB.toLocaleString()}
                    </span>
                    {pctChangeStr !== '0%' && (
                      <span className={cn("text-xs font-extrabold ml-auto font-mono",
                        isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-slate-400'
                      )}>
                        {pctChangeStr}
                      </span>
                    )}
                  </div>
                </div>

                {/* Overlapping Bar Comparison */}
                <div className="relative w-full h-2.5 bg-slate-100/80 rounded-full overflow-hidden border border-slate-100 mt-2">
                  {/* Period B (Comparison) - Outer Bar */}
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-slate-200 rounded-full transition-all duration-500" 
                    style={{ width: `${barPctB}%` }} 
                  />
                  {/* Period A (Current) - Inner Nested Bar */}
                  <div 
                    className="absolute top-[2px] bottom-[2px] left-0 bg-violet-500 rounded-full transition-all duration-500" 
                    style={{ width: `${barPctA}%` }} 
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── SECTION 2: LEAD CONVERSION & FUNNEL QUALITY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Column: Conversion Rate highlight */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-extrabold text-slate-700 flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-655" />
                Conversion Rate
              </span>
              {renderDeltaBadge(deltas.convRate, true)}
            </div>

            <div className="flex items-center gap-6 my-4">
              <div className="text-center flex-1 py-3 bg-violet-50/60 rounded-xl border border-violet-100/50">
                <p className="text-[10px] uppercase font-bold tracking-wider text-violet-400">{yearA}</p>
                <p className="text-3xl font-black text-violet-750 mt-1 font-mono">{formatVal(a.convRate, true)}</p>
              </div>
              <div className="text-center flex-1 py-3 bg-slate-50/70 rounded-xl border border-slate-100/80">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{yearB}</p>
                <p className="text-2xl font-extrabold text-slate-500 mt-1.5 font-mono">{formatVal(b.convRate, true)}</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 border-t border-slate-100 pt-4 mt-4">
            <p className="leading-relaxed">
              Conversion rate measures the efficiency of turning incoming leads into registered enrollments. A positive delta indicates stronger sales funnel efficiency.
            </p>
          </div>
        </div>

        {/* Right 2 Columns: Funnel Quality */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow lg:col-span-2 space-y-4">
          <div>
            <h4 className="text-sm font-extrabold text-slate-800">🎯 Funnel Stages Comparison</h4>
            <p className="text-xs text-slate-400 mt-0.5">Comparing status distributions & conversion metrics</p>
          </div>

          <div className="space-y-4">
            {funnelMetrics.map(f => {
              // Calculate shares
              const shareA = a.totalLeads > 0 ? (f.valA / a.totalLeads) * 100 : 0
              const shareB = b.totalLeads > 0 ? (f.valB / b.totalLeads) * 100 : 0
              const maxShare = Math.max(shareA, shareB, 1)
              const barPctA = (shareA / maxShare) * 100
              const barPctB = (shareB / maxShare) * 100

              return (
                <div key={f.label} className="group border-b border-slate-50 last:border-b-0 pb-3 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <span className="p-1 rounded bg-slate-50 border border-slate-100">{f.icon}</span>
                      {f.label}
                    </span>

                    <div className="flex items-center gap-3">
                      <span className={cn("text-xs font-bold font-mono", f.textColor)}>
                        {f.valA.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">({shareA.toFixed(1)}%)</span>
                      </span>
                      <span className="text-xs text-slate-400">vs</span>
                      <span className="text-xs font-mono text-slate-400">
                        {f.valB.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">({shareB.toFixed(1)}%)</span>
                      </span>
                      {renderDeltaBadge(f.delta)}
                    </div>
                  </div>

                  {/* Dual Bar Share Comparison */}
                  <div className="grid grid-cols-[1fr_1fr] gap-x-3 mt-1.5">
                    <div>
                      <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", f.colorClass)} style={{ width: `${barPctA}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-400 font-semibold">{yearA} Share</span>
                    </div>
                    <div>
                      <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-300 rounded-full" style={{ width: `${barPctB}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-400 font-semibold">{yearB} Share</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── SECTION 3: COURSE-WISE LEAD DISTRIBUTION ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-base font-extrabold text-slate-800">🎓 Course Leads Distribution Comparison</h4>
            <p className="text-xs text-slate-400 mt-0.5">Course-wise comparison of leads generated and percent delta</p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1.5 bg-violet-500 rounded-full" />
              <span>{yearA} (Current)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-slate-200 rounded" />
              <span>{yearB} (Compare)</span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {courseMetrics.map(c => {
            const pctChangeStr = getPctChange(c.valA, c.valB)
            const isPositive = c.delta > 0
            const isNegative = c.delta < 0
            const maxVal = Math.max(c.valA, c.valB, 1)
            const barPctA = (c.valA / maxVal) * 100
            const barPctB = (c.valB / maxVal) * 100

            return (
              <div 
                key={c.label} 
                className="grid grid-cols-1 md:grid-cols-[1.5fr_2fr_1.2fr] items-center gap-4 md:gap-8 py-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/40 px-3 rounded-xl transition-all duration-200"
              >
                {/* Column 1: Course Info */}
                <div className="flex items-center gap-3">
                  <span className="text-xl p-2 rounded-xl bg-slate-50 border border-slate-100/70 shrink-0 shadow-sm">
                    {c.icon}
                  </span>
                  <span className="text-sm font-bold text-slate-800 tracking-tight leading-none">
                    {c.label}
                  </span>
                </div>

                {/* Column 2: Overlapping Bar Comparison */}
                <div className="relative w-full h-3 bg-slate-100/70 rounded-full overflow-hidden border border-slate-100">
                  {/* Period B (Comparison) - Outer Bar */}
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-slate-200 rounded-full transition-all duration-500" 
                    style={{ width: `${barPctB}%` }} 
                  />
                  {/* Period A (Current) - Inner Nested Bar */}
                  <div 
                    className="absolute top-[2px] bottom-[2px] left-0 bg-violet-500 rounded-full transition-all duration-500" 
                    style={{ width: `${barPctA}%` }} 
                  />
                </div>

                {/* Column 3: Numbers & Badge */}
                <div className="flex items-center justify-between md:justify-end gap-4">
                  <div className="flex items-baseline gap-2 font-mono">
                    <span className="text-sm font-extrabold text-slate-900">
                      {c.valA.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400">
                      vs {c.valB.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {pctChangeStr !== '0%' && (
                      <span className={cn("text-xs font-bold font-mono px-1.5 py-0.5 rounded-md",
                        isPositive ? 'text-emerald-700 bg-emerald-50' : isNegative ? 'text-red-700 bg-red-50' : 'text-slate-400 bg-slate-50'
                      )}>
                        {pctChangeStr}
                      </span>
                    )}
                    {renderDeltaBadge(c.delta)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
