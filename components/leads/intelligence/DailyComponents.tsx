// components/leads/intelligence/DailyComponents.tsx
import React from 'react'
import { TrendingUp, TrendingDown, Phone, AlertTriangle, Users, Clock, Bell, MessageSquare } from 'lucide-react'

interface DailyKPICardsProps {
  todayLeads: number
  yesterdayLeads: number
  todayContacted: number
  pendingCallback: number
  urgentUncontacted: number
  todayEnrolled: number
}

export function DailyKPICards({ todayLeads, yesterdayLeads, todayContacted, pendingCallback, urgentUncontacted, todayEnrolled }: DailyKPICardsProps) {
  const delta = todayLeads - yesterdayLeads
  const deltaPos = delta >= 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
      <div className="col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Leads</span>
          {deltaPos ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
        </div>
        <h3 className="text-2xl font-extrabold text-slate-800">{todayLeads}</h3>
        <p className={`text-[11px] font-bold mt-1 ${deltaPos ? 'text-emerald-600' : 'text-red-500'}`}>
          {deltaPos ? '+' : ''}{delta} vs yesterday
        </p>
      </div>
      <div className="col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yesterday</span>
          <Clock className="w-4 h-4 text-slate-400" />
        </div>
        <h3 className="text-2xl font-extrabold text-slate-800">{yesterdayLeads}</h3>
        <p className="text-[11px] text-slate-400 mt-1">Prior day comparison</p>
      </div>
      <div className="col-span-1 bg-white p-5 rounded-2xl border border-blue-100 bg-blue-50/20 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Contacted Today</span>
            <Phone className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-2xl font-extrabold text-blue-700">{todayContacted}</h3>
          <p className="text-[11px] text-blue-400 mt-0.5">{todayLeads > 0 ? ((todayContacted/todayLeads)*100).toFixed(0) : 0}% contact rate</p>
        </div>
        <div className="mt-3 border-t border-blue-100/50 pt-2">
          <div className="flex justify-between text-[9px] text-blue-500 font-bold mb-1">
            <span>Call Pacing Target (40)</span>
            <span>{Math.round(Math.min(100, (todayContacted / 40) * 100))}%</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-1 overflow-hidden">
            <div 
              className="bg-blue-600 h-1 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (todayContacted / 40) * 100)}%` }} 
            />
          </div>
        </div>
      </div>
      <div className="col-span-1 bg-white p-5 rounded-2xl border border-yellow-100 bg-yellow-50/20 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">Pending Callback</span>
          <Bell className="w-4 h-4 text-yellow-500" />
        </div>
        <h3 className="text-2xl font-extrabold text-yellow-700">{pendingCallback}</h3>
        <p className="text-[11px] text-yellow-500 mt-1">Scheduled follow-ups</p>
      </div>
      <div className="col-span-1 bg-white p-5 rounded-2xl border border-red-100 bg-red-50/20 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Uncontacted</span>
          <AlertTriangle className="w-4 h-4 text-red-500" />
        </div>
        <h3 className="text-2xl font-extrabold text-red-700">{urgentUncontacted}</h3>
        <p className="text-[11px] text-red-400 mt-1">Needs immediate dial</p>
      </div>
      <div className="col-span-1 bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Enrolled Today</span>
          <TrendingUp className="w-4 h-4 text-emerald-500" />
        </div>
        <h3 className="text-2xl font-extrabold text-emerald-700">{todayEnrolled}</h3>
        <p className="text-[11px] text-emerald-400 mt-1">New paying students</p>
      </div>
    </div>
  )
}

interface UrgentAction {
  leadId: string
  name: string
  phone: string
  status: string
  ageHours: number
  course: string
  urgencyReason: string
}

interface UrgentActionListProps {
  actions: UrgentAction[]
}

export function UrgentActionList({ actions }: UrgentActionListProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-red-100 bg-red-50/30 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <div>
          <h4 className="text-sm font-bold text-slate-800">Urgent Actions Required</h4>
          <p className="text-xs text-slate-400">{actions.length} leads need immediate attention from your team</p>
        </div>
      </div>
      <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
        {actions.slice(0, 15).map(a => (
          <div key={a.leadId} className="p-4 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-slate-800 truncate">{a.name || 'Unknown Lead'}</p>
                  <p className="text-[11px] text-slate-400">{a.course || 'No course'}</p>
                </div>
                <span className="text-[10px] font-bold bg-red-50 text-red-600 rounded px-2 py-0.5 shrink-0">{Math.round(a.ageHours)}h old</span>
              </div>
              <p className="text-[11px] text-orange-500 font-semibold mt-0.5">{a.urgencyReason}</p>
            </div>
          </div>
        ))}
        {actions.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm">All leads attended to. Great work! 🎉</div>
        )}
      </div>
    </div>
  )
}

