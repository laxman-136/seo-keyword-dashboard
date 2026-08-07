// app/settings/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Settings, Key, Link2, CheckCircle2, AlertCircle, Trash2,
  Eye, EyeOff, Plus, Zap, Building2, ChevronRight, RefreshCw,
  ArrowLeft, ShieldCheck, ExternalLink, Copy, Check
} from 'lucide-react'
import {
  extractSheetId, isValidSheetId, isValidApiKey,
  getSavedConfigs, saveConfig, deleteConfig,
  getActiveConfig, setActiveConfig, clearActiveConfig,
  SheetConfig
} from '@/lib/config'
import { ViewerAccessGrant } from '@/lib/types'
import { cn } from '@/lib/utils'

type TestStatus = 'idle' | 'testing' | 'success' | 'error'

export default function SettingsPage() {
  // Form state
  const [label, setLabel] = useState('')
  const [seoUrl, setSeoUrl] = useState('')
  const [leadsUrl, setLeadsUrl] = useState('')
  const [revenueUrl, setRevenueUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [gaPropertyId, setGaPropertyId] = useState('')
  const [gaClientEmail, setGaClientEmail] = useState('')
  const [gaPrivateKey, setGaPrivateKey] = useState('')
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [syncMessage, setSyncMessage] = useState('')
  const [syncMonthlyStatus, setSyncMonthlyStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [syncMonthlyMessage, setSyncMonthlyMessage] = useState('')

  // Ads API Credentials state
  const [metaAdAccountId, setMetaAdAccountId] = useState('')
  const [metaAccessToken, setMetaAccessToken] = useState('')
  const [googleDeveloperToken, setGoogleDeveloperToken] = useState('')
  const [googleClientId, setGoogleClientId] = useState('')
  const [googleClientSecret, setGoogleClientSecret] = useState('')
  const [googleRefreshToken, setGoogleRefreshToken] = useState('')
  const [googleCustomerId, setGoogleCustomerId] = useState('')
  const [googleManagerId, setGoogleManagerId] = useState('')
  const [metaPrepaidBalance, setMetaPrepaidBalance] = useState('')
  const [googlePrepaidBalance, setGooglePrepaidBalance] = useState('')
  const [telecrmApiToken, setTelecrmApiToken] = useState('')
  const [telecrmEnterpriseId, setTelecrmEnterpriseId] = useState('')
  const [showTelecrmToken, setShowTelecrmToken] = useState(false)

  // Visibility states
  const [showMetaToken, setShowMetaToken] = useState(false)
  const [showGoogleDevToken, setShowGoogleDevToken] = useState(false)
  const [showGoogleClientSecret, setShowGoogleClientSecret] = useState(false)
  const [showGoogleRefreshToken, setShowGoogleRefreshToken] = useState(false)

  // UI state
  const [savedConfigs, setSavedConfigs] = useState<SheetConfig[]>([])
  const [activeConfig, setActiveConfigState] = useState<SheetConfig | null>(null)
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [editingConfig, setEditingConfig] = useState<SheetConfig | null>(null)

  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; role: string; viewerAccess?: ViewerAccessGrant[] } | null>(null)
  const [ownerGrants, setOwnerGrants] = useState<ViewerAccessGrant[]>([])
  const [shareEmail, setShareEmail] = useState('')
  const [shareDuration, setShareDuration] = useState(30)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareMessage, setShareMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null)
  const [shareSections, setShareSections] = useState<string[]>(['keywords', 'traffic', 'leads', 'roi', 'batch', 'revenue', 'site'])

  const isViewer = currentUser?.role === 'viewer'
  const canShare = currentUser?.role === 'superadmin' || currentUser?.role === 'admin' || currentUser?.role === 'ceo' || currentUser?.role === 'user'
  const canEditConfigs = currentUser?.role === 'superadmin' || currentUser?.role === 'admin' || currentUser?.role === 'ceo'

  useEffect(() => {
    if (currentUser?.role === 'user') {
      setShareSections(['keywords', 'traffic'])
    }
  }, [currentUser])

  // Load configs from localStorage
  const loadConfigs = useCallback(() => {
    setSavedConfigs(getSavedConfigs())
    setActiveConfigState(getActiveConfig())
  }, [])

  useEffect(() => {
    loadConfigs()
  }, [loadConfigs])

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) return
        const data = await res.json()
        setCurrentUser(data.user ? { ...data.user, viewerAccess: data.viewerAccess } : null)
      } catch {
        setCurrentUser(null)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    const loadGrants = async () => {
      if (!currentUser || isViewer || !activeConfig) return
      try {
        const activeSheetId = activeConfig.seoSheetId || activeConfig.sheetId || ''
        const url = `/api/access-grants?owned=true&sheetId=${encodeURIComponent(activeSheetId)}`
        const res = await fetch(url)
        if (!res.ok) return
        const data = await res.json()
        setOwnerGrants(Array.isArray(data.grants) ? data.grants : [])
      } catch {
        setOwnerGrants([])
      }
    }
    loadGrants()
  }, [currentUser, activeConfig, isViewer])

  const handleCopyShareUrl = async (grantId: string) => {
    if (typeof window === 'undefined') return
    try {
      const url = `${window.location.origin}/viewer/${grantId}?from=/traffic`
      await navigator.clipboard.writeText(url)
      setCopiedShareId(grantId)
      window.setTimeout(() => setCopiedShareId(null), 2500)
    } catch {
      setCopiedShareId(null)
    }
  }

  const handleShareGrant = async () => {
    if (!activeConfig || !shareEmail.trim()) return
    setShareLoading(true)
    setShareMessage(null)

    try {
      const res = await fetch('/api/access-grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grant',
          recipientEmail: shareEmail.trim().toLowerCase(),
          seoSheetId: shareSections.some(s => ['keywords', 'traffic', 'site'].includes(s)) ? activeConfig.seoSheetId : undefined,
          leadsSheetId: shareSections.some(s => ['leads', 'roi', 'batch'].includes(s)) ? activeConfig.leadsSheetId : undefined,
          revenueSheetId: shareSections.some(s => ['revenue', 'roi', 'batch'].includes(s)) ? activeConfig.revenueSheetId : undefined,
          apiKey: activeConfig.apiKey,
          label: activeConfig.label,
          durationDays: shareDuration,
          allowedSections: shareSections
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setShareMessage({ type: 'err', text: data?.error || 'Unable to share access.' })
      } else {
        setShareMessage({ type: 'ok', text: `Viewer access granted to ${shareEmail.trim()}.` })
        setShareEmail('')
        setOwnerGrants(prev => data.grant ? [data.grant, ...prev] : prev)
      }
    } catch (err: any) {
      setShareMessage({ type: 'err', text: err?.message || 'Network error sharing access.' })
    } finally {
      setShareLoading(false)
    }
  }

  const handleRevokeGrant = async (grantId: string) => {
    setShareLoading(true)
    setShareMessage(null)

    try {
      const res = await fetch('/api/access-grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', id: grantId })
      })
      const data = await res.json()
      if (!res.ok) {
        setShareMessage({ type: 'err', text: data?.error || 'Unable to revoke access.' })
      } else {
        setShareMessage({ type: 'ok', text: 'Viewer access revoked.' })
        setOwnerGrants(prev => prev.filter(g => g.id !== grantId))
      }
    } catch (err: any) {
      setShareMessage({ type: 'err', text: err?.message || 'Network error revoking access.' })
    } finally {
      setShareLoading(false)
    }
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const expiresDate = new Date(expiresAt)
    if (expiresDate.getFullYear() >= 2076) return 'Infinite'
    const diff = expiresDate.getTime() - Date.now()
    if (diff <= 0) return 'Expired'
    const days = Math.floor(diff / 86400000)
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
    const hours = Math.floor(diff / 3600000)
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
    const minutes = Math.ceil(diff / 60000)
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }

  const parseGrantLabel = (lbl: string) => {
    if (lbl && lbl.includes('| allowed:')) {
      const [name, allowedStr] = lbl.split('| allowed:')
      return {
        name: name.trim(),
        allowed: allowedStr.trim().split(',')
      }
    }
    return { name: lbl || '', allowed: ['keywords', 'traffic', 'leads', 'roi', 'batch', 'revenue', 'site'] }
  }

  const activeViewerCount = ownerGrants.length
  const nextExpiryAt = ownerGrants.reduce((next, grant) => {
    if (!next) return grant.expiresAt
    return new Date(grant.expiresAt).getTime() < new Date(next).getTime() ? grant.expiresAt : next
  }, '')

  // When editing a config, populate the form
  const handleEdit = (config: SheetConfig) => {
    setEditingConfig(config)
    setLabel(config.label)
    setSeoUrl(config.seoSheetId || config.sheetId || '')
    setLeadsUrl(config.leadsSheetId || '')
    setRevenueUrl(config.revenueSheetId || '')
    setApiKey(config.apiKey || '')
    setGaPropertyId(config.gaPropertyId || '')
    setGaClientEmail(config.gaClientEmail || '')
    setGaPrivateKey(config.gaPrivateKey || '')
    
    // Ads credentials
    setMetaAdAccountId(config.metaAdAccountId || '')
    setMetaAccessToken(config.metaAccessToken || '')
    setGoogleDeveloperToken(config.googleDeveloperToken || '')
    setGoogleClientId(config.googleClientId || '')
    setGoogleClientSecret(config.googleClientSecret || '')
    setGoogleRefreshToken(config.googleRefreshToken || '')
    setGoogleCustomerId(config.googleCustomerId || '')
    setGoogleManagerId(config.googleManagerId || '')
    setMetaPrepaidBalance(config.metaPrepaidBalance ? String(config.metaPrepaidBalance) : '')
    setGooglePrepaidBalance(config.googlePrepaidBalance ? String(config.googlePrepaidBalance) : '')
    setTelecrmApiToken(config.telecrmApiToken || '')
    setTelecrmEnterpriseId(config.telecrmEnterpriseId || '')

    setTestStatus('idle')
    setTestMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingConfig(null)
    setLabel('')
    setSeoUrl('')
    setLeadsUrl('')
    setRevenueUrl('')
    setApiKey('')
    setGaPropertyId('')
    setGaClientEmail('')
    setGaPrivateKey('')
    
    // Ads credentials
    setMetaAdAccountId('')
    setMetaAccessToken('')
    setGoogleDeveloperToken('')
    setGoogleClientId('')
    setGoogleClientSecret('')
    setGoogleRefreshToken('')
    setGoogleCustomerId('')
    setGoogleManagerId('')
    setMetaPrepaidBalance('')
    setGooglePrepaidBalance('')
    setTelecrmApiToken('')
    setTelecrmEnterpriseId('')

    setTestStatus('idle')
    setTestMessage('')
    setSyncStatus('idle')
    setSyncMessage('')
  }

  const derivedSeoId = extractSheetId(seoUrl)
  const derivedLeadsId = extractSheetId(leadsUrl)
  const derivedRevenueId = extractSheetId(revenueUrl)
  
  const hasAtLeastOneSheet = seoUrl.trim() !== '' || leadsUrl.trim() !== '' || revenueUrl.trim() !== ''
  const hasAtLeastOneAdsAcc = metaAdAccountId.trim() !== '' || googleCustomerId.trim() !== ''

  const formIsValid = label.trim().length > 0
    && (seoUrl.trim() === '' || isValidSheetId(derivedSeoId))
    && (leadsUrl.trim() === '' || isValidSheetId(derivedLeadsId))
    && (revenueUrl.trim() === '' || isValidSheetId(derivedRevenueId))
    && (hasAtLeastOneSheet || hasAtLeastOneAdsAcc)
    && (!apiKey || isValidApiKey(apiKey))

  // Test connection to Google Sheets
  const handleTest = async () => {
    let testUrl = ''
    let groupName = ''
    
    if (seoUrl.trim() && isValidSheetId(derivedSeoId)) {
      testUrl = `/api/keywords?sheetId=${encodeURIComponent(derivedSeoId)}&apiKey=${encodeURIComponent(apiKey.trim())}`
      groupName = 'SEO/Traffic'
    } else if (leadsUrl.trim() && isValidSheetId(derivedLeadsId)) {
      testUrl = `/api/leads?sheetId=${encodeURIComponent(derivedLeadsId)}&apiKey=${encodeURIComponent(apiKey.trim())}`
      groupName = 'Leads'
    } else if (revenueUrl.trim() && isValidSheetId(derivedRevenueId)) {
      testUrl = `/api/revenue?sheetId=${encodeURIComponent(derivedRevenueId)}&apiKey=${encodeURIComponent(apiKey.trim())}`
      groupName = 'Revenue'
    }

    if (!testUrl || !isValidApiKey(apiKey)) return
    setTestStatus('testing')
    setTestMessage('')

    try {
      const res = await fetch(testUrl)
      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || 'API error')

      if (data.isMock) {
        setTestStatus('error')
        setTestMessage(`Connection failed for ${groupName} Sheet — falling back to demo data. Check your Sheet ID and API Key.`)
      } else {
        setTestStatus('success')
        setTestMessage(`✓ Connected successfully to ${groupName} Sheet!`)
      }
    } catch (err: unknown) {
      setTestStatus('error')
      setTestMessage(`Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // Save config
  const handleSave = async () => {
    if (!formIsValid) return
    setSaving(true)

    const config: SheetConfig = {
      label: label.trim(),
      seoSheetId: seoUrl.trim() ? derivedSeoId : undefined,
      leadsSheetId: leadsUrl.trim() ? derivedLeadsId : undefined,
      revenueSheetId: revenueUrl.trim() ? derivedRevenueId : undefined,
      apiKey: apiKey.trim(),
      gaPropertyId: gaPropertyId.trim() || undefined,
      gaClientEmail: gaClientEmail.trim() || undefined,
      gaPrivateKey: gaPrivateKey.trim() || undefined,
      
      // Ads API Credentials
      metaAdAccountId: metaAdAccountId.trim() || undefined,
      metaAccessToken: metaAccessToken.trim() || undefined,
      googleDeveloperToken: googleDeveloperToken.trim() || undefined,
      googleClientId: googleClientId.trim() || undefined,
      googleClientSecret: googleClientSecret.trim() || undefined,
      googleRefreshToken: googleRefreshToken.trim() || undefined,
      googleCustomerId: googleCustomerId.trim() || undefined,
      googleManagerId: googleManagerId.trim() || undefined,
      metaPrepaidBalance: metaPrepaidBalance.trim() ? Number(metaPrepaidBalance) : undefined,
      googlePrepaidBalance: googlePrepaidBalance.trim() ? Number(googlePrepaidBalance) : undefined,
      telecrmApiToken: telecrmApiToken.trim() || undefined,
      telecrmEnterpriseId: telecrmEnterpriseId.trim() || undefined,

      createdAt: editingConfig?.createdAt || new Date().toISOString(),
      sheetId: seoUrl.trim() ? derivedSeoId : ''
    }

    try {
      const res = await fetch('/api/configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', config })
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save configuration to database.')
      }
    } catch (err: any) {
      console.error('Failed to sync configuration to database:', err)
    }

    saveConfig(config)

    // Auto-activate on first save, or when editing the currently active config
    const active = getActiveConfig()
    const editingActive = editingConfig && active?.label === editingConfig.label
    const shouldActivate = !active || editingActive || active.label === config.label

    if (shouldActivate) {
      try {
        await fetch('/api/configurations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'activate', label: config.label })
        })
      } catch (err) {
        console.error('Failed to sync active configuration to database:', err)
      }
      setActiveConfig(config)
    }

    loadConfigs()
    setSaving(false)
    setEditingConfig(null)
    setLabel('')
    setSeoUrl('')
    setLeadsUrl('')
    setRevenueUrl('')
    setApiKey('')
    setGaPropertyId('')
    setGaClientEmail('')
    setGaPrivateKey('')
    
    // Clear ads credentials
    setMetaAdAccountId('')
    setMetaAccessToken('')
    setGoogleDeveloperToken('')
    setGoogleClientId('')
    setGoogleClientSecret('')
    setGoogleRefreshToken('')
    setGoogleCustomerId('')
    setGoogleManagerId('')
    setMetaPrepaidBalance('')
    setGooglePrepaidBalance('')
    setTelecrmApiToken('')
    setTelecrmEnterpriseId('')

    setTestStatus('idle')
    setTestMessage('')
    setSyncStatus('idle')
    setSyncMessage('')
  }

  const handleSyncGa4 = async () => {
    const targetSeoId = derivedSeoId || (activeConfig?.seoSheetId || activeConfig?.sheetId)
    const targetApiKey = apiKey.trim() || activeConfig?.apiKey
    
    if (!targetSeoId || !gaPropertyId.trim() || !gaClientEmail.trim() || !gaPrivateKey.trim()) return
    setSyncStatus('syncing')
    setSyncMessage('')

    try {
      const res = await fetch('/api/traffic/sync-ga4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seoSheetId: targetSeoId,
          apiKey: targetApiKey,
          gaPropertyId: gaPropertyId.trim(),
          gaClientEmail: gaClientEmail.trim(),
          gaPrivateKey: gaPrivateKey.trim()
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')

      setSyncStatus('success')
      setSyncMessage(data.message || 'GA4 Sync completed successfully!')
    } catch (err: any) {
      setSyncStatus('error')
      setSyncMessage(err.message || 'Error syncing GA4 traffic data.')
    }
  }

  const handleSyncGa4Monthly = async () => {
    const targetSeoId = derivedSeoId || (activeConfig?.seoSheetId || activeConfig?.sheetId)
    const targetApiKey = apiKey.trim() || activeConfig?.apiKey
    
    if (!targetSeoId || !gaPropertyId.trim() || !gaClientEmail.trim() || !gaPrivateKey.trim()) return
    setSyncMonthlyStatus('syncing')
    setSyncMonthlyMessage('')

    try {
      const res = await fetch('/api/traffic/sync-ga4-monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seoSheetId: targetSeoId,
          apiKey: targetApiKey,
          gaPropertyId: gaPropertyId.trim(),
          gaClientEmail: gaClientEmail.trim(),
          gaPrivateKey: gaPrivateKey.trim()
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')

      setSyncMonthlyStatus('success')
      setSyncMonthlyMessage(data.message || 'GA4 Monthly Sync completed successfully!')
    } catch (err: any) {
      setSyncMonthlyStatus('error')
      setSyncMonthlyMessage(err.message || 'Error syncing GA4 monthly traffic data.')
    }
  }

  const handleActivate = async (config: SheetConfig) => {
    try {
      await fetch('/api/configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', label: config.label })
      })
    } catch (err) {
      console.error('Failed to activate configuration in database:', err)
    }
    setActiveConfig(config)
    loadConfigs()
  }

  const handleDelete = async (cfg: SheetConfig) => {
    if (!window.confirm(`Delete config "${cfg.label}"? This cannot be undone.`)) return
    try {
      await fetch('/api/configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', label: cfg.label })
      })
    } catch (err) {
      console.error('Failed to delete configuration from database:', err)
    }
    deleteConfig(cfg.label)
    loadConfigs()
  }

  const handleClearActive = async () => {
    try {
      await fetch('/api/configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', label: null })
      })
    } catch (err) {
      console.error('Failed to clear active configuration in database:', err)
    }
    clearActiveConfig()
    loadConfigs()
  }

  const handleCopyId = () => {
    if (!derivedSeoId) return
    navigator.clipboard.writeText(derivedSeoId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm no-print">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <span className="text-slate-200">|</span>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-none">Data Source Settings</h1>
              <p className="text-xs text-slate-400 mt-0.5">Manage Google Sheets connections per client or company</p>
            </div>
          </div>
        </div>

        {/* Active badge */}
        {activeConfig ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700">Active: {activeConfig.label}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs font-semibold text-amber-700">Using Demo Data</span>
          </div>
        )}
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ---- ACTIVE CONFIG BANNER ---- */}
        {activeConfig && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-100 uppercase tracking-widest">Currently Active</p>
                  <h3 className="text-xl font-bold mt-0.5">{activeConfig.label}</h3>
                  <p className="text-sm text-emerald-100 mt-1 font-mono">
                    Sheet ID: {(activeConfig.sheetId || activeConfig.seoSheetId || '').slice(0, 16)}...
                  </p>
                </div>
              </div>
              <button
                onClick={handleClearActive}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all border border-white/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Switch to Demo Data
              </button>
            </div>
          </div>
        )}

        {currentUser && canShare && activeConfig && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Share Viewer Access</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Grant a client email access to this company’s dashboard data for a limited time.
                </p>
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Active source: {activeConfig.label}
              </span>
            </div>

            {isViewer ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
                <div className="font-semibold">Viewer Mode</div>
                <p className="mt-2 text-slate-500">
                  You are signed in as a viewer. The shared data source is fixed and cannot be changed from this page.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-[1.5fr_0.8fr_0.7fr]">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Client Email</label>
                    <input
                      value={shareEmail}
                      onChange={e => setShareEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 text-sm text-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Duration</label>
                    <select
                      value={shareDuration}
                      onChange={e => setShareDuration(Number(e.target.value))}
                      className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
                    >
                      <option value={15}>15 days</option>
                      <option value={30}>30 days</option>
                      <option value={90}>90 days</option>
                      <option value={36500}>Infinite</option>
                    </select>
                  </div>
                  <div className="self-end">
                    <button
                      onClick={handleShareGrant}
                      disabled={!shareEmail.trim() || shareLoading || shareSections.length === 0}
                      className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-3 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {shareLoading ? 'Sharing...' : 'Share Access'}
                    </button>
                  </div>
                </div>

                {/* Section selection checkboxes */}
                <div className="border-t border-slate-100 pt-4">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Dashboard Sections to Share</label>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-3">
                    {[
                      { id: 'keywords', label: 'Keyword Rankings' },
                      { id: 'traffic', label: 'Traffic Analytics' },
                      { id: 'ads', label: 'Ads Performance' },
                      { id: 'leads', label: 'Leads Report' },
                      { id: 'roi', label: 'ROI & Financials' },
                      { id: 'batch', label: 'Batch-wise Revenue' },
                      { id: 'revenue', label: 'Revenue & Conversion' },
                      { id: 'site', label: 'Site Status' }
                    ].map(sec => {
                      const isChecked = shareSections.includes(sec.id)
                      const isUserRole = currentUser?.role === 'user'
                      const isDisabled = isUserRole && !['keywords', 'traffic'].includes(sec.id)
                      const checkedValue = isDisabled ? false : isChecked

                      return (
                        <label 
                          key={sec.id} 
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 border rounded-xl cursor-pointer select-none text-xs font-semibold text-slate-700 transition-colors",
                            isDisabled ? "opacity-40 cursor-not-allowed bg-slate-50" : "hover:bg-slate-50"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checkedValue}
                            disabled={isDisabled}
                            onChange={() => {
                              if (isDisabled) return
                              setShareSections(prev => 
                                isChecked ? prev.filter(x => x !== sec.id) : [...prev, sec.id]
                              )
                            }}
                            className="rounded text-violet-600 focus:ring-violet-400 disabled:opacity-50"
                          />
                          {sec.label}
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {shareMessage && (
              <div className={cn(
                'rounded-2xl px-4 py-3 text-sm font-medium',
                shareMessage.type === 'ok'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              )}>
                {shareMessage.text}
              </div>
            )}

            {ownerGrants.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Active viewer access</p>
                  <p className="mt-3 text-3xl font-bold text-slate-900">{activeViewerCount}</p>
                  <p className="text-sm text-slate-500 mt-1">viewer{activeViewerCount === 1 ? '' : 's'} granted</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Next expiration</p>
                  <p className="mt-3 text-3xl font-bold text-slate-900">{formatTimeRemaining(nextExpiryAt)}</p>
                  <p className="text-sm text-slate-500 mt-1">from the soonest grant</p>
                </div>
              </div>
            )}

            {ownerGrants.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-700">Current viewer access grants</div>
                <div className="grid gap-3">
                  {ownerGrants.map(grant => {
                    const { name: displayName, allowed } = parseGrantLabel(grant.label)
                    return (
                      <div key={grant.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-in fade-in duration-200">
                        <div className="space-y-2 text-sm flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900">{grant.recipientEmail}</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-xs text-slate-500 font-medium">Source: {displayName}</span>
                          </div>
                          
                          {/* Allowed sections tags */}
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {allowed.map(sec => (
                              <span key={sec} className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-bold uppercase tracking-wider">
                                {sec === 'site' ? 'site status' : sec === 'keywords' ? 'keywords' : sec === 'traffic' ? 'traffic' : sec === 'leads' ? 'leads' : sec === 'roi' ? 'ROI & Financials' : sec === 'batch' ? 'Batch Revenue' : sec === 'revenue' ? 'revenue' : sec === 'ads' ? 'ads performance' : sec}
                              </span>
                            ))}
                          </div>

                          <div className="text-[11px] text-slate-500">
                            Expires: {new Date(grant.expiresAt).getFullYear() >= 2076 ? 'Infinite' : `${new Date(grant.expiresAt).toLocaleDateString()} (${formatTimeRemaining(grant.expiresAt)})`}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Share link:
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <code className="truncate max-w-[18rem] rounded-xl bg-slate-100 px-2 py-1 text-[11px] text-slate-700">
                                {typeof window !== 'undefined'
                                  ? `${window.location.origin}/viewer/${grant.id}?from=/traffic`
                                  : `/viewer/${grant.id}?from=/traffic`}
                              </code>
                              <button
                                type="button"
                                onClick={() => handleCopyShareUrl(grant.id)}
                                className="rounded-xl bg-slate-900 text-white px-2 py-1 text-[11px] font-semibold transition-colors hover:bg-slate-800"
                              >
                                {copiedShareId === grant.id ? 'Copied' : 'Copy Link'}
                              </button>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevokeGrant(grant.id)}
                          disabled={shareLoading}
                          className="self-start sm:self-auto rounded-xl bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Revoke Access
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      {canEditConfigs && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Form Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    {editingConfig ? (
                      <><RefreshCw className="w-4 h-4 text-violet-500" /> Edit Configuration</>
                    ) : (
                      <><Plus className="w-4 h-4 text-emerald-500" /> Add New Configuration</>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {editingConfig ? `Editing "${editingConfig.label}"` : 'Connect a Google Sheet to power this dashboard'}
                  </p>
                </div>
                {editingConfig && (
                  <button
                    onClick={handleCancelEdit}
                    disabled={isViewer}
                    className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="p-6 space-y-5">
                {/* Label */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Client / Company Name
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    placeholder="e.g. IT Training Hub, Acme Corp..."
                    disabled={isViewer}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400 transition-all disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200"
                  />
                </div>
                {/* Google Sheets URLs */}
                <div className="space-y-4 border-t border-slate-100 pt-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Google Sheets Group URLs
                  </h3>

                  {/* SEO, Traffic, Site Status Sheet */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-slate-400" />
                      1. SEO & Traffic Sheet (Keywords, Traffic, Site Status)
                    </label>
                    <input
                      type="text"
                      value={seoUrl}
                      onChange={e => setSeoUrl(e.target.value)}
                      placeholder="Spreadsheet URL or ID (optional - uses demo data if empty)"
                      disabled={isViewer}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-sm text-slate-800 placeholder:text-slate-400 transition-all disabled:bg-slate-100 disabled:text-slate-500"
                    />
                    {seoUrl.trim() && (
                      <div className={cn(
                        "flex items-center gap-2 mt-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono border",
                        isValidSheetId(derivedSeoId) ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-600"
                      )}>
                        {isValidSheetId(derivedSeoId) ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        <span className="truncate">SEO Sheet ID: {derivedSeoId || 'Invalid'}</span>
                      </div>
                    )}
                  </div>

                  {/* Leads Sheet */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-slate-400" />
                      2. Leads Report Sheet
                    </label>
                    <input
                      type="text"
                      value={leadsUrl}
                      onChange={e => setLeadsUrl(e.target.value)}
                      placeholder="Spreadsheet URL or ID (optional - uses demo data if empty)"
                      disabled={isViewer}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-sm text-slate-800 placeholder:text-slate-400 transition-all disabled:bg-slate-100 disabled:text-slate-500"
                    />
                    {leadsUrl.trim() && (
                      <div className={cn(
                        "flex items-center gap-2 mt-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono border",
                        isValidSheetId(derivedLeadsId) ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-600"
                      )}>
                        {isValidSheetId(derivedLeadsId) ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        <span className="truncate">Leads Sheet ID: {derivedLeadsId || 'Invalid'}</span>
                      </div>
                    )}
                  </div>

                  {/* TeleCRM Integration */}
                  <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 space-y-3 mt-3">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      TeleCRM Live Sync Integration
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Configure your TeleCRM API credentials to fetch live leads dynamically. Leave empty to use fallback sheet or mock data.
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Enterprise ID</label>
                        <input
                          type="text"
                          value={telecrmEnterpriseId}
                          onChange={e => setTelecrmEnterpriseId(e.target.value)}
                          placeholder="e.g. 68ca5820ff2a..."
                          disabled={isViewer}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-xs font-medium text-slate-800 placeholder:text-slate-400 transition-all disabled:bg-slate-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">API Sync Token</label>
                        <div className="relative">
                          <input
                            type={showTelecrmToken ? 'text' : 'password'}
                            value={telecrmApiToken}
                            onChange={e => setTelecrmApiToken(e.target.value)}
                            placeholder="fcfd6918..."
                            disabled={isViewer}
                            className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-xs font-mono text-slate-805 placeholder:text-slate-400 placeholder:font-sans transition-all disabled:bg-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => setShowTelecrmToken(v => !v)}
                            disabled={isViewer}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
                          >
                            {showTelecrmToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Sheet */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-slate-400" />
                      3. Revenue & Conversion Sheet
                    </label>
                    <input
                      type="text"
                      value={revenueUrl}
                      onChange={e => setRevenueUrl(e.target.value)}
                      placeholder="Spreadsheet URL or ID (optional - uses demo data if empty)"
                      disabled={isViewer}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-sm text-slate-800 placeholder:text-slate-400 transition-all disabled:bg-slate-100 disabled:text-slate-500"
                    />
                    {revenueUrl.trim() && (
                      <div className={cn(
                        "flex items-center gap-2 mt-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono border",
                        isValidSheetId(derivedRevenueId) ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-600"
                      )}>
                        {isValidSheetId(derivedRevenueId) ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        <span className="truncate">Revenue Sheet ID: {derivedRevenueId || 'Invalid'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* API Key */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    Google Sheets API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      disabled={isViewer}
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-sm font-mono text-slate-800 placeholder:text-slate-400 placeholder:font-sans transition-all disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(v => !v)}
                      disabled={isViewer}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Get your key from{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-500 hover:underline font-medium"
                    >
                      Google Cloud Console → Credentials
                    </a>
                    {' '}with Sheets API enabled
                  </p>
                </div>

                {/* GA4 Integration Section */}
                <div className="space-y-4 border-t border-slate-100 pt-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Google Analytics (GA4) Automated Sync
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      GA4 Property ID
                    </label>
                    <input
                      type="text"
                      value={gaPropertyId}
                      onChange={e => setGaPropertyId(e.target.value)}
                      placeholder="e.g. 423589412"
                      disabled={isViewer}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-sm text-slate-800 placeholder:text-slate-400 transition-all disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Service Account Client Email
                    </label>
                    <input
                      type="text"
                      value={gaClientEmail}
                      onChange={e => setGaClientEmail(e.target.value)}
                      placeholder="e.g. ga-sync@project-id.iam.gserviceaccount.com"
                      disabled={isViewer}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-sm text-slate-800 placeholder:text-slate-400 transition-all disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Service Account Private Key
                    </label>
                    <textarea
                      value={gaPrivateKey}
                      onChange={e => setGaPrivateKey(e.target.value)}
                      placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQ...\n-----END PRIVATE KEY-----"
                      disabled={isViewer}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-xs font-mono text-slate-800 placeholder:text-slate-400 transition-all disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>

                  {(derivedSeoId || (activeConfig?.seoSheetId || activeConfig?.sheetId)) && gaPropertyId.trim() && gaClientEmail.trim() && gaPrivateKey.trim() && (
                    <div className="pt-1 space-y-3">
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          onClick={handleSyncGa4}
                          disabled={syncStatus === 'syncing' || syncMonthlyStatus === 'syncing'}
                          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-750 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-violet-600/10 disabled:opacity-50"
                        >
                          {syncStatus === 'syncing' ? (
                            <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing GA4 Daily...</>
                          ) : (
                            <><RefreshCw className="w-3.5 h-3.5" /> Sync Yesterday's GA4 Traffic Now</>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleSyncGa4Monthly}
                          disabled={syncStatus === 'syncing' || syncMonthlyStatus === 'syncing'}
                          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50"
                        >
                          {syncMonthlyStatus === 'syncing' ? (
                            <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing GA4 Monthly...</>
                          ) : (
                            <><RefreshCw className="w-3.5 h-3.5" /> Sync Monthly GA4 Traffic Now</>
                          )}
                        </button>
                      </div>

                      {syncStatus !== 'idle' && (
                        <div className={cn(
                          "flex items-start gap-2.5 mt-2.5 px-3 py-2 rounded-lg border text-xs font-medium",
                          syncStatus === 'success' && "bg-emerald-50 border-emerald-100 text-emerald-700",
                          syncStatus === 'error' && "bg-red-50 border-red-100 text-red-600"
                        )}>
                          {syncStatus === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                          <span>{syncMessage}</span>
                        </div>
                      )}

                      {syncMonthlyStatus !== 'idle' && (
                        <div className={cn(
                          "flex items-start gap-2.5 mt-2.5 px-3 py-2 rounded-lg border text-xs font-medium",
                          syncMonthlyStatus === 'success' && "bg-emerald-50 border-emerald-100 text-emerald-700",
                          syncMonthlyStatus === 'error' && "bg-red-50 border-red-100 text-red-600"
                        )}>
                          {syncMonthlyStatus === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                          <span>{syncMonthlyMessage}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Meta & Google Ads API Credentials */}
                <div className="space-y-4 border-t border-slate-100 pt-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <span>📢</span> Meta & Google Ads API Credentials
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Provide credentials to fetch live ad performance data. Leave empty to use fallback mock data.
                  </p>

                  {/* Meta Ads Group */}
                  <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Meta Ads Integration
                    </h4>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ad Account ID</label>
                        <input
                          type="text"
                          value={metaAdAccountId}
                          onChange={e => setMetaAdAccountId(e.target.value)}
                          placeholder="e.g. act_1234567890"
                          disabled={isViewer}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-xs font-medium text-slate-800 placeholder:text-slate-400 transition-all disabled:bg-slate-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Access Token</label>
                        <div className="relative">
                          <input
                            type={showMetaToken ? 'text' : 'password'}
                            value={metaAccessToken}
                            onChange={e => setMetaAccessToken(e.target.value)}
                            placeholder="EAAb..."
                            disabled={isViewer}
                            className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-xs font-mono text-slate-800 placeholder:text-slate-400 placeholder:font-sans transition-all disabled:bg-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => setShowMetaToken(v => !v)}
                            disabled={isViewer}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
                          >
                            {showMetaToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Prepaid Balance (₹)</label>
                        <input
                          type="number"
                          value={metaPrepaidBalance}
                          onChange={e => setMetaPrepaidBalance(e.target.value)}
                          placeholder="e.g. 15000"
                          disabled={isViewer}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-xs font-medium text-slate-800 placeholder:text-slate-400 transition-all disabled:bg-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Google Ads Group */}
                  <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Google Ads Integration
                    </h4>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer ID</label>
                        <input
                          type="text"
                          value={googleCustomerId}
                          onChange={e => setGoogleCustomerId(e.target.value)}
                          placeholder="e.g. 123-456-7890"
                          disabled={isViewer}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-xs font-medium text-slate-800 placeholder:text-slate-400 transition-all disabled:bg-slate-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Developer Token</label>
                        <div className="relative">
                          <input
                            type={showGoogleDevToken ? 'text' : 'password'}
                            value={googleDeveloperToken}
                            onChange={e => setGoogleDeveloperToken(e.target.value)}
                            placeholder="Dev Token"
                            disabled={isViewer}
                            className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-xs font-mono text-slate-800 placeholder:text-slate-400 placeholder:font-sans transition-all disabled:bg-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGoogleDevToken(v => !v)}
                            disabled={isViewer}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
                          >
                            {showGoogleDevToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Client ID</label>
                        <input
                          type="text"
                          value={googleClientId}
                          onChange={e => setGoogleClientId(e.target.value)}
                          placeholder="OAuth Client ID"
                          disabled={isViewer}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-xs text-slate-800 placeholder:text-slate-400 transition-all disabled:bg-slate-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Client Secret</label>
                        <div className="relative">
                          <input
                            type={showGoogleClientSecret ? 'text' : 'password'}
                            value={googleClientSecret}
                            onChange={e => setGoogleClientSecret(e.target.value)}
                            placeholder="OAuth Client Secret"
                            disabled={isViewer}
                            className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-xs font-mono text-slate-800 placeholder:text-slate-400 placeholder:font-sans transition-all disabled:bg-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGoogleClientSecret(v => !v)}
                            disabled={isViewer}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
                          >
                            {showGoogleClientSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Refresh Token</label>
                        <div className="relative">
                          <input
                            type={showGoogleRefreshToken ? 'text' : 'password'}
                            value={googleRefreshToken}
                            onChange={e => setGoogleRefreshToken(e.target.value)}
                            placeholder="OAuth Refresh Token"
                            disabled={isViewer}
                            className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-xs font-mono text-slate-800 placeholder:text-slate-400 placeholder:font-sans transition-all disabled:bg-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGoogleRefreshToken(v => !v)}
                            disabled={isViewer}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
                          >
                            {showGoogleRefreshToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Manager ID (Optional)</label>
                        <input
                          type="text"
                          value={googleManagerId}
                          onChange={e => setGoogleManagerId(e.target.value)}
                          placeholder="MCC / Manager ID"
                          disabled={isViewer}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-xs font-medium text-slate-800 placeholder:text-slate-400 transition-all disabled:bg-slate-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Prepaid Balance (₹)</label>
                        <input
                          type="number"
                          value={googlePrepaidBalance}
                          onChange={e => setGooglePrepaidBalance(e.target.value)}
                          placeholder="e.g. 20000"
                          disabled={isViewer}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-xs font-medium text-slate-800 placeholder:text-slate-400 transition-all disabled:bg-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Result Banner */}
                {testStatus !== 'idle' && (
                  <div className={cn(
                    "flex items-start gap-3 px-4 py-3 rounded-xl border text-sm",
                    testStatus === 'testing' && "bg-blue-50 border-blue-200 text-blue-700",
                    testStatus === 'success' && "bg-emerald-50 border-emerald-200 text-emerald-700",
                    testStatus === 'error' && "bg-red-50 border-red-200 text-red-700"
                  )}>
                    {testStatus === 'testing' && <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />}
                    {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                    {testStatus === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                    <p className="text-xs font-medium leading-relaxed">
                      {testStatus === 'testing' ? 'Testing connection to Google Sheets...' : testMessage}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleTest}
                    disabled={isViewer || !(isValidSheetId(derivedSeoId) || isValidSheetId(derivedLeadsId) || isValidSheetId(derivedRevenueId)) || !isValidApiKey(apiKey) || testStatus === 'testing'}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-violet-400 bg-white hover:bg-violet-50 text-slate-600 hover:text-violet-700 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-4 h-4" />
                    Test Connection
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={isViewer || !formIsValid || saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-slate-900/10 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {editingConfig ? 'Update Configuration' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </div>

            {/* How-to guide */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <span className="text-base">📋</span> How to Set Up Google Sheets API
              </h3>
              <ol className="space-y-3 text-xs text-slate-600">
                {[
                  { n: 1, text: 'Open your Google Sheet. Copy the URL from the browser address bar and paste it above.' },
                  { n: 2, text: 'Go to console.cloud.google.com → Enable the Google Sheets API for your project.' },
                  { n: 3, text: 'In Credentials, create a new API Key. Restrict it to the Sheets API only.' },
                  { n: 4, text: 'Make your Google Sheet viewable: Share → Anyone with the link → Viewer.' },
                  { n: 5, text: 'Paste the API key above, click Test Connection, then Save.' },
                ].map(step => (
                  <li key={step.n} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">{step.n}</span>
                    <span className="leading-relaxed">{step.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* ---- RIGHT: SAVED CONFIGS ---- */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              Saved Configurations
              <span className="ml-auto text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {savedConfigs.length}
              </span>
            </h2>

            {savedConfigs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-500">No configurations saved</p>
                <p className="text-xs text-slate-400 mt-1">Add your first Google Sheet connection using the form on the left.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedConfigs.map(cfg => {
                  const isActive = activeConfig?.label === cfg.label
                  return (
                    <div
                      key={cfg.label}
                      className={cn(
                        "bg-white rounded-2xl border shadow-sm transition-all duration-150",
                        isActive
                          ? "border-emerald-300 shadow-emerald-100 ring-1 ring-emerald-200"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                              isActive ? "bg-emerald-100" : "bg-slate-100"
                            )}>
                              <Building2 className={cn("w-4 h-4", isActive ? "text-emerald-600" : "text-slate-500")} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{cfg.label}</p>
                              {isActive && (
                                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-400 space-y-0.5 mb-3 pl-10 font-mono">
                          {(cfg.seoSheetId || cfg.sheetId) && <div className="truncate">SEO: {(cfg.seoSheetId || cfg.sheetId || '').slice(0, 12)}...</div>}
                          {cfg.leadsSheetId && <div className="truncate">Leads Sheet: {cfg.leadsSheetId.slice(0, 12)}...</div>}
                          {cfg.telecrmEnterpriseId && <div className="truncate text-emerald-600">TeleCRM Live ID: {cfg.telecrmEnterpriseId.slice(0, 12)}...</div>}
                          {cfg.revenueSheetId && <div className="truncate">Rev: {cfg.revenueSheetId.slice(0, 12)}...</div>}
                          {!cfg.seoSheetId && !cfg.sheetId && !cfg.leadsSheetId && !cfg.revenueSheetId && <div>All Demo Data</div>}
                        </div>

                        <div className="flex items-center gap-2">
                          {!isActive && (
                            <button
                              onClick={() => handleActivate(cfg)}
                              disabled={isViewer}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <ChevronRight className="w-3 h-3" />
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(cfg)}
                            disabled={isViewer}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-violet-100 hover:text-violet-700 text-slate-600 text-xs font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(cfg)}
                            disabled={isViewer}
                            className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-400 text-xs rounded-lg transition-all border border-slate-200 hover:border-red-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Quick Links</p>
              {[
                { href: '/', label: 'Keyword Rankings Overview', icon: '📊' },
                { href: '/traffic', label: 'Traffic Analytics', icon: '📈' },
                { href: '/compare', label: 'Compare Months', icon: '⚖️' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-sm text-slate-600 hover:text-slate-800 transition-all group"
                >
                  <span>{link.icon}</span>
                  <span className="font-medium">{link.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-300 group-hover:text-slate-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
