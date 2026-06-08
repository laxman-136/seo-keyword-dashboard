// app/ads/intelligence/attribution/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react'
import { useDateRange } from '@/hooks/useDateRange'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import { 
  Compass, AlertCircle, HelpCircle, Users, DollarSign, 
  TrendingUp, Info, ShieldCheck, ArrowRight, Layers
} from 'lucide-react'

export default function AttributionPage() {
  const { preset, from, to, setDateRange } = useDateRange()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Selected attribution model
  const [activeModel, setActiveModel] = useState<'firstTouch' | 'lastTouch' | 'linear'>('linear')

  const fetchData = useCallback(async (bypassCache = false) => {
    try {
      if (bypassCache) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const query = new URLSearchParams({ preset })
      if (preset === 'custom' && from && to) {
        query.set('from', from)
        query.set('to', to)
      }
      if (bypassCache) {
        query.set('refresh', 'true')
      }

      const res = await fetch(`/api/ads/intelligence/attribution?${query.toString()}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to fetch attribution data')
      }

      const resData = await res.json()
      setData(resData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while fetching attribution data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [preset, from, to])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    fetchData(true)
  }

  // Model details for documentation helper
  const modelExplainer = {
    firstTouch: {
      title: 'First-Touch Attribution Model',
      description: 'Credits 100% of the enrollment and revenue to the very first click the student made (discovery). This highlights which campaigns are driving initial awareness and filling the top of your funnel.',
      iconColor: 'text-indigo-500'
    },
    lastTouch: {
      title: 'Last-Touch Attribution Model',
      description: 'Credits 100% of the enrollment and revenue to the final converting click before they submitted their lead details. This shows which campaigns are direct response closers.',
      iconColor: 'text-cyan-500'
    },
    linear: {
      title: 'Linear (Even Split) Attribution Model',
      description: 'Distributes credit equally across all touchpoints (e.g., if a student touched Meta Ads first and Google Ads last, each receives 50% credit). Best for understanding overall campaign contribution.',
      iconColor: 'text-emerald-500'
    }
  }

  const mapChannelName = (channel: string) => {
    const map: Record<string, string> = {
      meta: 'Meta Ads',
      google: 'Google Ads',
      organic: 'Organic Search',
      direct: 'Direct Traffic',
      referral: 'Referral Link',
      unknown: 'Other / Direct'
    }
    return map[channel] || channel
  }

  // Calculate stats based on active model
  const activeModelStats = data?.models ? data.models[activeModel] : []

  // Calculate Paid attributed summary
  let paidAttributedRevenue = 0
  let paidAttributedEnrolls = 0
  let paidAttributedLeads = 0

  if (activeModelStats) {
    activeModelStats.forEach((ch: any) => {
      if (ch.channel === 'meta' || ch.channel === 'google') {
        paidAttributedRevenue += ch.revenue
        paidAttributedEnrolls += ch.enrolled
        paidAttributedLeads += ch.leads
      }
    })
  }

  const totalSpend = data?.summary?.totalSpend || 0
  const paidROAS = totalSpend > 0 ? paidAttributedRevenue / totalSpend : 0

  // Calculate multi-touch percentage
  const multiTouchCount = data?.journeys?.filter((j: any) => j.totalTouchpoints > 1).length || 0
  const totalJourneys = data?.journeys?.length || 1
  const multiTouchRate = (multiTouchCount / totalJourneys) * 100

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">Cross-Platform Attribution</h1>
            <p className="text-xs text-slate-400 mt-1">Multi-touch path analysis highlighting interactions between Meta, Google, and direct traffic</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker />
          <RefreshBar
            loading={loading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>Error loading Attribution data: {error}</span>
        </div>
      )}

      {/* Model Selector Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider shrink-0">Attribution Model:</span>
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50 w-full sm:w-auto">
            <button
              onClick={() => setActiveModel('linear')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeModel === 'linear' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Linear Split
            </button>
            <button
              onClick={() => setActiveModel('firstTouch')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeModel === 'firstTouch' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              First-Touch
            </button>
            <button
              onClick={() => setActiveModel('lastTouch')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeModel === 'lastTouch' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Last-Touch
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
          <Info className="w-4 h-4 text-indigo-500" />
          <span>Model updates leads allocation parameters instantly.</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-24 bg-white border border-slate-200 rounded-2xl" />
            <div className="h-24 bg-white border border-slate-200 rounded-2xl" />
            <div className="h-24 bg-white border border-slate-200 rounded-2xl" />
            <div className="h-24 bg-white border border-slate-200 rounded-2xl" />
          </div>
          <div className="h-[350px] bg-white border border-slate-200 rounded-2xl" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          
          {/* Summary KPIs Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-450">Paid Channels Spend</span>
                <DollarSign className="w-4.5 h-4.5 text-indigo-500" />
              </div>
              <p className="text-2xl font-black text-slate-800">₹{totalSpend.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 font-semibold">Total Google & Meta ad spend</p>
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-50 rounded-full filter blur-xl opacity-20 -mr-6 -mb-6 group-hover:scale-110 transition-transform"></div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-450">Attributed Paid Revenue</span>
                <TrendingUp className="w-4.5 h-4.5 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600">₹{paidAttributedRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 font-semibold">Attributed fee from enrolled users</p>
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-50 rounded-full filter blur-xl opacity-20 -mr-6 -mb-6 group-hover:scale-110 transition-transform"></div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-450">True Paid ROAS</span>
                <Compass className="w-4.5 h-4.5 text-indigo-500" />
              </div>
              <p className="text-2xl font-black text-slate-850">{paidROAS.toFixed(2)}x</p>
              <p className="text-[10px] text-slate-400 font-semibold">
                {paidROAS >= 1 ? 'Profitable (Revenue > Spend)' : 'Unprofitable (Spend > Revenue)'}
              </p>
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-50 rounded-full filter blur-xl opacity-20 -mr-6 -mb-6 group-hover:scale-110 transition-transform"></div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-450">Multi-Touch Journey Rate</span>
                <Users className="w-4.5 h-4.5 text-cyan-500" />
              </div>
              <p className="text-2xl font-black text-slate-800">{multiTouchRate.toFixed(1)}%</p>
              <p className="text-[10px] text-slate-400 font-semibold">Leads touching both Meta & Google</p>
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-cyan-50 rounded-full filter blur-xl opacity-20 -mr-6 -mb-6 group-hover:scale-110 transition-transform"></div>
            </div>
          </div>

          {/* Model Description Widget */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-start gap-3">
            <Info className={`w-5 h-5 shrink-0 mt-0.5 ${modelExplainer[activeModel].iconColor}`} />
            <div>
              <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider">{modelExplainer[activeModel].title}</h4>
              <p className="text-xs text-slate-500 mt-1 leading-normal font-medium">{modelExplainer[activeModel].description}</p>
            </div>
          </div>

          {/* Channel Performance Split Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-bold text-slate-800">Channel Value Split Summary</h4>
                <p className="text-xs text-slate-400 mt-1">Lead volume, enrollments, and true revenue splits attributed by model criteria</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 border border-indigo-100">
                Model: {activeModel}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                    <th className="py-3 px-5">Acquisition Channel</th>
                    <th className="py-3 px-5 text-center">Spend</th>
                    <th className="py-3 px-5 text-center">Attributed Leads</th>
                    <th className="py-3 px-5 text-center">Attributed Enrolls</th>
                    <th className="py-3 px-5 text-center">Attributed Revenue</th>
                    <th className="py-3 px-5 text-center text-indigo-600">True CPL</th>
                    <th className="py-3 px-5 text-center text-emerald-600">True CPE</th>
                    <th className="py-3 px-5 text-center">True ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {activeModelStats.map((item: any) => {
                    const cpl = item.leads > 0 ? item.spend / item.leads : 0
                    const cpe = item.enrolled > 0 ? item.spend / item.enrolled : 0
                    const roas = item.spend > 0 ? item.revenue / item.spend : 0
                    const isPaidChannel = item.channel === 'meta' || item.channel === 'google'

                    return (
                      <tr key={item.channel} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-5">
                          <span className="font-extrabold text-slate-800">{mapChannelName(item.channel)}</span>
                        </td>
                        <td className="py-3.5 px-5 text-center text-slate-500">
                          {isPaidChannel ? `₹${item.spend.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-5 text-center text-slate-600 font-bold">{item.leads}</td>
                        <td className="py-3.5 px-5 text-center text-slate-800 font-extrabold">{item.enrolled}</td>
                        <td className="py-3.5 px-5 text-center text-slate-700">₹{item.revenue.toLocaleString()}</td>
                        <td className="py-3.5 px-5 text-center text-indigo-600 font-bold">
                          {isPaidChannel && cpl > 0 ? `₹${Math.round(cpl).toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-5 text-center text-emerald-600 font-black">
                          {isPaidChannel && cpe > 0 ? `₹${Math.round(cpe).toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          {isPaidChannel ? (
                            <span className={`px-2 py-0.5 rounded-full font-bold ${
                              roas >= 1.5 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {roas.toFixed(2)}x
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Conversion Paths & Logs Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Conversion Path Frequencies */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">Conversion Path Frequencies</h4>
                <p className="text-xs text-slate-400 mt-1">Common multi-channel sequences leading to student enrollment</p>
              </div>
              <div className="space-y-3">
                {data.pathAssists.map((path: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 leading-normal block">{path.path}</span>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/50">
                      <span className="text-[10px] text-slate-400 font-semibold">Attributed Enrolls</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-black">{path.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Journeys Log */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h4 className="text-base font-bold text-slate-800">User Interaction Timelines</h4>
                <p className="text-xs text-slate-400">Chronological touchpoints compiled for the 50 most recent leads</p>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                      <th className="py-2.5 px-4">Lead ID</th>
                      <th className="py-2.5 px-4">Course Intent</th>
                      <th className="py-2.5 px-4 text-center">First Touch</th>
                      <th className="py-2.5 px-4 text-center">Last Touch</th>
                      <th className="py-2.5 px-4 text-center">Enrolled Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {data.journeys.map((j: any) => (
                      <tr key={j.leadId} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{j.leadId}</td>
                        <td className="py-3 px-4 text-slate-650 truncate max-w-[150px]" title={j.courseName}>{j.courseName}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded font-black capitalize text-[9px] border ${
                            j.firstTouchChannel === 'meta' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            j.firstTouchChannel === 'google' ? 'bg-cyan-50 text-cyan-700 border-cyan-100' :
                            'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>{j.firstTouchChannel}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded font-black capitalize text-[9px] border ${
                            j.lastTouchChannel === 'meta' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            j.lastTouchChannel === 'google' ? 'bg-cyan-50 text-cyan-700 border-cyan-100' :
                            'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>{j.lastTouchChannel}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            j.isEnrolled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'
                          }`}>{j.isEnrolled ? 'Enrolled' : 'Pending'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Data Authenticity Disclosure Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" /> Data Source & Transparency Disclosure
            </h4>
            <div className="text-xs text-slate-500 space-y-2.5 font-medium leading-relaxed">
              <p>
                <strong>Is this data real?</strong> <span className="text-slate-800 font-bold">Yes, the core lead volumes, campaign names, and enrollment conversion metrics are 100% real</span> if your TeleCRM API key and Enterprise ID are configured. Leads are fetched in real-time directly from your TeleCRM portal, and their status updates match CRM sales labels.
              </p>
              <p>
                <strong>What part of the data is simulated?</strong> Because CRM APIs only record the final click details (UTM tags and platform Click IDs) that are captured at the exact moment a lead submits a form, they do not retain the historical cookies or click streams of every prior website visit. 
              </p>
              <p>
                To provide you with multi-touch journey analysis, we use a heuristic mapping model:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-650">
                <li>Leads with both a Facebook Click ID (<code className="bg-slate-150 px-1 rounded">fbclid</code>) and Google Click ID (<code className="bg-slate-150 px-1 rounded">gclid</code>) stored in TeleCRM are reconstructed as multi-touch interactions, attributing discovery to Meta Ads and conversion to Google Ads.</li>
                <li>Leads with only one identifier are mapped as single-touch interactions.</li>
                <li>The <span className="font-bold">Days to Convert</span> metric is generated procedurally based on lead ID hash variations (ranging from 1 to 8 days) for illustrative purposes.</li>
              </ul>
            </div>
          </div>

        </div>
      ) : null}
    </div>
  )
}
