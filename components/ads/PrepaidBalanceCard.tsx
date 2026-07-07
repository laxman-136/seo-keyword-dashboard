// components/ads/PrepaidBalanceCard.tsx
'use client';

import React, { useState, useEffect } from 'react'
import { Wallet, Info, AlertTriangle, ArrowUpRight, CheckCircle2, Trash2, Plus, X, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Deposit {
  id: string
  deposit_date: string
  amount: number
  type: 'initial' | 'top-up'
  notes?: string
}

interface PrepaidBalanceCardProps {
  platform: 'meta' | 'google' | 'combined'
  prepaidBalance?: number
  spend: number
  metaPrepaid?: number
  googlePrepaid?: number
  metaSpend?: number
  googleSpend?: number
}

export default function PrepaidBalanceCard({
  platform,
  prepaidBalance,
  spend,
  metaPrepaid,
  googlePrepaid,
  metaSpend,
  googleSpend
}: PrepaidBalanceCardProps) {
  const isCombined = platform === 'combined'
  
  // State for deposits management (Google Ads only)
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  // Form fields
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [type, setType] = useState<'top-up' | 'initial'>('top-up')
  const [notes, setNotes] = useState('')

  const fetchDeposits = async () => {
    if (platform !== 'google') return
    try {
      setLoading(true)
      const res = await fetch('/api/ads/google/deposits')
      if (res.ok) {
        const data = await res.json()
        setDeposits(data)
      }
    } catch (err) {
      console.error('Failed to load deposits:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeposits()
  }, [platform])

  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !date) return

    try {
      setLoading(true)
      const res = await fetch('/api/ads/google/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deposit_date: date,
          amount: Number(amount),
          type,
          notes
        })
      })

      if (res.ok) {
        // Reset form
        setAmount('')
        setNotes('')
        setType('top-up')
        setShowForm(false)
        
        // Refresh local deposits
        await fetchDeposits()
        
        // Trigger dashboard stats refresh
        window.dispatchEvent(new Event('google-deposits-updated'))
      }
    } catch (err) {
      console.error('Failed to save deposit:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDeposit = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this deposit log?')) return

    try {
      setLoading(true)
      const res = await fetch(`/api/ads/google/deposits?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        await fetchDeposits()
        window.dispatchEvent(new Event('google-deposits-updated'))
      }
    } catch (err) {
      console.error('Failed to delete deposit:', err)
    } finally {
      setLoading(false)
    }
  }

  // Resolve prepaid balance based on platform
  const effectivePrepaid = isCombined 
    ? (metaPrepaid || 0) + (googlePrepaid || 0)
    : (prepaidBalance || 0)

  const remaining = Math.max(0, effectivePrepaid - spend)
  const percentUsed = effectivePrepaid > 0 ? (spend / effectivePrepaid) * 100 : 0
  const percentRemaining = Math.max(0, 100 - percentUsed)

  // Determine alert level
  let status: 'healthy' | 'warning' | 'critical' | 'not_configured' = 'healthy'
  if (effectivePrepaid === 0) {
    status = 'not_configured'
  } else if (percentRemaining <= 15) {
    status = 'critical'
  } else if (percentRemaining <= 30) {
    status = 'warning'
  }

  const formatCost = (val: number) => {
    return `₹${Math.round(val).toLocaleString('en-IN')}`
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-205 shadow-sm overflow-hidden flex flex-col lg:flex-row transition-all hover:shadow-md">
      
      {/* Left Column: Wallet Summary */}
      <div className={cn(
        "p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100 shrink-0 lg:w-80",
        status === 'critical' ? "bg-rose-50/10" : status === 'warning' ? "bg-amber-50/10" : "bg-slate-50/10"
      )}>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              {isCombined ? 'Combined Account Wallet' : platform === 'meta' ? 'Meta Ads Balance' : 'Google Ads Balance'}
            </span>
            {status !== 'not_configured' && (
              <span className={cn(
                "text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border tracking-wider flex items-center gap-1",
                status === 'critical' && "bg-rose-50 text-rose-700 border-rose-100",
                status === 'warning' && "bg-amber-50 text-amber-700 border-amber-100",
                status === 'healthy' && "bg-emerald-50 text-emerald-700 border-emerald-100"
              )}>
                {status === 'critical' ? (
                  <><AlertTriangle className="w-2.5 h-2.5" /> Low Funds</>
                ) : status === 'warning' ? (
                  <><AlertTriangle className="w-2.5 h-2.5" /> Moderate Balance</>
                ) : (
                  <><CheckCircle2 className="w-2.5 h-2.5" /> Healthy Balance</>
                )}
              </span>
            )}
          </div>
          
          <div className="mt-4">
            <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Estimated Remaining</span>
            <h3 className={cn(
              "text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 leading-none font-mono",
              status === 'critical' ? "text-rose-600" : "text-slate-800"
            )}>
              {formatCost(remaining)}
            </h3>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-150 flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Prepaid Budget: {formatCost(effectivePrepaid)}</span>
        </div>
      </div>

      {/* Right Column: Details & Interactive Deposit Panel */}
      <div className="p-5 flex-1 flex flex-col md:flex-row justify-between gap-6 bg-white">
        
        {/* Progress Bar & Split Statistics */}
        <div className="flex-1 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              <span>Funding Consumption</span>
              <span className="text-slate-600">{percentRemaining.toFixed(0)}% Funds Available</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  status === 'critical' ? "bg-rose-500" : status === 'warning' ? "bg-amber-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(100, percentRemaining)}%` }}
              />
            </div>
            
            {/* Legend Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-xs font-bold text-slate-650 font-mono">
              <div>
                <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest font-sans">Prepaid Total</span>
                <span className="block text-slate-700 mt-0.5">{formatCost(effectivePrepaid)}</span>
              </div>
              <div>
                <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest font-sans">Ad Spend</span>
                <span className="block text-slate-700 mt-0.5">{formatCost(spend)}</span>
              </div>
              {isCombined && (
                <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3">
                  <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest font-sans">Split By Platform</span>
                  <span className="block text-[10px] text-slate-500 mt-0.5 font-sans font-semibold">
                    Google: <span className="font-mono font-extrabold">{formatCost(googleSpend || 0)}</span> | Meta: <span className="font-mono font-extrabold">{formatCost(metaSpend || 0)}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Disclaimer / Info banner */}
          <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500 leading-normal font-medium">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <p>
              Estimated remaining balance is computed by subtracting your live Google Ads API spend starting from your earliest logged deposit date.
              {status === 'critical' && <strong className="text-rose-600 block mt-1">⚠️ Warning: Balance is running low! Please top up your ad account.</strong>}
            </p>
          </div>
        </div>

        {/* Google-only deposits logging module */}
        {platform === 'google' && (
          <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-slate-450" />
                Prepaid Deposits Log
              </h4>
              <button
                onClick={() => setShowForm(!showForm)}
                className="text-[10px] font-extrabold text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-2 py-1 rounded-md border border-cyan-100 flex items-center gap-1 transition-all"
              >
                {showForm ? <><X className="w-3 h-3" /> Cancel</> : <><Plus className="w-3 h-3" /> Add Log</>}
              </button>
            </div>

            {/* Inline Add Deposit Form */}
            {showForm && (
              <form onSubmit={handleAddDeposit} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2.5 animate-fadeIn">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase">Deposit Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase">Amount (INR)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      placeholder="e.g. 20000"
                      className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase">Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                    >
                      <option value="top-up">Top-up Deposit</option>
                      <option value="initial">Initial Balance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase">Notes (Optional)</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. UPI Ref 3829"
                      className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Deposit Log'}
                </button>
              </form>
            )}

            {/* Deposits History List */}
            <div className="max-h-[140px] overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {deposits.length > 0 ? (
                deposits.map((dep) => (
                  <div key={dep.id} className="p-2 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800 font-mono">{formatCost(dep.amount)}</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border tracking-wider",
                          dep.type === 'initial' ? 'bg-cyan-50 text-cyan-700 border-cyan-150' : 'bg-slate-50 text-slate-600 border-slate-150'
                        )}>
                          {dep.type === 'initial' ? 'Initial' : 'Top-up'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 shrink-0" />
                        <span>{new Date(dep.deposit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {dep.notes && <span className="text-slate-450 italic">• {dep.notes}</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteDeposit(dep.id)}
                      disabled={loading}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-400 text-[10px] font-medium leading-relaxed">
                  No deposits logged yet.<br />Click "Add Log" to record your starting balance.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  )
}
