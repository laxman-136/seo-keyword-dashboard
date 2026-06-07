// components/leads/intelligence/SourceQualityComponents.tsx
import React from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { Award, Star, TrendingUp } from 'lucide-react'

interface SourceQualityRankingProps {
  leaderboard: Array<{
    source: string
    totalLeads: number
    convRate: number
    revenue: number
    avgFee: number
    score: number
    stars: number
  }>
}

export function SourceQualityRanking({ leaderboard }: SourceQualityRankingProps) {
  const MEDAL_COLORS = ['#f59e0b', '#94a3b8', '#b45309']
  const CHANNEL_COLORS: Record<string, string> = {
    'Referral': '#10b981',
    'Organic': '#6366f1',
    'Google Ads': '#3b82f6',
    'Meta Ads': '#f59e0b',
    'Website': '#8b5cf6',
    'SOT': '#06b6d4',
    'Other': '#94a3b8',
  }

  return (
    <div className="space-y-3">
      {leaderboard.map((item, idx) => (
        <div
          key={item.source}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4 flex-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-extrabold shadow-sm shrink-0"
              style={{ backgroundColor: idx < 3 ? `${MEDAL_COLORS[idx]}20` : '#f8fafc', color: idx < 3 ? MEDAL_COLORS[idx] : '#64748b', border: `1.5px solid ${idx < 3 ? MEDAL_COLORS[idx] + '40' : '#e2e8f0'}` }}
            >
              {idx < 3 ? ['🥇','🥈','🥉'][idx] : `#${idx+1}`}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHANNEL_COLORS[item.source] || '#94a3b8' }} />
                <h4 className="text-sm font-extrabold text-slate-800">{item.source}</h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{item.totalLeads} total leads · ₹{(item.revenue/100000).toFixed(1)}L revenue</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Conv Rate</p>
              <p className="text-lg font-extrabold text-indigo-600">{item.convRate.toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Quality Score</p>
              <p className="text-lg font-extrabold text-slate-800">{item.score}/100</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Rating</p>
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= item.stars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                ))}
              </div>
            </div>
            <div className="w-20">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500" style={{ width: `${item.score}%` }} />
              </div>
              <p className="text-[9px] text-slate-400 font-bold mt-1 text-center">{item.score}% quality</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface QualityVolumeScatterProps {
  scatterData: Array<{ name: string; volume: number; convRate: number; revenue: number; score: number }>
}

export function QualityVolumeScatter({ scatterData }: QualityVolumeScatterProps) {
  const SCATTER_COLORS = ['#10b981','#6366f1','#3b82f6','#f59e0b','#8b5cf6','#06b6d4','#94a3b8']
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="mb-4">
        <h4 className="text-base font-bold text-slate-800">Volume vs Conversion Rate — Source Bubble Map</h4>
        <p className="text-xs text-slate-400">Bubble size = revenue. Ideal sources are top-right (high volume + high conv rate)</p>
      </div>
      <div className="min-h-[340px]">
        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="volume" name="Volume" stroke="#94a3b8" fontSize={11}
              label={{ value: 'Lead Volume', position: 'insideBottom', offset: -15, fill: '#64748b', fontSize: 11 }} />
            <YAxis dataKey="convRate" name="Conv Rate" unit="%" stroke="#94a3b8" fontSize={11}
              label={{ value: 'Conversion Rate (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
            <ZAxis dataKey="revenue" range={[60, 800]} name="Revenue" />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              formatter={(value: any, name?: any) => {
                if (name === 'Conv Rate') return [`${value}%`, name]
                if (name === 'Revenue') return [`₹${value}L`, name]
                return [value, name]
              }}
            />
            <Scatter name="Sources" data={scatterData}>
              {scatterData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={SCATTER_COLORS[index % SCATTER_COLORS.length]} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {scatterData.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SCATTER_COLORS[i % SCATTER_COLORS.length] }} />
            {d.name}
          </div>
        ))}
      </div>
    </div>
  )
}
