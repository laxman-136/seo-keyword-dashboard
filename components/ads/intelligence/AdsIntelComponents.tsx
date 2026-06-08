import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts'
import {
  Flame, Zap, AlertTriangle, AlertCircle, Sparkles, TrendingUp, CheckCircle,
  Eye, Heart, ExternalLink, ArrowRight, ShieldAlert, BadgeAlert, Layers, Shield,
  Search, ArrowUpDown
} from 'lucide-react'
import { CampaignAttributionResult } from '@/lib/attribution'
import { CompetitorAd } from '@/lib/meta-ad-library'

// ─── HEALTH SCORE CARD ──────────────────────────────────────────────────────
interface HealthScoreCardProps {
  score: number
  grade: string
  areasToImprove: string[]
}

export function HealthScoreCard({ score, grade, areasToImprove }: HealthScoreCardProps) {
  const getGradientColor = (s: number) => {
    if (s >= 80) return 'from-emerald-500 to-teal-600 text-emerald-600 bg-emerald-50/20 border-emerald-100'
    if (s >= 65) return 'from-blue-500 to-indigo-600 text-blue-600 bg-blue-50/20 border-blue-100'
    if (s >= 50) return 'from-amber-400 to-orange-500 text-amber-600 bg-amber-50/20 border-amber-100'
    return 'from-rose-500 to-red-600 text-rose-600 bg-rose-50/20 border-rose-100'
  }

  const borderClass = getGradientColor(score)

  return (
    <div className={`bg-white rounded-2xl border p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center ${borderClass.split(' ')[4]}`}>
      {/* Radial score meter */}
      <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="72" cy="72" r="62" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
          <circle 
            cx="72" 
            cy="72" 
            r="62" 
            stroke="currentColor" 
            strokeWidth="10" 
            fill="transparent" 
            strokeDasharray={389.5} 
            strokeDashoffset={389.5 - (389.5 * score) / 100}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-black text-slate-800 leading-none">{score}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Health Score</span>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold text-slate-800">Account Health: Grade {grade}</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white">Live Data</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Weighted performance score evaluated across ad budgets, CPC benchmarks, lead quality rate, and sales speed.</p>
        </div>

        {areasToImprove.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">⚠️ Action Plan Opportunities ({areasToImprove.length})</p>
            <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
              {areasToImprove.slice(0, 3).map((item, idx) => (
                <li key={idx} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl text-xs font-bold">
            <CheckCircle className="w-4.5 h-4.5" />
            <span>Excellent parameters! All ad pacing, Quality Scores, and lead rates are within optimal targets.</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── INSIGHT CARD ───────────────────────────────────────────────────────────
interface InsightCardProps {
  type: 'opportunity' | 'warning' | 'critical' | 'positive'
  category: string
  title: string
  detail: string
  impact: string
  estimatedRevenueImpact: number | null
  recommendedAction: string
}

export function InsightCard({ type, category, title, detail, impact, estimatedRevenueImpact, recommendedAction }: InsightCardProps) {
  const themeMap = {
    critical: { border: 'border-rose-100 bg-rose-50/20 text-rose-600', icon: <ShieldAlert className="w-5 h-5 text-rose-500" /> },
    warning: { border: 'border-amber-100 bg-amber-50/20 text-amber-600', icon: <AlertTriangle className="w-5 h-5 text-amber-500" /> },
    opportunity: { border: 'border-blue-100 bg-blue-50/20 text-blue-600', icon: <Sparkles className="w-5 h-5 text-blue-500" /> },
    positive: { border: 'border-emerald-100 bg-emerald-50/20 text-emerald-600', icon: <CheckCircle className="w-5 h-5 text-emerald-500" /> }
  }

  const theme = themeMap[type] || themeMap.opportunity

  return (
    <div className={`p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white ${theme.border}`}>
      <div className="flex gap-3 items-start flex-1">
        <div className="mt-0.5 shrink-0">{theme.icon}</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{category}</span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Impact: {impact}</span>
          </div>
          <h4 className="text-sm font-extrabold text-slate-800">{title}</h4>
          <p className="text-xs text-slate-500 leading-relaxed">{detail}</p>
          <div className="pt-2 border-t border-slate-100/50 mt-2">
            <p className="text-xs font-bold text-slate-700">💡 Recommended Action:</p>
            <p className="text-xs text-slate-600 mt-0.5">{recommendedAction}</p>
          </div>
        </div>
      </div>
      {estimatedRevenueImpact !== null && (
        <div className="text-right shrink-0 bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-800 shadow-md">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Est. Revenue Impact</p>
          <p className="text-lg font-black text-emerald-400">+₹{estimatedRevenueImpact.toLocaleString()}</p>
        </div>
      )}
    </div>
  )
}

// ─── CAMPAIGN QUALITY MATRIX ───────────────────────────────────────────────
interface CampaignQualityMatrixProps {
  campaigns: CampaignAttributionResult[]
  spendData?: Record<string, number>
}

export function CampaignQualityMatrix({ campaigns, spendData }: CampaignQualityMatrixProps) {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PAUSED'>('ACTIVE')
  const [searchQuery, setSearchQuery] = useState('')
  const [platformFilter, setPlatformFilter] = useState<'all' | 'meta' | 'google' | 'organic'>('all')
  const [sortBy, setSortBy] = useState<keyof CampaignAttributionResult>('spend')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: keyof CampaignAttributionResult) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  // 1. Filter by status (Tab)
  let filtered = campaigns.filter(c => {
    const nameLower = c.campaignName.toLowerCase()
    const isOrganic = ['organic traffic', 'direct', 'referral', 'organic', 'website'].some(term => nameLower.includes(term))
    if (activeTab === 'ACTIVE') {
      return isOrganic || c.status === 'ACTIVE'
    } else {
      return !isOrganic && c.status === 'PAUSED'
    }
  })

  // 2. Filter by search query
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(c => c.campaignName.toLowerCase().includes(q))
  }

  // 3. Filter by platform
  if (platformFilter !== 'all') {
    filtered = filtered.filter(c => {
      const p = c.platform || 'other'
      if (platformFilter === 'organic') {
        return ['organic', 'direct', 'referral'].includes(p)
      }
      return p === platformFilter
    })
  }

  // 4. Sort
  filtered = [...filtered].sort((a, b) => {
    let valA = a[sortBy]
    let valB = b[sortBy]

    if (valA === undefined || valA === null) valA = 0
    if (valB === undefined || valB === null) valB = 0

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
    } else {
      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number)
    }
  })

  const renderSortIcon = (field: keyof CampaignAttributionResult) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 opacity-40 ml-1 inline shrink-0" />
    return sortOrder === 'asc' ? (
      <span className="text-indigo-600 font-extrabold ml-1">▲</span>
    ) : (
      <span className="text-indigo-600 font-extrabold ml-1">▼</span>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header and Filter bar */}
      <div className="p-5 border-b border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-slate-800">Campaign Quality & Attribution Matrix</h4>
            <p className="text-xs text-slate-400 mt-1">Paid ad campaigns ranked by Cost Per Enrolled (CPE) student rather than Cost Per Lead (CPL)</p>
          </div>
        </div>

        {/* Controls: Tabs, Search, Platform select */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mt-1">
          {/* Active vs Paused tabs */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50 self-start">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ACTIVE'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Live Campaigns
            </button>
            <button
              onClick={() => setActiveTab('PAUSED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'PAUSED'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Paused/Inactive
            </button>
          </div>

          {/* Filtering and Search */}
          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-44 sm:w-56 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Platform Select */}
            <select
              value={platformFilter}
              onChange={(e: any) => setPlatformFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:bg-white"
            >
              <option value="all">All Channels</option>
              <option value="meta">Meta Ads</option>
              <option value="google">Google Ads</option>
              <option value="organic">Organic / Website</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 select-none">
              <th onClick={() => handleSort('campaignName')} className="py-3 px-5 cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center">Campaign Name {renderSortIcon('campaignName')}</div>
              </th>
              <th onClick={() => handleSort('spend')} className="py-3 px-5 text-center cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-center">Spend {renderSortIcon('spend')}</div>
              </th>
              <th onClick={() => handleSort('adLeads')} className="py-3 px-5 text-center cursor-pointer hover:bg-slate-100 transition-colors text-slate-500">
                <div className="flex items-center justify-center">Ad Leads {renderSortIcon('adLeads')}</div>
              </th>
              <th onClick={() => handleSort('totalLeads')} className="py-3 px-5 text-center cursor-pointer hover:bg-slate-100 transition-colors text-slate-800">
                <div className="flex items-center justify-center">CRM Leads {renderSortIcon('totalLeads')}</div>
              </th>
              <th onClick={() => handleSort('costPerLead')} className="py-3 px-5 text-center cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-center">CPL {renderSortIcon('costPerLead')}</div>
              </th>
              <th onClick={() => handleSort('highPotentialLeads')} className="py-3 px-5 text-center cursor-pointer hover:bg-slate-100 transition-colors text-indigo-600">
                <div className="flex items-center justify-center">HP Leads {renderSortIcon('highPotentialLeads')}</div>
              </th>
              <th onClick={() => handleSort('enrolledLeads')} className="py-3 px-5 text-center cursor-pointer hover:bg-slate-100 transition-colors text-emerald-600">
                <div className="flex items-center justify-center">Enrolled {renderSortIcon('enrolledLeads')}</div>
              </th>
              <th onClick={() => handleSort('costPerEnrolled')} className="py-3 px-5 text-center cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-center">CPE {renderSortIcon('costPerEnrolled')}</div>
              </th>
              <th onClick={() => handleSort('attributedRevenue')} className="py-3 px-5 text-center cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-center">Revenue {renderSortIcon('attributedRevenue')}</div>
              </th>
              <th onClick={() => handleSort('trueROAS')} className="py-3 px-5 text-center cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-center">ROAS {renderSortIcon('trueROAS')}</div>
              </th>
              <th className="py-3 px-5 text-center">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400 text-xs font-medium">
                  No campaigns found matching the criteria.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const nameLower = c.campaignName.toLowerCase()
                const isOrganic = ['organic traffic', 'direct', 'referral', 'organic', 'website'].some(term => nameLower.includes(term))
                
                const spend = c.spend ?? (spendData?.[c.campaignName] || c.costPerLead * c.totalLeads)
                const cpe = !isOrganic && c.enrolledLeads > 0 ? spend / c.enrolledLeads : Infinity

                let gradeColor = 'bg-slate-50 text-slate-500'
                let gradeLabel = '—'

                if (!isOrganic) {
                  if (cpe < 5000) { gradeColor = 'bg-emerald-50 text-emerald-700'; gradeLabel = 'A+' }
                  else if (cpe < 10000) { gradeColor = 'bg-blue-50 text-blue-700'; gradeLabel = 'B' }
                  else if (cpe < 15000) { gradeColor = 'bg-yellow-50 text-yellow-700'; gradeLabel = 'C' }

                  if (c.enrolledLeads === 0 || cpe === Infinity) { gradeColor = 'bg-rose-50 text-rose-600'; gradeLabel = 'F' }
                }

                const platform = c.platform || 'other'

                return (
                  <tr key={c.campaignName} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        {platform === 'meta' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100">Meta</span>
                        )}
                        {platform === 'google' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-cyan-50 text-cyan-600 border border-cyan-100">Google</span>
                        )}
                        {['organic', 'direct', 'referral'].includes(platform) && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-500 border border-slate-200">Organic</span>
                        )}
                        <p className="font-bold text-slate-800">{c.campaignName}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-center">₹{Math.round(spend).toLocaleString()}</td>
                    <td className="py-3.5 px-5 text-center font-bold text-slate-400">{isOrganic ? '—' : c.adLeads}</td>
                    <td className="py-3.5 px-5 text-center font-bold text-slate-800">{c.totalLeads}</td>
                    <td className="py-3.5 px-5 text-center text-slate-500">
                      {c.totalLeads > 0 ? `₹${Math.round(c.costPerLead)}` : spend > 0 ? '—' : '₹0'}
                    </td>
                    <td className="py-3.5 px-5 text-center text-indigo-600">{c.highPotentialLeads}</td>
                    <td className="py-3.5 px-5 text-center text-emerald-600 font-bold">{c.enrolledLeads}</td>
                    <td className="py-3.5 px-5 text-center font-bold">
                      {isOrganic ? '—' : cpe === Infinity ? '—' : `₹${Math.round(cpe).toLocaleString()}`}
                    </td>
                    <td className="py-3.5 px-5 text-center text-slate-800">₹{c.attributedRevenue.toLocaleString()}</td>
                    <td className="py-3.5 px-5 text-center">
                      {isOrganic ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full font-bold ${c.trueROAS >= 4.0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{c.trueROAS}x</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${gradeColor}`}>{gradeLabel}</span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── FULL FUNNEL VISUALIZER ────────────────────────────────────────────────
interface FullFunnelVisualizerProps {
  impressions: number
  clicks: number
  leadsCRM: number
  demos: number
  enrolled: number
}

export function FullFunnelVisualizer({ impressions, clicks, leadsCRM, demos, enrolled }: FullFunnelVisualizerProps) {
  const steps = [
    { name: '1. Ad Impressions', value: impressions, pct: 100, color: 'bg-blue-400' },
    { name: '2. Link Clicks', value: clicks, pct: impressions > 0 ? (clicks / impressions) * 100 : 0, color: 'bg-indigo-400' },
    { name: '3. CRM Leads Created', value: leadsCRM, pct: clicks > 0 ? (leadsCRM / clicks) * 100 : 0, color: 'bg-violet-400' },
    { name: '4. Demo Attendees', value: demos, pct: leadsCRM > 0 ? (demos / leadsCRM) * 100 : 0, color: 'bg-pink-400' },
    { name: '5. Enrolled Students', value: enrolled, pct: demos > 0 ? (enrolled / demos) * 100 : 0, color: 'bg-emerald-400' }
  ]

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="mb-6">
        <h4 className="text-base font-bold text-slate-800">Paid Funnel Leak Architecture</h4>
        <p className="text-xs text-slate-400">Total conversion metrics mapped across the entire customer lifecycle (Paid to Enrollment)</p>
      </div>
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const width = idx === 0 ? 100 : Math.max(5, (step.value / impressions) * 100)
          return (
            <div key={step.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>{step.name}</span>
                <div className="flex gap-2">
                  <span className="text-slate-400 font-medium">{step.value.toLocaleString()}</span>
                  <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded text-[10px]">
                    {idx === 0 ? 'Base' : `${((step.value / steps[idx - 1].value) * 100).toFixed(1)}% conversion`}
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-50 h-5 rounded-lg overflow-hidden border border-slate-100">
                <div className={`h-full rounded-r-md transition-all duration-500 ${step.color}`} style={{ width: `${width}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── COMPETITOR THREAT TABLE ────────────────────────────────────────────────
interface CompetitorThreatTableProps {
  competitors: Array<{
    name: string
    pageId: string
    threatLevel: 'high' | 'medium' | 'low'
    activeAdsCount: number
    angles: string[]
    runningSince: string
  }>
}

export function CompetitorThreatTable({ competitors }: CompetitorThreatTableProps) {
  const getThreatColor = (t: string) => {
    if (t === 'high') return 'bg-rose-50 text-rose-600'
    if (t === 'medium') return 'bg-amber-50 text-amber-600'
    return 'bg-emerald-50 text-emerald-600'
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h4 className="text-base font-bold text-slate-800">Competitor Advertising Threat Index</h4>
        <p className="text-xs text-slate-400">Monitored training providers running active Meta ads in ERP categories</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
              <th className="py-3 px-5">Competitor Page Name</th>
              <th className="py-3 px-5 text-center">Active Ads</th>
              <th className="py-3 px-5">Top Advertising Angle</th>
              <th className="py-3 px-5 text-center">Threat Level</th>
              <th className="py-3 px-5 text-center">Active Since</th>
              <th className="py-3 px-5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {competitors.map((c) => (
              <tr key={c.pageId} className="hover:bg-slate-50/50">
                <td className="py-3.5 px-5 font-bold text-slate-800">{c.name}</td>
                <td className="py-3.5 px-5 text-center font-bold text-slate-800">{c.activeAdsCount} ads</td>
                <td className="py-3.5 px-5 text-slate-500 font-normal">{c.angles[0] || 'ERP Cloud Placement'}</td>
                <td className="py-3.5 px-5 text-center">
                  <span className={`px-2 py-0.5 rounded font-bold capitalize text-[10px] ${getThreatColor(c.threatLevel)}`}>
                    {c.threatLevel}
                  </span>
                </td>
                <td className="py-3.5 px-5 text-center text-slate-400 font-medium">{c.runningSince}</td>
                <td className="py-3.5 px-5 text-center">
                  <a 
                    href={`https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&view_all_page_id=${c.pageId}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold"
                  >
                    View Library <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── BUDGET PACING CHART ───────────────────────────────────────────────────
interface PacingChartProps {
  dailySpend: Array<{ date: string; cumulativeActual: number; cumulativeIdeal: number }>
  totalBudget: number
}

export function PacingChart({ dailySpend, totalBudget }: PacingChartProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="mb-4">
        <h4 className="text-base font-bold text-slate-800">Cumulative Monthly Budget Pacing</h4>
        <p className="text-xs text-slate-400">Actual marketing spend pacing vs linear budget targets</p>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dailySpend} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="cumulativeActual" stroke="#3b82f6" name="Actual Spend" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="cumulativeIdeal" stroke="#94a3b8" strokeDasharray="5 5" name="Ideal Target" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
