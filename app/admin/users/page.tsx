'use client'
// app/admin/users/page.tsx — Admin User Management Panel
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Users, CheckCircle2, XCircle, Trash2, Shield, ShieldAlert,
  RefreshCw, ArrowLeft, Clock, UserCheck, UserX, Crown,
  AlertCircle, Download, Copy, Check
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Must match SUPER_ADMIN_EMAIL in the API route
const SUPER_ADMIN_EMAIL = 'laxmansubramanyam@gmail.com'

type Role   = 'superadmin' | 'admin' | 'ceo' | 'user'
type Status = 'approved' | 'pending' | 'rejected'

interface UserRow {
  email: string
  name: string
  role: Role
  status: Status
  createdAt: string
  approvedAt?: string
  approvedBy?: string
}

interface Me { email: string; name: string; role: Role }

interface GrantSummaryRow {
  ownerEmail: string
  label: string
  sheetId: string
  viewerCount: number
  nextExpiry: string
}

const STATUS_BADGE: Record<Status, string> = {
  approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  pending:  'bg-amber-500/15  text-amber-400  border-amber-500/25',
  rejected: 'bg-red-500/15   text-red-400   border-red-500/25'
}

const ROLE_BADGE: Record<Role, string> = {
  superadmin: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
  admin:      'bg-blue-500/15   text-blue-400   border-blue-500/25',
  ceo:        'bg-amber-500/15  text-amber-400  border-amber-500/25',
  user:       'bg-slate-500/15  text-slate-400  border-slate-500/25'
}

const ROLE_ICON: Record<Role, React.ReactNode> = {
  superadmin: <Crown className="w-3 h-3" />,
  admin:      <Shield className="w-3 h-3" />,
  ceo:        <Crown className="w-3 h-3 text-amber-500" />,
  user:       <span className="w-3 h-3 inline-flex items-center justify-center text-[10px]">U</span>
}

