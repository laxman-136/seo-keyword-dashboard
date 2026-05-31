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
import { cn } from '@/lib/utils'

type TestStatus = 'idle' | 'testing' | 'success' | 'error'

export default function SettingsPage() {
  // Form state
  const [label, setLabel] = useState('')
  const [sheetUrl, setSheetUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  // UI state
  const [savedConfigs, setSavedConfigs] = useState<SheetConfig[]>([])
  const [activeConfig, setActiveConfigState] = useState<SheetConfig | null>(null)
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [editingConfig, setEditingConfig] = useState<SheetConfig | null>(null)

  // Load configs from localStorage
  const loadConfigs = useCallback(() => {
    setSavedConfigs(getSavedConfigs())
    setActiveConfigState(getActiveConfig())
  }, [])

  useEffect(() => {
    loadConfigs()
  }, [loadConfigs])

  // When editing a config, populate the form
  const handleEdit = (config: SheetConfig) => {
    setEditingConfig(config)
    setLabel(config.label)
    setSheetUrl(config.sheetId)
    setApiKey(config.apiKey)
    setTestStatus('idle')
    setTestMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingConfig(null)
    setLabel('')
    setSheetUrl('')
    setApiKey('')
    setTestStatus('idle')
    setTestMessage('')
  }

  const derivedSheetId = extractSheetId(sheetUrl)
  const formIsValid = label.trim().length > 0
    && isValidSheetId(derivedSheetId)
    && isValidApiKey(apiKey)

  // Test connection to Google Sheets
  const handleTest = async () => {
    if (!isValidSheetId(derivedSheetId) || !isValidApiKey(apiKey)) return
    setTestStatus('testing')
    setTestMessage('')

    try {
      const url = `/api/keywords?sheetId=${encodeURIComponent(derivedSheetId)}&apiKey=${encodeURIComponent(apiKey.trim())}`
      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || 'API error')

      if (data.isMock) {
        setTestStatus('error')
        setTestMessage('Connection failed — falling back to demo data. Check your Sheet ID and API Key.')
      } else {
        setTestStatus('success')
        setTestMessage(`✓ Connected! Found ${data.rows?.length ?? 0} keyword rows and ${data.months?.length ?? 0} months of data.`)
      }
    } catch (err: unknown) {
      setTestStatus('error')
      setTestMessage(`Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // Save config
  const handleSave = () => {
    if (!formIsValid) return
    setSaving(true)

    const config: SheetConfig = {
      label: label.trim(),
      sheetId: derivedSheetId,
      apiKey: apiKey.trim(),
      createdAt: editingConfig?.createdAt || new Date().toISOString()
    }

    saveConfig(config)

    // Auto-activate on first save or if editing the active one
    const active = getActiveConfig()
    if (!active || active.label === config.label) {
      setActiveConfig(config)
    }

    loadConfigs()
    setSaving(false)
    setEditingConfig(null)
    setLabel('')
    setSheetUrl('')
    setApiKey('')
    setTestStatus('idle')
    setTestMessage('')
  }

  const handleActivate = (config: SheetConfig) => {
    setActiveConfig(config)
    loadConfigs()
  }

  const handleDelete = (cfg: SheetConfig) => {
    if (!window.confirm(`Delete config "${cfg.label}"? This cannot be undone.`)) return
    deleteConfig(cfg.label)
    loadConfigs()
  }

  const handleClearActive = () => {
    clearActiveConfig()
    loadConfigs()
  }

  const handleCopyId = () => {
    if (!derivedSheetId) return
    navigator.clipboard.writeText(derivedSheetId)
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
                    Sheet ID: {activeConfig.sheetId.slice(0, 16)}...
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ---- LEFT: ADD / EDIT FORM ---- */}
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
                  <button onClick={handleCancelEdit} className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors">
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400 transition-all"
                  />
                </div>

                {/* Google Sheet URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-slate-400" />
                    Google Sheet URL or Sheet ID
                  </label>
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={e => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-sm text-slate-800 placeholder:text-slate-400 transition-all"
                  />
                  {/* Extracted ID preview */}
                  {sheetUrl.trim() && (
                    <div className={cn(
                      "flex items-center gap-2 mt-2 px-3 py-2 rounded-lg text-xs font-mono border",
                      isValidSheetId(derivedSheetId)
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-red-50 border-red-200 text-red-600"
                    )}>
                      {isValidSheetId(derivedSheetId)
                        ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                      <span className="flex-1 truncate">
                        {isValidSheetId(derivedSheetId)
                          ? `Extracted ID: ${derivedSheetId}`
                          : 'Could not extract a valid Sheet ID'}
                      </span>
                      {isValidSheetId(derivedSheetId) && (
                        <button onClick={handleCopyId} className="shrink-0 hover:opacity-70 transition-opacity">
                          {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Paste the full Google Sheets URL or just the Spreadsheet ID
                  </p>
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
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-sm font-mono text-slate-800 placeholder:text-slate-400 placeholder:font-sans transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
                    disabled={!isValidSheetId(derivedSheetId) || !isValidApiKey(apiKey) || testStatus === 'testing'}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-violet-400 bg-white hover:bg-violet-50 text-slate-600 hover:text-violet-700 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-4 h-4" />
                    Test Connection
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={!formIsValid || saving}
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

                        <p className="text-[11px] text-slate-400 font-mono truncate mb-3 pl-10">
                          {cfg.sheetId.slice(0, 20)}...
                        </p>

                        <div className="flex items-center gap-2">
                          {!isActive && (
                            <button
                              onClick={() => handleActivate(cfg)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all"
                            >
                              <ChevronRight className="w-3 h-3" />
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(cfg)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-violet-100 hover:text-violet-700 text-slate-600 text-xs font-semibold rounded-lg transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(cfg)}
                            className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-400 text-xs rounded-lg transition-all border border-slate-200 hover:border-red-200"
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
      </div>
    </div>
  )
}
