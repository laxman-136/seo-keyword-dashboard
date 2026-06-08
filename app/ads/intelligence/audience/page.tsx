// app/ads/intelligence/audience/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react'
import { useDateRange } from '@/hooks/useDateRange'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import { 
  Users, AlertCircle, ChevronDown, ChevronRight, Search, 
  Layers, Smartphone, Laptop, Tablet, Eye, HelpCircle, ArrowRight, DollarSign, Target
} from 'lucide-react'

export default function AudiencePage() {
  const { preset, from, to, setDateRange } = useDateRange()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tab states
  const [activeTab, setActiveTab] = useState<'explorer' | 'demographics' | 'devices'>('explorer')
  const [demoPlatformTab, setDemoPlatformTab] = useState<'meta' | 'google'>('meta')
  const [devicePlatformTab, setDevicePlatformTab] = useState<'meta' | 'google'>('meta')

  // Search & Explorer filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [explorerPlatformFilter, setExplorerPlatformFilter] = useState<'all' | 'meta' | 'google'>('all')
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({})

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

      const res = await fetch(`/api/ads/intelligence/audience?${query.toString()}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to fetch audience data')
      }

      const resData = await res.json()
      setData(resData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while fetching audience data')
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

  const toggleCampaignExpand = (campaignId: string) => {
    setExpandedCampaigns(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }))
  }

  // Filter campaigns inside the explorer
  const getFilteredCampaigns = () => {
    if (!data?.campaignExplorer) return { meta: [], google: [] }
    
    let meta = data.campaignExplorer.meta || []
    let google = data.campaignExplorer.google || []

    const q = searchQuery.toLowerCase()

    if (q) {
      meta = meta.filter((c: any) => c.name.toLowerCase().includes(q))
      google = google.filter((c: any) => c.name.toLowerCase().includes(q))
    }

    return { meta, google }
  }

  const filteredCampaigns = getFilteredCampaigns()

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">Audience Intelligence</h1>
            <p className="text-xs text-slate-400 mt-1">Map audience targeting rules, ad creatives, and student conversions across Google & Meta</p>
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
          <span>Error loading Audience data: {error}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('explorer')}
          className={`pb-3 px-4 text-sm font-extrabold transition-all border-b-2 ${
            activeTab === 'explorer'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Targeting & Ad Explorer
        </button>
        <button
          onClick={() => setActiveTab('demographics')}
          className={`pb-3 px-4 text-sm font-extrabold transition-all border-b-2 ${
            activeTab === 'demographics'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Age & Gender splits
        </button>
        <button
          onClick={() => setActiveTab('devices')}
          className={`pb-3 px-4 text-sm font-extrabold transition-all border-b-2 ${
            activeTab === 'devices'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Device Mix
        </button>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-[80px] bg-white border border-slate-200 rounded-2xl" />
          <div className="h-[400px] bg-white border border-slate-200 rounded-2xl" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          
          {/* TAB 1: TARGETING & AD EXPLORER */}
          {activeTab === 'explorer' && (
            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search campaign names..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50 self-stretch sm:self-auto">
                  <button
                    onClick={() => setExplorerPlatformFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      explorerPlatformFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    All Channels
                  </button>
                  <button
                    onClick={() => setExplorerPlatformFilter('meta')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      explorerPlatformFilter === 'meta' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Meta Ads
                  </button>
                  <button
                    onClick={() => setExplorerPlatformFilter('google')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      explorerPlatformFilter === 'google' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Google Ads
                  </button>
                </div>
              </div>

              {/* Explorer Table List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Campaign Audience & Creative Explorer</h3>
                </div>

                <div className="divide-y divide-slate-150">
                  {/* META CAMPAIGNS */}
                  {(explorerPlatformFilter === 'all' || explorerPlatformFilter === 'meta') && (
                    filteredCampaigns.meta.map((camp: any) => {
                      const isExpanded = expandedCampaigns[camp.id];
                      return (
                        <div key={camp.id} className="transition-all">
                          {/* Campaign Header Row */}
                          <div 
                            onClick={() => toggleCampaignExpand(camp.id)}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100">Meta</span>
                              <h4 className="font-extrabold text-sm text-slate-800">{camp.name}</h4>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                                Obj: {camp.objective}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full font-bold border ${
                                camp.budgetType === 'CBO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                Budget: {camp.budgetType} {camp.budget > 0 ? `(₹${Math.round(camp.budget).toLocaleString()}/day)` : '(AdSet level)'}
                              </span>
                              <span className="text-[11px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 border border-slate-150 rounded-lg">
                                {camp.adsets?.length || 0} Ad Sets
                              </span>
                            </div>
                          </div>

                          {/* Expanded Ad Sets / Ads details */}
                          {isExpanded && (
                            <div className="bg-slate-50/50 border-t border-slate-100 p-4 pl-8 space-y-4">
                              {camp.adsets?.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No Ad Sets found under this campaign.</p>
                              ) : (
                                camp.adsets.map((adset: any) => (
                                  <div key={adset.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                      <div className="flex items-center gap-2">
                                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                                        <h5 className="text-xs font-bold text-slate-800">{adset.name}</h5>
                                      </div>
                                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-black tracking-wider border ${
                                        adset.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'
                                      }`}>
                                        {adset.status}
                                      </span>
                                    </div>

                                    {/* Detailed Targeting Grid */}
                                    {adset.targeting ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                        {/* Left Column: Demographics & Custom Audiences */}
                                        <div className="space-y-4">
                                          {/* Demographics Card */}
                                          <div className="bg-white p-3 rounded-lg border border-slate-150 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                              <Users className="w-3.5 h-3.5 text-indigo-500" />
                                              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Demographic Profile</span>
                                            </div>
                                            <div className="space-y-2 text-xs">
                                              <div>
                                                <span className="text-slate-400 block text-[10px] font-bold">Locations</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                  {adset.targeting.locations && adset.targeting.locations.length > 0 ? (
                                                    adset.targeting.locations.map((loc: string, i: number) => (
                                                      <span key={i} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px] border border-indigo-100">
                                                        {loc}
                                                      </span>
                                                    ))
                                                  ) : (
                                                    <span className="text-slate-400 text-[10px] italic">All Locations</span>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="grid grid-cols-2 gap-2 pt-1">
                                                <div>
                                                  <span className="text-slate-400 block text-[10px] font-bold">Age</span>
                                                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                                                    {adset.targeting.age || 'All Ages'}
                                                  </span>
                                                </div>
                                                <div>
                                                  <span className="text-slate-400 block text-[10px] font-bold">Genders</span>
                                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                                    {adset.targeting.genders && adset.targeting.genders.length > 0 ? (
                                                      adset.targeting.genders.map((g: string, i: number) => (
                                                        <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                                                          {g}
                                                        </span>
                                                      ))
                                                    ) : (
                                                      <span className="text-slate-400 text-[10px] italic">All Genders</span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Custom Audiences Profile */}
                                          {((adset.targeting.customAudiences && adset.targeting.customAudiences.length > 0) || 
                                            (adset.targeting.excludedCustomAudiences && adset.targeting.excludedCustomAudiences.length > 0)) && (
                                            <div className="bg-white p-3 rounded-lg border border-slate-150 shadow-sm space-y-2">
                                              {adset.targeting.customAudiences && adset.targeting.customAudiences.length > 0 && (
                                                <div>
                                                  <div className="flex items-center gap-1.5 mb-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Custom Audiences</span>
                                                  </div>
                                                  <div className="flex flex-wrap gap-1">
                                                    {adset.targeting.customAudiences.map((ca: string, i: number) => (
                                                      <span key={i} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-100">
                                                        {ca}
                                                      </span>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                              {adset.targeting.excludedCustomAudiences && adset.targeting.excludedCustomAudiences.length > 0 && (
                                                <div>
                                                  <div className="flex items-center gap-1.5 mb-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Excluded Custom Audiences</span>
                                                  </div>
                                                  <div className="flex flex-wrap gap-1">
                                                    {adset.targeting.excludedCustomAudiences.map((ca: string, i: number) => (
                                                      <span key={i} className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold text-[10px] border border-rose-100">
                                                        {ca}
                                                      </span>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Placements & Devices Card */}
                                          <div className="bg-white p-3 rounded-lg border border-slate-150 shadow-sm space-y-2">
                                            <div className="flex items-center gap-2 mb-1">
                                              <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                                              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Placements & Devices</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                              <div>
                                                <span className="text-slate-400 block text-[10px] font-bold">Platforms</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                  {adset.targeting.placements && adset.targeting.placements.length > 0 ? (
                                                    adset.targeting.placements.map((p: string, i: number) => (
                                                      <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[9px] border border-slate-200">
                                                        {p}
                                                      </span>
                                                    ))
                                                  ) : (
                                                    <span className="text-slate-400 text-[10px] italic">Automatic Placements</span>
                                                  )}
                                                </div>
                                              </div>
                                              <div>
                                                <span className="text-slate-400 block text-[10px] font-bold">Devices</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                  {adset.targeting.devices && adset.targeting.devices.length > 0 ? (
                                                    adset.targeting.devices.map((d: string, i: number) => (
                                                      <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[9px] border border-slate-200">
                                                        {d}
                                                      </span>
                                                    ))
                                                  ) : (
                                                    <span className="text-slate-400 text-[10px] italic">All Devices</span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Right Column: Detailed Targeting & Exclusions */}
                                        <div className="space-y-4">
                                          {/* Detailed Targeting Card */}
                                          <div className="bg-white p-3 rounded-lg border border-slate-150 shadow-sm space-y-3">
                                            <div className="flex items-center gap-2">
                                              <Target className="w-3.5 h-3.5 text-indigo-500" />
                                              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Detailed Targeting (AND/OR)</span>
                                            </div>

                                            {adset.targeting.interests && adset.targeting.interests.length > 0 && (
                                              <div>
                                                <span className="text-slate-400 block text-[10px] font-bold mb-1">Interests</span>
                                                <div className="flex flex-wrap gap-1">
                                                  {adset.targeting.interests.map((int: string, i: number) => (
                                                    <span key={i} className="px-2 py-0.5 rounded bg-indigo-50/50 text-indigo-700 font-semibold text-[10px] border border-indigo-100/50">
                                                      {int}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {adset.targeting.behaviors && adset.targeting.behaviors.length > 0 && (
                                              <div>
                                                <span className="text-slate-400 block text-[10px] font-bold mb-1">Behaviors</span>
                                                <div className="flex flex-wrap gap-1">
                                                  {adset.targeting.behaviors.map((beh: string, i: number) => (
                                                    <span key={i} className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 font-semibold text-[10px] border border-violet-100">
                                                      {beh}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {adset.targeting.demographics && adset.targeting.demographics.length > 0 && (
                                              <div>
                                                <span className="text-slate-400 block text-[10px] font-bold mb-1">Detailed Demographics</span>
                                                <div className="flex flex-wrap gap-1">
                                                  {adset.targeting.demographics.map((dem: string, i: number) => (
                                                    <span key={i} className="px-2 py-0.5 rounded bg-pink-50 text-pink-700 font-semibold text-[10px] border border-pink-100">
                                                      {dem}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {(!adset.targeting.interests || adset.targeting.interests.length === 0) &&
                                             (!adset.targeting.behaviors || adset.targeting.behaviors.length === 0) &&
                                             (!adset.targeting.demographics || adset.targeting.demographics.length === 0) && (
                                              <span className="text-slate-400 text-xs italic">No detailed targeting segments specified.</span>
                                            )}
                                          </div>

                                          {/* Exclusions Panel */}
                                          {adset.targeting.exclusions && adset.targeting.exclusions.length > 0 && (
                                            <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-100 shadow-sm space-y-1.5">
                                              <div className="flex items-center gap-1.5 text-rose-700">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">Exclusion Criteria</span>
                                              </div>
                                              <div className="flex flex-wrap gap-1">
                                                {adset.targeting.exclusions.map((exc: string, i: number) => (
                                                  <span key={i} className="px-2 py-0.5 rounded bg-white text-rose-700 font-bold text-[10px] border border-rose-200">
                                                    {exc}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">🎯 Audience targeting parameters</p>
                                        <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1">{adset.targetingSummary || 'Default Targeting'}</p>
                                      </div>
                                    )}

                                    {/* Ad Creatives under adset */}
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">🖼️ Ad Creatives ({adset.ads?.length || 0})</p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {adset.ads?.map((ad: any) => (
                                          <div key={ad.id} className="flex gap-2.5 items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                            {ad.thumbnailUrl ? (
                                              <img 
                                                src={ad.thumbnailUrl} 
                                                alt={ad.name}
                                                className="w-12 h-12 rounded object-cover border border-slate-200 shrink-0" 
                                              />
                                            ) : (
                                              <div className="w-12 h-12 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0 uppercase">
                                                {ad.creativeType || 'Ad'}
                                              </div>
                                            )}
                                            <div className="min-w-0">
                                              <p className="text-xs font-bold text-slate-800 truncate" title={ad.name}>{ad.name}</p>
                                              <div className="flex gap-1.5 items-center mt-1">
                                                <span className="px-1 rounded text-[8px] font-black uppercase bg-indigo-50 text-indigo-600 border border-indigo-100">{ad.creativeType}</span>
                                                <span className="text-[9px] text-slate-400">{ad.status}</span>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}

                  {/* GOOGLE CAMPAIGNS */}
                  {(explorerPlatformFilter === 'all' || explorerPlatformFilter === 'google') && (
                    filteredCampaigns.google.map((camp: any) => {
                      const isExpanded = expandedCampaigns[camp.id];
                      return (
                        <div key={camp.id} className="transition-all">
                          {/* Campaign Header Row */}
                          <div 
                            onClick={() => toggleCampaignExpand(camp.id)}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-cyan-50 text-cyan-600 border border-cyan-100">Google</span>
                              <h4 className="font-extrabold text-sm text-slate-800">{camp.name}</h4>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                                Type: {camp.type}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                                Bidding: {camp.biddingStrategy} {camp.budget > 0 ? `(₹${Math.round(camp.budget).toLocaleString()}/day)` : ''}
                              </span>
                              <span className="text-[11px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 border border-slate-150 rounded-lg">
                                {camp.adGroups?.length || 0} Ad Groups
                              </span>
                            </div>
                          </div>

                          {/* Expanded Ad Groups details */}
                          {isExpanded && (
                            <div className="bg-slate-50/50 border-t border-slate-100 p-4 pl-8 space-y-4">
                              {camp.adGroups?.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No Ad Groups found under this campaign.</p>
                              ) : (
                                camp.adGroups.map((adg: any) => (
                                  <div key={adg.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                      <div className="flex items-center gap-2">
                                        <Layers className="w-3.5 h-3.5 text-cyan-500" />
                                        <h5 className="text-xs font-bold text-slate-800">{adg.name}</h5>
                                      </div>
                                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-black tracking-wider border bg-emerald-50 text-emerald-600 border-emerald-100`}>
                                        {adg.status}
                                      </span>
                                    </div>

                                    {/* Detailed Google Targeting Grid */}
                                    {adg.targeting ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                        {/* Left Column: Keywords */}
                                        <div className="space-y-4">
                                          <div className="bg-white p-3 rounded-lg border border-slate-150 shadow-sm space-y-2">
                                            <div className="flex items-center gap-2">
                                              <Target className="w-3.5 h-3.5 text-cyan-500" />
                                              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Keywords Targeting</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                                              {adg.targeting.keywords && adg.targeting.keywords.length > 0 ? (
                                                adg.targeting.keywords.map((kw: string, i: number) => (
                                                  <span key={i} className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-semibold text-[10px] border border-cyan-100">
                                                    {kw}
                                                  </span>
                                                ))
                                              ) : (
                                                <span className="text-slate-400 text-xs italic">No keywords specified (Audience expansion active)</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Right Column: Demographics & Placements */}
                                        <div className="space-y-4">
                                          {/* Demographics Card */}
                                          <div className="bg-white p-3 rounded-lg border border-slate-150 shadow-sm space-y-2">
                                            <div className="flex items-center gap-2">
                                              <Users className="w-3.5 h-3.5 text-cyan-500" />
                                              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Demographics</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                              <div>
                                                <span className="text-slate-400 block text-[10px] font-bold">Age Ranges</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                  {adg.targeting.ageRanges && adg.targeting.ageRanges.length > 0 ? (
                                                    adg.targeting.ageRanges.map((age: string, i: number) => (
                                                      <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                                                        {age}
                                                      </span>
                                                    ))
                                                  ) : (
                                                    <span className="text-slate-400 text-[10px] italic">All Ages</span>
                                                  )}
                                                </div>
                                              </div>
                                              <div>
                                                <span className="text-slate-400 block text-[10px] font-bold">Genders</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                  {adg.targeting.genders && adg.targeting.genders.length > 0 ? (
                                                    adg.targeting.genders.map((gen: string, i: number) => (
                                                      <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                                                        {gen}
                                                      </span>
                                                    ))
                                                  ) : (
                                                    <span className="text-slate-400 text-[10px] italic">All Genders</span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Placements Card */}
                                          {adg.targeting.placements && adg.targeting.placements.length > 0 && (
                                            <div className="bg-white p-3 rounded-lg border border-slate-150 shadow-sm space-y-2">
                                              <div className="flex items-center gap-2">
                                                <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                                                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Placements & Channels</span>
                                              </div>
                                              <div className="flex flex-wrap gap-1">
                                                {adg.targeting.placements.map((p: string, i: number) => (
                                                  <span key={i} className="px-2 py-0.5 rounded bg-slate-50 text-slate-600 font-semibold text-[10px] border border-slate-150">
                                                    {p}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">🎯 Keywords targeting parameters</p>
                                        <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1">{adg.targetingSummary}</p>
                                      </div>
                                    )}

                                    {/* Google Ads preview */}
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">🖼️ Google Search Ads ({adg.ads?.length || 0})</p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {adg.ads?.map((ad: any) => (
                                          <div key={ad.id} className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                                            {/* Google Search Result Preview Mode */}
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                              <span className="font-bold text-slate-900">Sponsored</span>
                                              <span>•</span>
                                              <span>techleadsit.com</span>
                                            </div>
                                            
                                            {/* Headlines */}
                                            <h6 className="text-sm font-bold text-blue-800 leading-tight hover:underline cursor-pointer">
                                              {ad.headlines?.slice(0, 3).join(' | ') || 'Oracle ERP Online Training Course'}
                                            </h6>
                                            
                                            {/* Descriptions */}
                                            <p className="text-xs text-slate-600 leading-normal">
                                              {ad.descriptions?.[0] || 'Enroll in live online Cloud certification training by industry experts. Placement support and study materials.'}
                                            </p>
                                            
                                            <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[9px] font-semibold text-slate-400">
                                              <span>Type: Responsive Search Ad</span>
                                              <span className="capitalize">{ad.status.toLowerCase()}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}

                  {filteredCampaigns.meta.length === 0 && filteredCampaigns.google.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                      No campaigns found matching search criteria.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AGE & GENDER SPLITS */}
          {activeTab === 'demographics' && (
            <div className="space-y-6">
              {/* Demographics Tab Controls */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50 self-start w-fit">
                <button
                  onClick={() => setDemoPlatformTab('meta')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    demoPlatformTab === 'meta' ? 'bg-white text-slate-800 shadow-sm border border-slate-250/20' : 'text-slate-500'
                  }`}
                >
                  Meta Ads Demographics
                </button>
                <button
                  onClick={() => setDemoPlatformTab('google')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    demoPlatformTab === 'google' ? 'bg-white text-slate-800 shadow-sm border border-slate-250/20' : 'text-slate-500'
                  }`}
                >
                  Google Ads Demographics
                </button>
              </div>

              {/* Demographics Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-800">
                      {demoPlatformTab === 'meta' ? 'Meta Ads Demographics' : 'Google Ads Demographics'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">Acquisition spend, CRM leads, and enrolled students broken down by age & gender</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                    demoPlatformTab === 'meta' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-cyan-50 text-cyan-600 border border-cyan-100'
                  }`}>
                    {demoPlatformTab === 'meta' ? 'Meta' : 'Google'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                        <th className="py-3 px-5">Demographic Group</th>
                        <th className="py-3 px-5 text-center">Spend</th>
                        <th className="py-3 px-5 text-center">CRM Leads</th>
                        <th className="py-3 px-5 text-center text-indigo-600">Cost Per Lead (CPL)</th>
                        <th className="py-3 px-5 text-center text-emerald-600">Enrolled</th>
                        <th className="py-3 px-5 text-center">Enrollment Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {(demoPlatformTab === 'meta' ? data.metaDemographics : data.googleDemographics).map((item: any) => {
                        const cpl = item.leads > 0 ? item.spend / item.leads : 0
                        const convRate = item.leads > 0 ? (item.enrolled / item.leads) * 100 : 0
                        return (
                          <tr key={item.group} className="hover:bg-slate-50/50">
                            <td className="py-3.5 px-5 text-slate-800 font-extrabold">{item.group}</td>
                            <td className="py-3.5 px-5 text-center text-slate-500">₹{Math.round(item.spend).toLocaleString()}</td>
                            <td className="py-3.5 px-5 text-center text-slate-600 font-bold">{item.leads}</td>
                            <td className="py-3.5 px-5 text-center text-indigo-600 font-bold">
                              {cpl > 0 ? `₹${Math.round(cpl).toLocaleString()}` : '₹0'}
                            </td>
                            <td className="py-3.5 px-5 text-center text-emerald-600 font-black">{item.enrolled}</td>
                            <td className="py-3.5 px-5 text-center">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                                {convRate.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEVICE MIX */}
          {activeTab === 'devices' && (
            <div className="space-y-6">
              {/* Device Tab Controls */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50 self-start w-fit">
                <button
                  onClick={() => setDevicePlatformTab('meta')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    devicePlatformTab === 'meta' ? 'bg-white text-slate-800 shadow-sm border border-slate-250/20' : 'text-slate-500'
                  }`}
                >
                  Meta Devices Mix
                </button>
                <button
                  onClick={() => setDevicePlatformTab('google')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    devicePlatformTab === 'google' ? 'bg-white text-slate-800 shadow-sm border border-slate-250/20' : 'text-slate-500'
                  }`}
                >
                  Google Devices Mix
                </button>
              </div>

              {/* Devices Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-800">
                      {devicePlatformTab === 'meta' ? 'Meta Ads Device conversions' : 'Google Ads Device conversions'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">Conversions and cost efficiency mapped across user device types</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                    devicePlatformTab === 'meta' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-cyan-50 text-cyan-600 border border-cyan-100'
                  }`}>
                    {devicePlatformTab === 'meta' ? 'Meta' : 'Google'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                        <th className="py-3 px-5">Device Type</th>
                        <th className="py-3 px-5 text-center">Spend</th>
                        <th className="py-3 px-5 text-center">CRM Leads</th>
                        <th className="py-3 px-5 text-center text-indigo-600">CPL</th>
                        <th className="py-3 px-5 text-center text-emerald-600">Enrolled</th>
                        <th className="py-3 px-5 text-center text-indigo-800">Cost Per Enrolled (CPE)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {(devicePlatformTab === 'meta' ? data.metaDevices : data.googleDevices).map((item: any) => {
                        const cpl = item.leads > 0 ? item.spend / item.leads : 0
                        const cpe = item.enrolled > 0 ? item.spend / item.enrolled : 0
                        return (
                          <tr key={item.device} className="hover:bg-slate-50/50">
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-2">
                                {item.device === 'Mobile' && <Smartphone className="w-4 h-4 text-slate-450" />}
                                {item.device === 'Desktop' && <Laptop className="w-4 h-4 text-slate-450" />}
                                {item.device === 'Tablet' && <Tablet className="w-4 h-4 text-slate-450" />}
                                <span className="font-extrabold text-slate-800">{item.device}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-center text-slate-500">₹{Math.round(item.spend).toLocaleString()}</td>
                            <td className="py-3.5 px-5 text-center text-slate-600 font-bold">{item.leads}</td>
                            <td className="py-3.5 px-5 text-center text-indigo-600 font-bold">
                              {cpl > 0 ? `₹${Math.round(cpl).toLocaleString()}` : '₹0'}
                            </td>
                            <td className="py-3.5 px-5 text-center text-emerald-600 font-black">{item.enrolled}</td>
                            <td className="py-3.5 px-5 text-center text-indigo-800 font-bold">
                              {cpe > 0 ? `₹${Math.round(cpe).toLocaleString()}` : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      ) : null}
    </div>
  )
}
