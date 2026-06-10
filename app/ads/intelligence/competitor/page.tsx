// app/ads/intelligence/competitor/page.tsx
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useDateRange } from '@/hooks/useDateRange'
import RefreshBar from '@/components/ads/RefreshBar'
import { 
  Shield, AlertCircle, AlertTriangle, CheckCircle, ExternalLink, 
  Search, Filter, Sparkles, Info, HelpCircle, Eye, ShieldAlert, Award, Plus, Trash2, Globe
} from 'lucide-react'

interface Competitor {
  name: string
  pageId: string
  threatLevel: 'high' | 'medium' | 'low'
  activeAdsCount: number
  angles: string[]
  runningSince: string
}

interface CompetitorAd {
  id: string
  pageId: string
  pageName: string
  adCreationTime: string
  body: string
  platforms: string[]
  linkTitle?: string
  angleDetected?: string
  snapshotUrl?: string
  imageUrl?: string
}

interface CompetitorReport {
  competitors: Competitor[]
  gaps: string[]
  activeAds: CompetitorAd[]
  scannedAt: string
  isReal: boolean
}

interface Preset {
  name: string
  pageIds: string
}

// Pre-loaded system page ID presets
const DEFAULT_PRESETS: Preset[] = [
  { name: 'Oracle Fusion SCM', pageIds: '519383907933319,374798099056166,408185105700768' },
  { name: 'Oracle Fusion HCM', pageIds: '519383907933319,408185105700768' },
  { name: 'Oracle Fusion Financials', pageIds: '519383907933319,374798099056166,1110304798838787' },
  { name: 'Oracle Fusion Technical', pageIds: '519383907933319,945066105345619' }
]

