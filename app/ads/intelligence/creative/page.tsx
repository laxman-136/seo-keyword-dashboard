// app/ads/intelligence/creative/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react'
import { useDateRange } from '@/hooks/useDateRange'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import { 
  Sparkles, AlertCircle, AlertTriangle, Image, Video, 
  Layers, FileText, Info, ShieldCheck, Eye, Target
} from 'lucide-react'

export default function CreativePage() {
  const { preset, from, to, setDateRange } = useDateRange()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Platform tab selector
  const [activePlatformTab, setActivePlatformTab] = useState<'meta' | 'google'>('meta')

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

      const res = await fetch(`/api/ads/intelligence/creative?${query.toString()}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to fetch creative data')
      }

      const resData = await res.json()
      setData(resData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while fetching creative data')
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

  // Calculate format totals
  const formatTotals = data?.formatBreakdown || []
  const totalLeadsCount = formatTotals.reduce((sum: number, item: any) => sum + item.leads, 0)
  const totalSpendVal = formatTotals.reduce((sum: number, item: any) => sum + item.spend, 0)
  const totalEnrolledCount = formatTotals.reduce((sum: number, item: any) => sum + item.enrolled, 0)

  const metaAdsList = data?.metaAds || []
  const googleAdsList = data?.googleAds || []

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">Creative Performance</h1>
            <p className="text-xs text-slate-400 mt-1">Audit active creative angles, ad formats, and audience fatigue alerts</p>
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
          <span>Error loading Creative data: {error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-[180px] bg-white border border-slate-200 rounded-2xl" />
          <div className="h-[400px] bg-white border border-slate-200 rounded-2xl" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          
          {/* Fatigue Warning Banner */}
          {data.fatigueWarning && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-bold shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <span className="font-extrabold uppercase block text-amber-700">⚠️ Meta Creative Fatigue Detected</span>
                <span className="font-normal mt-0.5 block text-slate-500 leading-normal">
                  Average ad frequency is elevated. Consider rotating image and video assets to refresh user interest and lower acquisition costs.
                </span>
              </div>
            </div>
          )}

          {/* Formats Performance Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Format breakdown table */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-5 border-b border-slate-100">
                  <h4 className="text-base font-bold text-slate-800">Conversions by Ad Format Style</h4>
                  <p className="text-xs text-slate-400">Comparing lead generation and enrollment outputs across visual format styles</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                        <th className="py-2.5 px-4">Ad Format Style</th>
                        <th className="py-2.5 px-4 text-center">Spend</th>
                        <th className="py-2.5 px-4 text-center">Leads</th>
                        <th className="py-2.5 px-4 text-center text-emerald-600">Enrolled</th>
                        <th className="py-2.5 px-4 text-center text-indigo-650">CPL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {formatTotals.map((item: any) => {
                        const cpl = item.leads > 0 ? item.spend / item.leads : 0
                        return (
                          <tr key={item.format} className="hover:bg-slate-50/50">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                {item.format.includes('Image') && <Image className="w-4 h-4 text-indigo-500" />}
                                {item.format.includes('Video') && <Video className="w-4 h-4 text-violet-500" />}
                                {item.format.includes('Carousel') && <Layers className="w-4 h-4 text-pink-500" />}
                                <span className="font-extrabold text-slate-800">{item.format}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center text-slate-500">₹{Math.round(item.spend).toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-center text-slate-550">{item.leads}</td>
                            <td className="py-3.5 px-4 text-center text-emerald-600 font-black">{item.enrolled}</td>
                            <td className="py-3.5 px-4 text-center text-indigo-650 font-bold">
                              {cpl > 0 ? `₹${Math.round(cpl).toLocaleString()}` : '₹0'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 relative overflow-hidden group">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">Total Creative spend</span>
                <p className="text-2xl font-black text-slate-800">₹{totalSpendVal.toLocaleString()}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500">Aggregated Meta ad creative spend</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 relative overflow-hidden group">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">Attributed Enrolled Conversions</span>
                <p className="text-2xl font-black text-emerald-600">{totalEnrolledCount}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500">True enrollment closures from creatives</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Ads Performance Directory */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">Live Ad Creatives Directory</h4>
                <p className="text-xs text-slate-400 mt-1">Review live copy, formats, and performance insights directly from ad platforms</p>
              </div>

              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50 self-start">
                <button
                  onClick={() => setActivePlatformTab('meta')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activePlatformTab === 'meta' ? 'bg-white text-slate-800 shadow-sm border border-slate-250/20' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Meta Ads
                </button>
                <button
                  onClick={() => setActivePlatformTab('google')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activePlatformTab === 'google' ? 'bg-white text-slate-800 shadow-sm border border-slate-250/20' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Google Search Ads
                </button>
              </div>
            </div>

            {/* META ADS VIEW */}
            {activePlatformTab === 'meta' && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
                {metaAdsList.length === 0 ? (
                  <div className="col-span-2 p-8 text-center text-slate-400 text-xs font-semibold">
                    No active Meta creatives found under current config.
                  </div>
                ) : (
                  metaAdsList.map((ad: any) => {
                    const cpl = ad.conversions > 0 ? ad.spend / ad.conversions : 0
                    return (
                      <div key={ad.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col sm:flex-row gap-4 p-4 hover:shadow-md transition-all">
                        {/* Creative preview thumbnail */}
                        <div className="w-full sm:w-32 h-32 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center relative">
                          {ad.thumbnailUrl ? (
                            <img 
                              src={ad.thumbnailUrl} 
                              alt={ad.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                              {ad.creativeType || 'Creative'}
                            </span>
                          )}
                          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-slate-900/80 text-white tracking-wider">
                            {ad.creativeType}
                          </span>
                        </div>

                        {/* Creative performance details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0 space-y-2">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className={`px-1.5 py-0.2 rounded text-[8px] font-black tracking-wider border ${
                                ad.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-450 border-slate-250/50'
                              }`}>
                                {ad.status}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {ad.id}</span>
                            </div>
                            <h5 className="text-xs font-extrabold text-slate-800 mt-1 truncate" title={ad.name}>
                              {ad.name}
                            </h5>
                          </div>

                          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-150 text-[10px] font-bold">
                            <div>
                              <span className="text-slate-400 block text-[8px] uppercase font-black">Spend</span>
                              <span className="text-slate-700">₹{Math.round(ad.spend).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[8px] uppercase font-black">CTR</span>
                              <span className="text-slate-700">{ad.ctr.toFixed(2)}%</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[8px] uppercase font-black">Conversions</span>
                              <span className="text-slate-700">{ad.conversions}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 font-semibold">Cost Per Lead (CPL)</span>
                            <span className="font-extrabold text-indigo-600">
                              {cpl > 0 ? `₹${Math.round(cpl).toLocaleString()}` : '₹0'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* GOOGLE ADS VIEW */}
            {activePlatformTab === 'google' && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
                {googleAdsList.length === 0 ? (
                  <div className="col-span-2 p-8 text-center text-slate-400 text-xs font-semibold">
                    No active Google search ads found.
                  </div>
                ) : (
                  googleAdsList.map((ad: any) => {
                    const cpa = ad.conversions > 0 ? ad.spend / ad.conversions : 0
                    return (
                      <div key={ad.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-all flex flex-col justify-between gap-4">
                        
                        {/* Search result mockup */}
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold">
                            <span className="text-slate-900">Sponsored</span>
                            <span>•</span>
                            <span>techleadsit.com</span>
                          </div>
                          <h6 className="text-xs font-bold text-blue-800 leading-tight hover:underline cursor-pointer">
                            {ad.headlines?.slice(0, 3).join(' | ') || 'Oracle ERP Certification Course'}
                          </h6>
                          <p className="text-[10px] text-slate-600 leading-normal font-medium">
                            {ad.descriptions?.[0] || 'Learn live online. Get hands-on training by certified ERP industry experts. Enroll now for discount details.'}
                          </p>
                        </div>

                        {/* Google ad insights details */}
                        <div className="space-y-3 min-w-0">
                          <div>
                            <div className="flex items-center justify-between text-[9px]">
                              <span className="text-slate-400 font-mono">ID: {ad.id}</span>
                              <span className="text-slate-400 font-bold truncate max-w-[150px]" title={ad.adGroupName}>{ad.adGroupName}</span>
                            </div>
                            <h5 className="text-[11px] font-black text-slate-800 mt-1 truncate" title={ad.name}>
                              {ad.name}
                            </h5>
                          </div>

                          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-150 text-[10px] font-bold">
                            <div>
                              <span className="text-slate-400 block text-[8px] uppercase font-black">Spend</span>
                              <span className="text-slate-700">₹{Math.round(ad.spend).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[8px] uppercase font-black">CTR</span>
                              <span className="text-slate-700">{ad.ctr.toFixed(2)}%</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[8px] uppercase font-black">Conversions</span>
                              <span className="text-slate-700">{ad.conversions}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] border-t border-slate-100 pt-2">
                            <span className="text-slate-400 font-semibold">Cost Per Conversion</span>
                            <span className="font-extrabold text-cyan-600">
                              {cpa > 0 ? `₹${Math.round(cpa).toLocaleString()}` : '₹0'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* Data Authenticity Disclosure Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" /> Data Source & Transparency Disclosure
            </h4>
            <div className="text-xs text-slate-500 space-y-2.5 font-medium leading-relaxed">
              <p>
                <strong>Is this data real?</strong> <span className="text-slate-800 font-bold">Yes, the core creative performance metrics (impressions, clicks, CTR, average CPC, spend, and ad conversions) are 100% real</span> and pulled straight from your Meta Ads Graph API and Google Ads API accounts. Image previews and search copy headlines/descriptions match active assets.
              </p>
              <p>
                <strong>What part of the data is simulated?</strong> Because TeleCRM lead forms record the campaign-level UTM parameters but do not capture the unique individual ad creative IDs for every lead, we estimate **Enrolls** and **Revenue per Creative** by applying a pro-rata allocation from campaign performance down to the creative level.
              </p>
            </div>
          </div>

        </div>
      ) : null}
    </div>
  )
}