export default function AdminUsersPage() {
  const [users, setUsers]   = useState<UserRow[]>([])
  const [me, setMe]         = useState<Me | null>(null)
  const [grantSummaries, setGrantSummaries] = useState<GrantSummaryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [exportData, setExportData] = useState('')
  const [copied, setCopied] = useState(false)
  const [filter, setFilter] = useState<Status | 'all'>('all')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const [meRes, usersRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/admin/users?includeGrants=true')
    ])
    if (meRes.ok) setMe((await meRes.json()).user)

    if (usersRes.ok) {
      const data = await usersRes.json()
      setUsers(data.users)
      if (Array.isArray(data.grantSummaries)) {
        setGrantSummaries(data.grantSummaries)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const formatExpiry = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 'Expired'
    const days = Math.floor(diff / 86400000)
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
    const hours = Math.floor(diff / 3600000)
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
    const minutes = Math.ceil(diff / 60000)
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }

  const action = async (act: string, targetEmail: string, role?: string) => {
    setActionMsg(null)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: act, targetEmail, role })
    })
    const data = await res.json()
    setActionMsg({ type: res.ok ? 'ok' : 'err', text: data.message || data.error })
    if (res.ok) fetchUsers()
  }

  const handleExport = async () => {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'export', targetEmail: 'system' })
    })
    const data = await res.json()
    if (data.data) setExportData(data.data)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(exportData)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pending  = users.filter(u => u.status === 'pending')
  const filtered = filter === 'all' ? users : users.filter(u => u.status === filter)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading users...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <span className="text-slate-200">|</span>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-none">User Management</h1>
              <p className="text-xs text-slate-400 mt-0.5">Approve, reject and manage dashboard access</p>
            </div>
          </div>
        </div>

        {/* Pending badge */}
        {pending.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-semibold text-amber-700">{pending.length} pending approval</span>
          </div>
        )}
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Action feedback */}
        {actionMsg && (
          <div className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium',
            actionMsg.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700'
          )}>
            {actionMsg.type === 'ok'
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <AlertCircle  className="w-4 h-4 shrink-0" />}
            {actionMsg.text}
            <button onClick={() => setActionMsg(null)} className="ml-auto text-current opacity-50 hover:opacity-80">✕</button>
          </div>
        )}

        {/* Pending requests — highlighted */}
        {pending.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-amber-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h2 className="font-bold text-amber-800 text-sm">Pending Approval Requests ({pending.length})</h2>
            </div>
            <div className="divide-y divide-amber-100">
              {pending.map(u => (
                <div key={u.email} className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-slate-800">{u.name}</p>
                    <p className="text-sm text-slate-500">{u.email}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Requested {new Date(u.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => action('approve', u.email)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => action('reject', u.email)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl transition-all border border-red-200"
                    >
                      <UserX className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {grantSummaries.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {grantSummaries.map(summary => (
              <div key={`${summary.ownerEmail}-${summary.sheetId}`} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Source</p>
                    <p className="mt-2 font-semibold text-slate-900">{summary.label || summary.sheetId}</p>
                    <p className="text-xs text-slate-500 mt-1">Owner: {summary.ownerEmail}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right">
                    <p className="text-2xl font-bold text-slate-900">{summary.viewerCount}</p>
                    <p className="text-xs text-slate-500">active viewers</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-slate-500">
                  <p className="font-medium text-slate-700">Next expiration</p>
                  <p className="mt-1 text-slate-500">{formatExpiry(summary.nextExpiry)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All users table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              All Users ({users.length})
            </h2>

            <div className="flex items-center gap-2">
              {/* Filter */}
              <select
                value={filter}
                onChange={e => setFilter(e.target.value as Status | 'all')}
                className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-400"
              >
                <option value="all">All statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              <button onClick={fetchUsers} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(u => {
                  const isSelf          = me?.email.toLowerCase() === u.email.toLowerCase()
                  const isPermanentAdmin = u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
                  const canDelete = !isPermanentAdmin && (
                    me?.role === 'superadmin'
                    || (me?.role === 'admin' && u.role === 'user' && !isSelf)
                  )

                  return (
                    <tr key={u.email} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{u.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{u.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border', ROLE_BADGE[u.role])}>
                          {ROLE_ICON[u.role]}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border', STATUS_BADGE[u.status])}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {u.status === 'pending' && (
                            <>
                              <button onClick={() => action('approve', u.email)} title="Approve" className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-all border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => action('reject', u.email)} title="Reject" className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-all border border-red-200">
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {u.status === 'rejected' && (
                            <button onClick={() => action('approve', u.email)} title="Approve" className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-all border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Role change — super admin only, never for permanent super admin */}
                          {me?.role === 'superadmin' && u.role !== 'superadmin' && !isSelf && !isPermanentAdmin && (
                            <select
                              value={u.role}
                              onChange={e => action('set-role', u.email, e.target.value)}
                              className="text-[11px] border border-slate-200 rounded-lg px-2 py-1 text-slate-600 bg-white outline-none"
                            >
                              <option value="user">user</option>
                              <option value="ceo">ceo</option>
                              <option value="admin">admin</option>
                            </select>
                          )}

                          {/* Delete — hidden for permanent super admin */}
                          {canDelete && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete ${u.name}? This cannot be undone.`)) action('delete', u.email)
                              }}
                              title="Delete user"
                              className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all border border-slate-200 hover:border-red-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Permanent lock badge for super admin row */}
                          {isPermanentAdmin && (
                            <span title="This account is permanently protected" className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-[10px] font-bold text-violet-400">
                              <Crown className="w-3 h-3" /> Protected
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-400 text-sm">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vercel Export Panel — for persisting users on Vercel */}
        {me?.role === 'superadmin' && (
          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-violet-400" />
              <h3 className="font-bold text-white text-sm">Vercel Deployment — Persist User Changes</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              On Vercel, user data resets on each deploy. To persist your changes permanently,
              export the current user list and paste it into your <span className="font-mono text-violet-300">USERS_JSON</span> environment variable in Vercel.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Generate USERS_JSON
              </button>
            </div>
            {exportData && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Copy this value → Vercel Dashboard → Settings → Environment Variables → USERS_JSON</p>
                  <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-semibold">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={exportData}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 outline-none resize-none"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