export default function CompetitorScannerPage() {
  const { preset, from, to } = useDateRange()
  const [data, setData] = useState<CompetitorReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Custom Preset State
  const [activePreset, setActivePreset] = useState<Preset | null>(null)
  const [customPresets, setCustomPresets] = useState<Preset[]>([])
  
  // Custom Preset Form States
  const [newPresetName, setNewPresetName] = useState('')
  const [newPresetPageIds, setNewPresetPageIds] = useState('')
  
  // Catalog Filters State
  const [catalogSearch, setCatalogSearch] = useState('')
  const [competitorFilter, setCompetitorFilter] = useState('all')
  const [showTransparency, setShowTransparency] = useState(false)

  // Load custom presets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('competitor_search_presets_v2')
      if (stored) {
        setCustomPresets(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Failed to load custom presets:', err)
    }
  }, [])

  // Save custom presets to localStorage
  const savePresets = (newPresets: Preset[]) => {
    setCustomPresets(newPresets)
    try {
      localStorage.setItem('competitor_search_presets_v2', JSON.stringify(newPresets))
    } catch (err) {
      console.error('Failed to save presets:', err)
    }
  }

  // Handle adding custom presets
  const handleCreatePreset = (e: React.FormEvent) => {
    e.preventDefault()
    const name = newPresetName.trim()
    const pageIds = newPresetPageIds.trim().replace(/\s+/g, '')

    if (!name || !pageIds) return

    const exists = DEFAULT_PRESETS.some(p => p.name.toLowerCase() === name.toLowerCase()) || 
                   customPresets.some(p => p.name.toLowerCase() === name.toLowerCase())
    if (exists) {
      alert('A preset with this name already exists.')
      return
    }

    const newPreset: Preset = { name, pageIds }
    const updated = [...customPresets, newPreset]
    savePresets(updated)
    setActivePreset(newPreset)
    setNewPresetName('')
    setNewPresetPageIds('')
  }

  const handleDeletePreset = (presetToDeleteName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = customPresets.filter(p => p.name !== presetToDeleteName)
    savePresets(updated)
    if (activePreset && activePreset.name === presetToDeleteName) {
      setActivePreset(null)
    }
  }

  const fetchData = useCallback(async (bypassCache = false, queryPreset?: Preset | null) => {
    try {
      if (bypassCache) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const query = new URLSearchParams()
      if (bypassCache) {
        query.set('refresh', 'true')
      }
      
      const targetPreset = queryPreset !== undefined ? queryPreset : activePreset
      if (targetPreset) {
        query.set('pageIds', targetPreset.pageIds)
      }

      const res = await fetch(`/api/ads/intelligence/competitor?${query.toString()}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to fetch competitor data')
      }

      const resData = await res.json()
      setData(resData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while fetching competitor data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activePreset])

  useEffect(() => {
    fetchData(false, activePreset)
  }, [fetchData, activePreset])

  const handleRefresh = () => {
    fetchData(true)
  }

  // Filter scanned ads on the client-side
  const filteredAds = useMemo(() => {
    if (!data?.activeAds) return []
    return data.activeAds.filter(ad => {
      const matchesSearch = 
        ad.body.toLowerCase().includes(catalogSearch.toLowerCase()) || 
        (ad.linkTitle && ad.linkTitle.toLowerCase().includes(catalogSearch.toLowerCase())) ||
        (ad.angleDetected && ad.angleDetected.toLowerCase().includes(catalogSearch.toLowerCase()))
      
      const matchesCompetitor = competitorFilter === 'all' || ad.pageName === competitorFilter
      return matchesSearch && matchesCompetitor
    })
  }, [data, catalogSearch, competitorFilter])

  // Threat badge styles
  const getThreatBadge = (level: 'high' | 'medium' | 'low') => {
    if (level === 'high') {
      return (
        <span className="px-2.5 py-0.5 rounded border bg-rose-500/10 text-rose-400 border-rose-500/25 text-[10px] font-bold uppercase tracking-wider">
          🚨 High Threat
        </span>
      )
    }
    if (level === 'medium') {
      return (
        <span className="px-2.5 py-0.5 rounded border bg-amber-500/10 text-amber-400 border-amber-500/25 text-[10px] font-bold uppercase tracking-wider">
          ⚠️ Medium Threat
        </span>
      )
    }
    return (
      <span className="px-2.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/25 text-[10px] font-bold uppercase tracking-wider">
        🛡️ Low Threat
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-100px] left-[-200px] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Header Bar */}
      <div className="relative z-30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Competitor Ad Library Scanner
              <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                Meta Ad Library
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-semibold">
              Live scan of Monitored Competitors running active ads in Meta Ad Library
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <RefreshBar
            loading={loading}
            refreshing={refreshing}
            lastUpdated={data?.scannedAt}
            onRefresh={handleRefresh}
            dark
          />
        </div>
      </div>

      {/* Presets and Page IDs Scan Panel */}
      <div className="relative z-20 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-6">
        <div>
          <h3 className="text-sm uppercase tracking-wider font-extrabold text-indigo-400 font-black">Ad Library Page ID Presets & Live Search</h3>
          <p className="text-xs text-slate-400 mt-1 font-semibold">Select a course preset or create a custom competitor Page ID preset to scan active competitor campaigns across the Meta Ad Library.</p>
        </div>

        {/* Presets Selection Tree */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActivePreset(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activePreset === null
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/10'
                : 'bg-slate-950/80 text-slate-450 border-slate-850 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            📋 Monitored Page IDs (Default)
          </button>

          {/* System Default Presets */}
          {DEFAULT_PRESETS.map(p => (
            <button
              key={p.name}
              onClick={() => setActivePreset(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                activePreset && activePreset.name === p.name
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-950/80 text-slate-450 border-slate-850 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              🏷️ {p.name}
            </button>
          ))}

          {/* Custom User Presets */}
          {customPresets.map(p => (
            <button
              key={p.name}
              onClick={() => setActivePreset(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 group ${
                activePreset && activePreset.name === p.name
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-950/80 text-slate-450 border-slate-850 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <span>⭐ {p.name}</span>
              <Trash2 
                className="w-3.5 h-3.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer" 
                onClick={(e) => handleDeletePreset(p.name, e)}
              />
            </button>
          ))}
        </div>

        {/* Create Custom Preset Form */}
        <form onSubmit={handleCreatePreset} className="flex flex-col md:flex-row items-end gap-3 max-w-2xl">
          <div className="flex-1 w-full space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Preset Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. Oracle SCM Competitors"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs placeholder-slate-550 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
              />
            </div>
          </div>
          <div className="flex-1 w-full space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Facebook Page IDs (comma-separated)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. 519383907933319, 374798099056166"
                value={newPresetPageIds}
                onChange={(e) => setNewPresetPageIds(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs placeholder-slate-550 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-500/10 shrink-0 h-[38px] rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Add Preset
          </button>
        </form>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-300 text-xs font-semibold max-w-2xl relative z-10">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Error loading competitor scanner details</p>
            <p className="text-rose-300/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-6 animate-pulse relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-900/60 border border-slate-800/80 rounded-2xl" />
            ))}
          </div>
          <div className="h-[250px] bg-slate-900/60 border border-slate-800/80 rounded-2xl" />
          <div className="h-[300px] bg-slate-900/60 border border-slate-800/80 rounded-2xl" />
        </div>
      ) : data ? (
        <div className="relative z-10 space-y-8">
          
          {/* Authenticity Notice Banner */}
          <div className={`flex items-start gap-3.5 p-4 rounded-2xl border text-xs leading-relaxed max-w-4xl ${
            data.isReal 
              ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300/90' 
              : 'bg-amber-950/20 border-amber-500/25 text-amber-300/90'
          }`}>
            {data.isReal ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 animate-pulse" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold uppercase tracking-wide text-[10px]">
                  {data.isReal ? 'API Live Connection Active' : 'Viewing Sandbox Demo Mode'}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-950/80 border border-slate-850 text-slate-450">
                  {data.isReal ? 'Meta Graph' : 'Simulated data'}
                </span>
              </div>
              <p className="font-semibold text-slate-350">
                {data.isReal 
                  ? `Active competitor creatives and statistics are queried live from Facebook’s Ad Library Graph API${activePreset ? ` matching page preset "${activePreset.name}"` : ''} using your configured Meta long-lived user credentials.` 
                  : `No active Meta Access Token is configured in Settings. Currently displaying simulated competitor configurations and copy variants${activePreset ? ` matching page preset "${activePreset.name}"` : ''}. Configure your Meta Developer Credentials under Settings to trigger real API crawls.`}
              </p>
              
              {/* Google Transparency Disclaimer */}
              <p className="text-[10px] text-slate-450 leading-relaxed font-normal pt-1.5 border-t border-slate-800/30 mt-1.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>
                  <strong>Google Transparency Notice:</strong> Google Ads Transparency Center does not offer a public developer API. Search shortcuts are provided below to look up active Google, YouTube, and Display campaigns for each rival name directly in Google's official directory.
                </span>
              </p>

              <button 
                onClick={() => setShowTransparency(!showTransparency)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer inline-flex items-center gap-1 mt-2.5"
              >
                {showTransparency ? 'Hide technical scan parameters' : 'Show technical scan parameters'}
              </button>
            </div>
          </div>

          {/* Technical scan detail accordion */}
          {showTransparency && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 max-w-4xl text-xs space-y-3 font-semibold text-slate-350">
              <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[10px]">Meta Graph API Request Architecture</h4>
              <p>The Monitored Scanner queries Meta’s Public Ads Archive endpoint by filtering on monitored advertiser page IDs:</p>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                {activePreset ? (
                  `GET https://graph.facebook.com/v19.0/ads_archive?fields=id,ad_creation_time,ad_creative_bodies,ad_creative_link_titles,page_id,page_name,publisher_platforms,snapshot_url&search_page_ids=${encodeURIComponent(activePreset.pageIds)}&ad_reached_countries=['IN']&ad_type=ALL&ad_active_status=ACTIVE&access_token=EAAC...`
                ) : (
                  "GET https://graph.facebook.com/v19.0/ads_archive?fields=id,ad_creation_time,ad_creative_bodies,ad_creative_link_titles,page_id,page_name,publisher_platforms,snapshot_url&search_page_ids=519383907933319,374798099056166,408185105700768...&ad_reached_countries=['IN']&ad_type=ALL&ad_active_status=ACTIVE&access_token=EAAC..."
                )}
              </div>
              <p className="text-[11px] text-slate-505 leading-relaxed font-normal">
                To prevent hitting Meta’s API request volume limits, results are cached locally for 24 hours. Clicking the refresh button in the header bypasses cache storage and forces a new live Graph API crawl.
              </p>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-450 uppercase font-black tracking-wider">Rivals Detected</p>
              <p className="text-xl font-black text-white mt-1">{data.competitors.length}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Tracked training entities</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-450 uppercase font-black tracking-wider">Active Competitor Ads</p>
              <p className="text-xl font-black text-indigo-300 mt-1">
                {data.competitors.reduce((sum, c) => sum + c.activeAdsCount, 0)} ads
              </p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Active creatives in library</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-450 uppercase font-black tracking-wider">High Threat Competitors</p>
              <p className="text-xl font-black text-rose-400 mt-1">
                {data.competitors.filter(c => c.threatLevel === 'high').length} rivals
              </p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Aggressive ad budgets</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-450 uppercase font-black tracking-wider">Most Active Rival</p>
              <p className="text-sm font-black text-emerald-400 mt-2.5 truncate">
                {(() => {
                  if (data.competitors.length === 0) return '—'
                  const sorted = [...data.competitors].sort((a, b) => b.activeAdsCount - a.activeAdsCount)
                  return `${sorted[0].name} (${sorted[0].activeAdsCount} ads)`
                })()}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Leading active campaigns</p>
            </div>
          </div>

          {/* Competitor Advertising Threat Index */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                Competitor Advertising Threat Index
                {activePreset && (
                  <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                    Preset: {activePreset.name}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Monitored training providers running active ads in ERP categories</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-450 text-[10px] uppercase font-bold tracking-wider border-b border-slate-850 select-none">
                    <th className="py-3 px-5">Competitor Page Name</th>
                    <th className="py-3 px-5 text-center">Active Ads</th>
                    <th className="py-3 px-5">Top Advertising Angle</th>
                    <th className="py-3 px-5 text-center">Threat Level</th>
                    <th className="py-3 px-5 text-center">Active Since</th>
                    <th className="py-3 px-5 text-center">Meta Ad Library</th>
                    <th className="py-3 px-5 text-center">Google Transparency Center</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-xs font-semibold text-slate-300">
                  {data.competitors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                        No competitors detected for the current filter/preset query.
                      </td>
                    </tr>
                  ) : (
                    data.competitors.map((c) => (
                      <tr key={c.pageId} className="hover:bg-slate-900/30">
                        <td className="py-4 px-5">
                          <div>
                            <p className="font-extrabold text-white">{c.name}</p>
                            <p className="text-[9px] text-slate-500 font-mono mt-0.5">Page ID: {c.pageId}</p>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <span className="px-2 py-0.5 rounded font-black bg-indigo-500/10 text-indigo-400">
                            {c.activeAdsCount} {c.activeAdsCount === 1 ? 'ad' : 'ads'}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-400 font-medium">
                          {c.angles[0] || 'Oracle Fusion Cloud Course'}
                        </td>
                        <td className="py-4 px-5 text-center">
                          {getThreatBadge(c.threatLevel)}
                        </td>
                        <td className="py-4 px-5 text-center text-slate-500 font-medium">
                          {c.runningSince}
                        </td>
                        <td className="py-4 px-5 text-center">
                          <a 
                            href={`https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&view_all_page_id=${c.pageId}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-extrabold transition-all hover:underline"
                          >
                            Meta Ad Library <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <a 
                            href={`https://adstransparency.google.com/?page=1&region=IN&q=${encodeURIComponent(c.name)}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-extrabold transition-all hover:underline"
                          >
                            Google Transparency <Globe className="w-3.5 h-3.5" />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ad Creative copy copy catalog grid */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">Active Competitor Creative Copy Catalog</h3>
                <p className="text-xs text-slate-400 mt-1">Active competitor primary body texts detected during last archive scan</p>
              </div>

              {/* Filtering / Search */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-405" />
                  <input
                    type="text"
                    placeholder="Search ad copy..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 w-44 sm:w-56 bg-slate-955 border border-slate-800 rounded-xl text-xs placeholder-slate-550 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={competitorFilter}
                  onChange={(e) => setCompetitorFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-955 border border-slate-800 rounded-xl text-xs font-bold text-slate-450 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Rivals</option>
                  {Array.from(new Set(data.activeAds.map(ad => ad.pageName))).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredAds.length === 0 ? (
              <div className="text-center py-12 border border-slate-850 border-dashed rounded-2xl text-slate-500 text-xs font-medium">
                No competitor ads match your current search queries or filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAds.map((ad) => {
                  const initials = ad.pageName.substring(0, 2).toUpperCase()
                  
                  // Segment courses by keywords for visual theming
                  const isSCM = ad.body.toLowerCase().includes('scm') || ad.linkTitle?.toLowerCase().includes('scm')
                  const isHCM = ad.body.toLowerCase().includes('hcm') || ad.linkTitle?.toLowerCase().includes('hcm')
                  const isFinance = ad.body.toLowerCase().includes('financial') || ad.linkTitle?.toLowerCase().includes('finance')
                  
                  let themeGradients = 'from-violet-900 to-slate-950'
                  let courseBadge = 'Oracle Fusion ERP'
                  if (isSCM) {
                    themeGradients = 'from-indigo-950 to-slate-950'
                    courseBadge = 'Oracle Fusion SCM'
                  } else if (isHCM) {
                    themeGradients = 'from-pink-950 to-slate-950'
                    courseBadge = 'Oracle Fusion HCM'
                  } else if (isFinance) {
                    themeGradients = 'from-emerald-950 to-slate-950'
                    courseBadge = 'Oracle Financials'
                  }

                  // Clickable Facebook Ad Library Link
                  const targetAdUrl = ad.snapshotUrl || `https://www.facebook.com/ads/library/?id=${ad.id}`

                  return (
                    <div 
                      key={ad.id} 
                      className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden hover:border-indigo-500/20 hover:bg-slate-900/70 transition-all duration-300 shadow-lg flex flex-col justify-between group"
                    >
                      {/* Header (Page Name, Date, Sponsor, Platforms) */}
                      <div className="p-4 flex justify-between items-center bg-slate-950/40">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-855 flex items-center justify-center border border-slate-800 text-[10px] font-black text-indigo-400">
                            {initials}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-white leading-none">{ad.pageName}</p>
                            <p className="text-[8px] text-slate-500 font-medium mt-1">Sponsored</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {ad.platforms.map((plat) => {
                            const label = plat.substring(0, 2).toUpperCase()
                            return (
                              <span 
                                key={plat} 
                                className="px-1 py-0.2 rounded text-[8px] font-bold uppercase bg-slate-950 border border-slate-850 text-slate-450"
                                title={plat}
                              >
                                {label}
                              </span>
                            )
                          })}
                        </div>
                      </div>

                      {/* Primary Text Copy */}
                      <div className="px-4 py-3 space-y-2 flex-1">
                        <p className="text-[11px] text-slate-350 font-medium leading-relaxed line-clamp-5 whitespace-pre-line">
                          {ad.body}
                        </p>
                      </div>

                      {/* Visual Graphic Preview Box */}
                      <div className="relative aspect-[16/9] w-full border-y border-slate-850 flex flex-col justify-between p-4 overflow-hidden">
                        {/* The Unsplash Image */}
                        {ad.imageUrl ? (
                          <img 
                            src={ad.imageUrl} 
                            alt={ad.linkTitle || 'Ad Preview'} 
                            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className={`absolute inset-0 bg-gradient-to-tr ${themeGradients} opacity-50`} />
                        )}

                        {/* Gradient shade overlay to make sure text is readable */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/10 pointer-events-none" />
                        
                        <div className="relative z-10 flex justify-between items-start">
                          <span className="px-2 py-0.5 rounded text-[8px] font-black bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {courseBadge}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[7px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Active
                          </span>
                        </div>

                        <div className="relative z-10 space-y-1 my-auto text-center px-1">
                          <p className="text-[8px] font-bold tracking-widest uppercase text-indigo-400">ERP Specialist Certification</p>
                          <h4 className="text-xs font-black text-white tracking-tight leading-tight line-clamp-2">
                            {ad.linkTitle || 'ERP Fusion Cloud Training Program'}
                          </h4>
                          {ad.angleDetected && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-bold bg-white/10 text-white mt-1 border border-white/5">
                              📌 {ad.angleDetected}
                            </span>
                          )}
                        </div>

                        <div className="relative z-10 flex items-center justify-between text-[8px] text-slate-500 font-semibold mt-auto">
                          <span>Visual Snapshot</span>
                          <span>Live Creative</span>
                        </div>

                        {/* Interactive overlay on hover */}
                        <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 z-20">
                          <a 
                            href={targetAdUrl}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold inline-flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
                          >
                            View Original Media <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Card Footer area */}
                      <div className="p-4 flex items-center justify-between bg-slate-950/20 gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 truncate">
                            {ad.platforms.join(' | ')}
                          </p>
                          <h5 className="text-[11px] font-bold text-white truncate mt-0.5">
                            {ad.linkTitle || 'Learn From Senior Consultants'}
                          </h5>
                        </div>
                        <a 
                          href={targetAdUrl}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold shrink-0 transition-colors border border-slate-750 cursor-pointer"
                        >
                          Learn More
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Ad Angling Gaps & Opportunities */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                Rival Creative Angling Gaps
              </h3>
              <p className="text-xs text-slate-400 mt-1">Angles and opportunities not actively targeted by competitor campaigns (Exploit to reduce CPL)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.gaps.map((gap, idx) => (
                <div 
                  key={idx} 
                  className="p-5 rounded-2xl bg-indigo-950/10 border border-indigo-500/10 hover:border-indigo-500/20 transition-all duration-300 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xs font-black">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-black text-indigo-300 uppercase tracking-wider">Strategic Gap</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 mt-2">{gap}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                    Our copy can leverage this gap. For instance, highlighting trainer Krishna's 20+ years of ERP consultancy gives us a credibility advantage against generic competitor training schools.
                  </p>
                </div>
              ))}
            </div>

            {/* Strategic Directive Panel */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center text-xs">
              <div className="flex gap-3 items-start">
                <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-200">Creative Scanning Guidance Directive</h4>
                  <p className="text-slate-400 leading-relaxed font-semibold">
                    Competitors are heavily pushing generic job placement guarantees. Rather than replicating this message, direct ad hooks toward showing verified proof elements (like salary certificate snapshots, class batch statistics, or actual student reviews).
                  </p>
                </div>
              </div>
              <div className="shrink-0 bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-center shadow-md">
                <p className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Suggested Focus</p>
                <p className="text-xs font-black text-indigo-300 mt-0.5">Proof-Backed Credibility</p>
              </div>
            </div>
          </div>

        </div>
      ) : null}
    </div>
  )
}
