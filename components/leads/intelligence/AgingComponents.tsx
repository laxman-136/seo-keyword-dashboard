// components/leads/intelligence/AgingComponents.tsx
import React from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { Clock, AlertTriangle, CheckCircle, TrendingUp, Flame, Zap, Sun, ShieldAlert, Archive } from 'lucide-react'

// Age buckets metadata
export const AGE_BUCKETS = [
  { label: '🔥 Hot (< 7 days)',      min: 0,   max: 7,   action: 'Call immediately',              color: '#16a34a' },
  { label: '⚡ Warm (7-30 days)',     min: 7,   max: 30,  action: 'Follow up today',               color: '#2563eb' },
  { label: '🟡 Cooling (30-90 days)', min: 30,  max: 90,  action: 'Re-engagement call needed',     color: '#ca8a04' },
  { label: '🔴 Cold (90-180 days)',   min: 90,  max: 180, action: 'WhatsApp blast + last attempt', color: '#ea580c' },
  { label: '⚫ Dead (> 180 days)',    min: 180, max: 9999, action: 'Archive or bulk campaign',      color: '#6b7280' },
]

interface AgingBucketCardsProps {
  buckets: Array<{
    bucketLabel: string
    count: number
    percent: number
    actionLabel: string
  }>
}

export function AgingBucketCards({ buckets }: AgingBucketCardsProps) {
  const icons = [
    <Flame className="w-5 h-5 text-emerald-500" key="hot" />,
    <Zap className="w-5 h-5 text-blue-500" key="warm" />,
    <Sun className="w-5 h-5 text-yellow-600" key="cooling" />,
    <ShieldAlert className="w-5 h-5 text-orange-500" key="cold" />,
    <Archive className="w-5 h-5 text-slate-500" key="dead" />
  ]

  const borderColors = [
    'border-emerald-100 hover:border-emerald-300 bg-emerald-50/20',
    'border-blue-100 hover:border-blue-300 bg-blue-50/20',
    'border-yellow-100 hover:border-yellow-300 bg-yellow-50/20',
    'border-orange-100 hover:border-orange-300 bg-orange-50/20',
    'border-slate-100 hover:border-slate-300 bg-slate-50/20'
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {buckets.map((b, idx) => (
        <div 
          key={`${b.bucketLabel || 'bucket'}-${idx}`} 
          className={`p-5 rounded-2xl border transition-all shadow-sm ${borderColors[idx] || 'border-slate-100 bg-white'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{b.bucketLabel}</span>
            {icons[idx] || <Clock className="w-5 h-5 text-slate-400" />}
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-slate-800">{b.count.toLocaleString()}</h3>
            <p className="text-xs text-slate-400 font-medium">
              {b.percent.toFixed(1)}% of pending leads
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100/50 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600 truncate mr-2">{b.actionLabel}</span>
            <span className="text-xs text-indigo-600 font-bold shrink-0">Act ↗</span>
          </div>
        </div>
      ))}
    </div>
  )
}

interface AgingBarChartProps {
  chartData: any[]
  pieData: any[]
}

export function AgingBarChart({ chartData, pieData }: AgingBarChartProps) {
  const PIE_COLORS = ['#16a34a', '#2563eb', '#ca8a04', '#ea580c', '#6b7280']

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Horizontal Bar Chart */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <div className="mb-4">
          <h4 className="text-base font-bold text-slate-800">Lead Age Bucket by Status</h4>
          <p className="text-xs text-slate-400">Total volume of pending leads sitting in each pipeline status stage</p>
        </div>
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#f1f5f9" />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={185} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelClassName="font-bold text-slate-800"
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Hot" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Warm" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Cooling" stackId="a" fill="#ca8a04" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Cold" stackId="a" fill="#ea580c" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Dead" stackId="a" fill="#6b7280" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <h4 className="text-base font-bold text-slate-800">Pending Age Distribution</h4>
          <p className="text-xs text-slate-400">Proportion of unresolved leads by timeline</p>
        </div>
        <div className="flex-1 min-h-[220px] flex items-center justify-center relative my-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-extrabold text-slate-800">
              {pieData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Pending</span>
          </div>
        </div>
        <div className="space-y-2">
          {pieData.map((item, idx) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx] }} />
                <span className="text-slate-600 font-medium">{item.name}</span>
              </div>
              <span className="text-slate-800 font-bold">{item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface CourseAgingTableProps {
  coursesAging: Array<{
    course: string
    totalPending: number
    avgAge: number
    hotCount: number
    warmCount: number
    coolingOrOlderCount: number
    urgency: 'High' | 'Medium' | 'Low'
  }>
}

export function CourseAgingTable({ coursesAging }: CourseAgingTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h4 className="text-base font-bold text-slate-800">Course Pending Aging Metrics</h4>
          <p className="text-xs text-slate-400">Courses with the oldest outstanding pending pipelines (requires re-allocation)</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
              <th className="py-3.5 px-6">Course</th>
              <th className="py-3.5 px-6 text-center">Total Pending</th>
              <th className="py-3.5 px-6 text-center">Avg Age</th>
              <th className="py-3.5 px-6 text-center text-emerald-600">🔥 &lt; 7 Days</th>
              <th className="py-3.5 px-6 text-center text-blue-600">⚡ 7-30 Days</th>
              <th className="py-3.5 px-6 text-center text-slate-500">🔴 &gt; 30 Days</th>
              <th className="py-3.5 px-6 text-center">Urgency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {coursesAging.map((c) => (
              <tr key={c.course} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-bold text-slate-800">{c.course}</td>
                <td className="py-4 px-6 text-center">{c.totalPending}</td>
                <td className="py-4 px-6 text-center">{Math.round(c.avgAge)} days</td>
                <td className="py-4 px-6 text-center text-emerald-600 font-bold">{c.hotCount}</td>
                <td className="py-4 px-6 text-center text-blue-600">{c.warmCount}</td>
                <td className="py-4 px-6 text-center text-slate-400">{c.coolingOrOlderCount}</td>
                <td className="py-4 px-6 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    c.urgency === 'High' ? 'bg-red-50 text-red-600' :
                    c.urgency === 'Medium' ? 'bg-yellow-50 text-yellow-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    {c.urgency === 'High' ? '🔴 High' : c.urgency === 'Medium' ? '🟡 Medium' : '🟢 Low'}
                  </span>
                </td>
              </tr>
            ))}
            {coursesAging.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">No pending leads matching criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface ActionPanelProps {
  hotCount: number
  warmCount: number
  coolingCount: number
  coldCount: number
  deadCount: number
}

export function ActionPanel({ hotCount, warmCount, coolingCount, coldCount, deadCount }: ActionPanelProps) {
  return (
    <div className="bg-slate-950 text-slate-100 p-6 rounded-2xl shadow-xl border border-slate-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-indigo-400">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-base font-bold">Recommended Salvaging Actions</h4>
          <p className="text-xs text-slate-400">Operations-level playbook for lead decay recovery</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-900 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs font-bold text-slate-200">🔥 Hot Bucket</span>
          </div>
          <p className="text-2xl font-black text-white">{hotCount}</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Assign immediately to top-performing agents. Aim for &lt;30m first-dial.
          </p>
        </div>

        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-900 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <span className="text-xs font-bold text-slate-200">⚡ Warm Bucket</span>
          </div>
          <p className="text-2xl font-black text-white">{warmCount}</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Run automated email nurturing campaign while agents complete follow-ups.
          </p>
        </div>

        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-900 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shrink-0" />
            <span className="text-xs font-bold text-slate-200">🟡 Cooling Bucket</span>
          </div>
          <p className="text-2xl font-black text-white">{coolingCount}</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Send WhatsApp re-engagement blast offering 10% off batch bookings.
          </p>
        </div>

        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-900 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
            <span className="text-xs font-bold text-slate-200">🔴 Cold Bucket</span>
          </div>
          <p className="text-2xl font-black text-white">{coldCount}</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Deploy generic brochure download WhatsApp flows + last-attempt dialer.
          </p>
        </div>

        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-900 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
            <span className="text-xs font-bold text-slate-200">⚫ Dead Bucket</span>
          </div>
          <p className="text-2xl font-black text-white">{deadCount}</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Archive. Stop calling. Move to bulk quarterly SMS newsletter.
          </p>
        </div>
      </div>
    </div>
  )
}

export function StatusMappingGuide() {
  const categories = [
    {
      title: 'High Potential',
      description: 'Active leads showing high interest/engagement. Tracked in aging buckets.',
      badge: '⏱️ Aging Calculated',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      icon: <Flame className="w-4 h-4 text-emerald-500" />,
      borderColor: 'border-emerald-100 hover:border-emerald-300 bg-emerald-50/10 hover:bg-emerald-50/20',
      tagColor: 'bg-white text-emerald-700 border-emerald-100/60 hover:bg-emerald-50/30',
      statuses: [
        'Interested to join the Demo',
        'Potential Lead 100',
        'Demo Attended',
        '60-80 Potential'
      ]
    },
    {
      title: 'Medium Potential',
      description: 'Active leads with moderate intent or waiting for next batch. Tracked in aging buckets.',
      badge: '⏱️ Aging Calculated',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/60',
      icon: <Zap className="w-4 h-4 text-blue-500" />,
      borderColor: 'border-blue-100 hover:border-blue-300 bg-blue-50/10 hover:bg-blue-50/20',
      tagColor: 'bg-white text-blue-700 border-blue-100/60 hover:bg-blue-50/30',
      statuses: [
        'Looking for Next batch',
        '50 % Potential',
        'below 50 % Potential'
      ]
    },
    {
      title: 'Fresh / Unqualified',
      description: 'New or non-responsive leads requiring active contact. Tracked in aging buckets.',
      badge: '⏱️ Aging Calculated',
      badgeColor: 'bg-yellow-50 text-yellow-700 border-yellow-200/60',
      icon: <Clock className="w-4 h-4 text-yellow-600" />,
      borderColor: 'border-yellow-100 hover:border-yellow-300 bg-yellow-50/10 hover:bg-yellow-50/20',
      tagColor: 'bg-white text-yellow-700 border-yellow-100/60 hover:bg-yellow-50/30',
      statuses: [
        'Fresh',
        'Call not answered and Shared the Data',
        'Number is not working and sent an email'
      ]
    },
    {
      title: 'Dead / Junk',
      description: 'Disqualified or junk leads that remain open. Sits in aging pool but bypasses aging timers.',
      badge: '🚨 Forced to Dead Bucket',
      badgeColor: 'bg-red-50 text-red-700 border-red-200/60',
      icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
      borderColor: 'border-red-100 hover:border-red-300 bg-red-50/10 hover:bg-red-50/20',
      tagColor: 'bg-white text-red-700 border-red-100/60 hover:bg-red-50/30',
      statuses: [
        'Junk Lead'
      ]
    },
    {
      title: 'Excluded Statuses',
      description: 'Enrolled (won) or permanently closed leads. Excluded entirely from the decay & aging analysis.',
      badge: '🚫 Excluded from Aging',
      badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: <Archive className="w-4 h-4 text-slate-500" />,
      borderColor: 'border-slate-200/60 hover:border-slate-350 bg-slate-50/40 hover:bg-slate-50/60',
      tagColor: 'bg-white text-slate-500 border-slate-200/60 hover:bg-slate-100/30',
      statuses: [
        'Enrolled',
        'Not Interested',
        'Different Course',
        'Wrong Number &Number Not working',
        'Lost'
      ]
    }
  ]

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div>
        <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span>🔍 TeleCRM Status Mapping Guide</span>
        </h4>
        <p className="text-xs text-slate-400 mt-0.5">
          Reference list of how status labels from TeleCRM are categorized to build the Lead Aging pipeline.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {categories.map((c, idx) => (
          <div 
            key={idx} 
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-4 ${c.borderColor}`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  {c.icon}
                  {c.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {c.description}
              </p>
              <div className="pt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${c.badgeColor}`}>
                  {c.badge}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">
                Mapped Statuses ({c.statuses.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {c.statuses.map((s, sIdx) => (
                  <span 
                    key={sIdx} 
                    className={`inline-block px-2 py-1 rounded text-[10px] font-bold border transition-colors shadow-sm ${c.tagColor}`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

