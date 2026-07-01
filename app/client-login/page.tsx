'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, ArrowRight, Loader2 } from 'lucide-react'

export default function ClientLoginPage() {
  const router = useRouter()
  const [from, setFrom] = useState('/')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const rawFrom = params.get('from') || '/'
    setFrom(rawFrom.startsWith('/') && !rawFrom.startsWith('//') ? rawFrom : '/')
  }, [])

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/access-grants/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })
      const data = await res.json()
      setLoading(false)
      if (!res.ok) {
        setError(data?.error || 'Unable to sign in')
        return
      }

      // Hard redirect so cookie is used on next render
      window.location.href = from
    } catch (err: any) {
      setLoading(false)
      setError(err?.message || 'Network error')
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-violet-500/30 mb-3">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Client Access</h1>
          <p className="text-slate-400 text-sm mt-1">Enter your email to view shared dashboard data</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-6 shadow-2xl shadow-black/40">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="client@example.com"
                className="w-full bg-slate-800/60 border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
              />
            </div>

            {error && (
              <div className="text-sm text-red-300 bg-red-500/10 px-3 py-2 rounded-xl">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-violet-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : <><ArrowRight className="w-4 h-4" /> View Dashboard</>}
            </button>
          </form>

          <p className="text-xs text-slate-400 mt-4">This signs you in as a viewer for any active grants associated with your email.</p>
        </div>
      </div>
    </div>
  )
}
