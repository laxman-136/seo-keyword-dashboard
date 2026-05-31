'use strict';
'use client';

import React, { useState, useEffect } from 'react'
import { Lock, AlertCircle, Sparkles } from 'lucide-react'

interface PasswordGateProps {
  children: React.ReactNode
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [error, setError] = useState(false)

  const envPassword = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD

  useEffect(() => {
    // If no password environment variable is defined, bypass authentication
    if (!envPassword) {
      setIsAuthenticated(true)
      return
    }

    const sessionAuth = sessionStorage.getItem('seo_dashboard_auth')
    if (sessionAuth === 'true') {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
  }, [envPassword])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === envPassword) {
      sessionStorage.setItem('seo_dashboard_auth', 'true')
      setIsAuthenticated(true)
      setError(false)
    } else {
      setError(true)
      setPassword('')
    }
  }

  // Prevent flash of screen before state loads
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
        {/* Aesthetic Background Accents */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md glass-panel-dark p-8 rounded-2xl shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 animate-pulse">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              SEO Rankings <span className="text-emerald-400"><Sparkles className="w-5 h-5 fill-current" /></span>
            </h1>
            <p className="text-slate-400 text-sm mt-2 text-center">
              Please enter the dashboard security key to access monthly keyword intelligence.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Security Password
              </label>
              <input
                id="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-950/30 border border-red-900/50 px-4 py-3 rounded-xl text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>Incorrect security password. Please try again.</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-200"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