interface TeamAgent {
  agent: string
  leadsAssigned: number
  callsToday: number
  enrolled: number
  contactRate: number
  pendingBacklog: number
}

interface TeamPerformanceTableProps {
  agents: TeamAgent[]
}

export function TeamPerformanceTable({ agents }: TeamPerformanceTableProps) {
  const sorted = [...agents].sort((a, b) => b.enrolled - a.enrolled || b.callsToday - a.callsToday)
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Today's Agent Scoreboard</h4>
          <p className="text-xs text-slate-400">Calls made and conversions achieved by each team member today</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
              <th className="py-3 px-5">#</th>
              <th className="py-3 px-5">Agent</th>
              <th className="py-3 px-5 text-center">Assigned</th>
              <th className="py-3 px-5 text-center">Calls Made</th>
              <th className="py-3 px-5 text-center">Contact Rate</th>
              <th className="py-3 px-5 text-center">Backlog</th>
              <th className="py-3 px-5 text-center">Enrolled</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {sorted.map((a, idx) => {
              const isTop = idx === 0 && (a.enrolled > 0 || a.callsToday > 0)
              return (
                <tr key={a.agent} className={`hover:bg-slate-50/50 transition-colors ${isTop ? 'bg-indigo-50/10' : ''}`}>
                  <td className="py-3 px-5 text-slate-400 font-bold">{idx+1}</td>
                  <td className="py-3 px-5 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-800 truncate max-w-[120px] flex items-center gap-1">
                      {a.agent.split('@')[0]}
                      {isTop && <span className="text-xs shrink-0" title="Top Performer">🏆</span>}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-center">{a.leadsAssigned}</td>
                  <td className="py-3 px-5 text-center">{a.callsToday}</td>
                  <td className="py-3 px-5 text-center">{a.contactRate.toFixed(0)}%</td>
                  <td className="py-3 px-5 text-center text-slate-500">{a.pendingBacklog}</td>
                  <td className="py-3 px-5 text-center">
                    <span className="text-emerald-600 font-extrabold text-sm">{a.enrolled}</span>
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

interface LiveLead {
  id: string
  name: string
  phone: string
  course: string
  source: string
  createdMinutesAgo: number
  status: string
}

interface LiveLeadFeedProps {
  leads: LiveLead[]
}

export function LiveLeadFeed({ leads }: LiveLeadFeedProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <h4 className="text-sm font-bold text-slate-800">Live Lead Feed — Today</h4>
      </div>
      <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
        {leads.slice(0, 12).map((lead, idx) => (
          <div key={lead.id} className="p-4 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-extrabold text-indigo-600 shrink-0">
              {idx+1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-slate-800">{lead.name || 'New Lead'}</p>
                  <p className="text-[11px] text-slate-400">{lead.course || 'No course selected'}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold shrink-0">{lead.createdMinutesAgo < 60 ? `${lead.createdMinutesAgo}m ago` : `${Math.floor(lead.createdMinutesAgo/60)}h ago`}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">{lead.source}</span>
                <span className="text-[10px] font-bold text-slate-400">{lead.status}</span>
              </div>
            </div>
          </div>
        ))}
        {leads.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm">No new leads received today yet.</div>
        )}
      </div>
    </div>
  )
}

interface DailyInsightsPanelProps {
  insights: string[]
}

export function DailyInsightsPanel({ insights }: DailyInsightsPanelProps) {
  if (!insights || insights.length === 0) return null

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-500">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Daily Operations & Performance Insights</h4>
          <p className="text-[10px] text-slate-400">Automated queue and agent performance observations</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {insights.map((insight, idx) => {
          let cardStyle = 'bg-slate-950/30 border-slate-850 text-slate-300'
          if (insight.includes('🏆')) cardStyle = 'bg-indigo-950/20 border-indigo-900/30 text-indigo-200'
          if (insight.includes('⚠️') || insight.includes('🚨')) cardStyle = 'bg-rose-950/20 border-rose-900/30 text-rose-200'
          if (insight.includes('✅')) cardStyle = 'bg-emerald-950/20 border-emerald-900/30 text-emerald-200'

          // Extract text without first symbol
          const text = insight.replace(/^[^\s]+\s/, '')
          const symbol = insight.split(' ')[0]

          return (
            <div key={idx} className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all hover:scale-[1.01] ${cardStyle}`}>
              <span className="text-sm mt-0.5 shrink-0">{symbol}</span>
              <p className="text-[11px] font-semibold leading-relaxed">
                {text}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
