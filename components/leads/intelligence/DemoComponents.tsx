// components/leads/intelligence/DemoComponents.tsx
import React from 'react'
import { ResponsiveContainer, FunnelChart, Funnel, LabelList, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { Target, Users, TrendingUp, Star, AlertCircle, ChevronRight } from 'lucide-react'

interface DemoStageCardsProps {
  totalLeads: number
  interestedInDemo: number
  demoAttended: number
  enrolled: number
}

export function DemoStageCards({ totalLeads, interestedInDemo, demoAttended, enrolled }: DemoStageCardsProps) {
  const demoInterestRate = totalLeads > 0 ? ((interestedInDemo / totalLeads) * 100).toFixed(1) : '0.0'
  const demoAttendRate = interestedInDemo > 0 ? ((demoAttended / interestedInDemo) * 100).toFixed(1) : '0.0'
  const demoConvRate = demoAttended > 0 ? ((enrolled / demoAttended) * 100).toFixed(1) : '0.0'
  const overallConvRate = totalLeads > 0 ? ((enrolled / totalLeads) * 100).toFixed(1) : '0.0'

  const stages = [
    { label: 'Total Leads', value: totalLeads, rate: '100%', icon: <Users className="w-5 h-5 text-slate-500" />, color: 'border-slate-100 bg-slate-50/30' },
    { label: 'Demo Interest', value: interestedInDemo, rate: `${demoInterestRate}%`, icon: <Target className="w-5 h-5 text-blue-500" />, color: 'border-blue-100 bg-blue-50/30' },
    { label: 'Demo Attended', value: demoAttended, rate: `${demoAttendRate}% show-up`, icon: <Star className="w-5 h-5 text-yellow-500" />, color: 'border-yellow-100 bg-yellow-50/30' },
    { label: 'Enrolled', value: enrolled, rate: `${demoConvRate}% post-demo`, icon: <TrendingUp className="w-5 h-5 text-emerald-500" />, color: 'border-emerald-100 bg-emerald-50/30' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stages.map((stage, idx) => (
        <div key={stage.label} className={`bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${stage.color}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stage.label}</span>
            {stage.icon}
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-slate-800">{stage.value.toLocaleString()}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">{stage.rate} of prev stage</p>
          </div>
          {idx < stages.length - 1 && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1 text-[11px] font-bold text-indigo-600">
              <ChevronRight className="w-3 h-3" />
              <span>Next: {stages[idx + 1].label}</span>
            </div>
          )}
          {idx === stages.length - 1 && (
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] font-bold text-emerald-600">
              Overall: {overallConvRate}% end-to-end
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

interface DemoFunnelVizProps {
  totalLeads: number
  interestedInDemo: number
  demoAttended: number
  enrolled: number
}

export function DemoFunnelViz({ totalLeads, interestedInDemo, demoAttended, enrolled }: DemoFunnelVizProps) {
  const data = [
    { name: 'Total Leads', value: totalLeads, fill: '#6366f1' },
    { name: 'Interested in Demo', value: interestedInDemo, fill: '#3b82f6' },
    { name: 'Demo Attended', value: demoAttended, fill: '#f59e0b' },
    { name: 'Enrolled', value: enrolled, fill: '#10b981' },
  ]

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="mb-4">
        <h4 className="text-base font-bold text-slate-800">Demo Conversion Funnel</h4>
        <p className="text-xs text-slate-400">Visual drop-off at each stage of the demo pipeline</p>
      </div>
      <div className="min-h-[320px]">
        <ResponsiveContainer width="100%" height={320}>
          <FunnelChart>
            <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
            <Funnel dataKey="value" data={data} isAnimationActive>
              <LabelList position="right" fill="#64748b" stroke="none" dataKey="name" style={{ fontSize: 12, fontWeight: 600 }} />
              <LabelList position="center" fill="#fff" stroke="none" dataKey="value" style={{ fontSize: 14, fontWeight: 800 }} />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface CourseDemoTableProps {
  courseData: Array<{
    course: string
    interestedCount: number
    demoAttended: number
    enrolled: number
    attendRate: number
    postDemoConvRate: number
  }>
}

export function CourseDemoTable({ courseData }: CourseDemoTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h4 className="text-base font-bold text-slate-800">Demo Performance by Course</h4>
        <p className="text-xs text-slate-400">Which courses convert best through the demo funnel</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
              <th className="py-3.5 px-6">Course</th>
              <th className="py-3.5 px-6 text-center">Interested</th>
              <th className="py-3.5 px-6 text-center">Attended</th>
              <th className="py-3.5 px-6 text-center">Enrolled</th>
              <th className="py-3.5 px-6 text-center">Show-up Rate</th>
              <th className="py-3.5 px-6 text-center">Post-Demo Conv</th>
              <th className="py-3.5 px-6 text-center">Quality</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {courseData.map(c => (
              <tr key={c.course} className="hover:bg-slate-50/50">
                <td className="py-4 px-6 font-bold text-slate-800">{c.course}</td>
                <td className="py-4 px-6 text-center">{c.interestedCount}</td>
                <td className="py-4 px-6 text-center">{c.demoAttended}</td>
                <td className="py-4 px-6 text-center text-emerald-600 font-bold">{c.enrolled}</td>
                <td className="py-4 px-6 text-center">{c.attendRate.toFixed(1)}%</td>
                <td className="py-4 px-6 text-center font-bold text-indigo-600">{c.postDemoConvRate.toFixed(1)}%</td>
                <td className="py-4 px-6 text-center">
                  <div className="flex justify-center">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= Math.round(c.postDemoConvRate / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface DropOffAnalysisProps {
  interestedInDemo: number
  demoAttended: number
  enrolled: number
}

export function DropOffAnalysis({ interestedInDemo, demoAttended, enrolled }: DropOffAnalysisProps) {
  const noShowCount = Math.max(0, interestedInDemo - demoAttended)
  const noEnrollCount = Math.max(0, demoAttended - enrolled)
  const noShowPct = interestedInDemo > 0 ? ((noShowCount / interestedInDemo) * 100).toFixed(1) : '0'
  const noEnrollPct = demoAttended > 0 ? ((noEnrollCount / demoAttended) * 100).toFixed(1) : '0'

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <AlertCircle className="w-6 h-6 text-yellow-400" />
        <h4 className="text-base font-bold">Drop-Off Analysis & Optimization Opportunities</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
          <h5 className="text-sm font-bold text-yellow-400 mb-2">Stage 1: Demo No-Shows</h5>
          <p className="text-3xl font-extrabold text-white mb-1">{noShowCount} leads <span className="text-xl text-slate-400">({noShowPct}%)</span></p>
          <p className="text-xs text-slate-300 leading-relaxed">Expressed interest in demo but never attended. Send 2-hour WhatsApp reminder + backup slot offer to recover these leads.</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
          <h5 className="text-sm font-bold text-red-400 mb-2">Stage 2: Post-Demo Dropouts</h5>
          <p className="text-3xl font-extrabold text-white mb-1">{noEnrollCount} leads <span className="text-xl text-slate-400">({noEnrollPct}%)</span></p>
          <p className="text-xs text-slate-300 leading-relaxed">Attended demo but did not enroll within 7 days. Deploy fee negotiation + deferred payment EMI offer campaign.</p>
        </div>
      </div>
    </div>
  )
}
