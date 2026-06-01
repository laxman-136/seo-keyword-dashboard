// app/page.tsx
'use client';

import React, { useEffect, useState } from 'react'
import { useKeywordData } from '@/hooks/useKeywordData'
import Header from '@/components/layout/Header'
import KPICard from '@/components/ui/KPICard'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import PageDistributionChart from '@/components/charts/PageDistributionChart'
import MovementDonutChart from '@/components/charts/MovementDonutChart'
import GroupPerformanceChart from '@/components/charts/GroupPerformanceChart'
import KeywordsTable from '@/components/tables/KeywordsTable'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'

export default function OverviewDashboard() {
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null)
  const {
    keywords,
    stats,
    groupSummaries,
    isMock,
    fallbackReason,
    lastUpdated,
    loading,
    refreshing,
    error,
    refresh
  } = useKeywordData()

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async res => {
        if (!res.ok) return setCurrentUser(null)
        const data = await res.json()
        setCurrentUser(data.user || null)
      })
      .catch(() => setCurrentUser(null))
  }, [])

  if (loading) {
    return <SkeletonLoader />
  }

  if (error || !stats) {
    return (
      <div className="p-8 flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen">
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-red-100 shadow-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-6 shadow-md shadow-red-100">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Connection Failure</h2>
          <p className="text-slate-400 text-sm mt-3">
            Unable to establish connection with Google Sheets API.
          </p>
          <div className="bg-red-950/5 border border-red-900/10 px-4 py-3 rounded-xl text-xs text-red-800 text-left font-mono mt-5 w-full break-all">
            {error || 'Stats initialization failed.'}
          </div>
          <button
            onClick={() => refresh()}
            className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all w-full"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  // Groups names array
  const groupsList = groupSummaries.map(g => g.name)

  return (
    <div className="w-full max-w-[1600px] mx-auto p-8 space-y-8 min-h-screen">
      {/* Header Panel */}
      <Header
        title="SEO Keyword Rankings"
        currentMonth={stats.currentMonth}
        previousMonth={stats.previousMonth}
        lastUpdated={lastUpdated}
        isMock={isMock}
        warningText={fallbackReason}
        onRefresh={refresh}
        isRefreshing={refreshing}
      />
      {/* Client login access (for emailed viewer links) */}
      {currentUser?.role !== 'viewer' && (
        <div className="max-w-[1600px] mx-auto px-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Are you a client who received a viewer access link?</p>
              <p className="text-xs text-slate-400">Use the client login to enter your email and view the shared dashboard.</p>
            </div>
            <div>
              <a href="/client-login" className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all">Client Login</a>
            </div>
          </div>
        </div>
      )}

      {/* SECTION A: Summary KPI Cards (top row) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="🥇 P1 Top (Pos 1-4)"
          value={stats.p1Top}
          prevValue={stats.prevP1Top}
          variant="green"
        />
        <KPICard
          title="🥈 P1 Good (Pos 5-10)"
          value={stats.p1Good}
          prevValue={stats.prevP1Good}
          variant="blue"
        />
        <KPICard
          title="🟡 Page 2"
          value={stats.page2}
          prevValue={stats.prevPage2}
          variant="yellow"
        />
        <KPICard
          title="🟠 Page 3"
          value={stats.page3}
          prevValue={stats.prevPage3}
          variant="orange"
        />
        <KPICard
          title="🔴 Page 4+"
          value={stats.page4Plus}
          prevValue={stats.prevPage4Plus}
          variant="red"
        />
        <KPICard
          title="⚫ Not Ranking"
          value={stats.notRanking}
          prevValue={stats.prevNotRanking}
          variant="gray"
        />
      </div>

      {/* SECTION B: Movement Summary Cards (second row) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Improved */}
        <div className="bg-emerald-50/40 border border-emerald-100 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:bg-emerald-50/60 transition-all">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">↑ Improved</span>
            <div className="flex items-baseline gap-2 mt-2">
              <h4 className="text-3xl font-extrabold text-emerald-600">{stats.improved + stats.newEntries}</h4>
              <span className="text-[10px] text-slate-400 font-semibold">(incl. {stats.newEntries} new entries)</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-emerald-100/60 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Neutral */}
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:bg-slate-100/30 transition-all">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">→ Neutral</span>
            <h4 className="text-3xl font-extrabold text-slate-700 mt-2">{stats.neutral}</h4>
          </div>
          <div className="w-12 h-12 bg-slate-200/60 text-slate-500 rounded-xl flex items-center justify-center shadow-sm">
            <Minus className="w-6 h-6" />
          </div>
        </div>

        {/* Dropped */}
        <div className="bg-red-50/40 border border-red-100 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:bg-red-50/60 transition-all">
          <div>
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider">↓ Dropped</span>
            <div className="flex items-baseline gap-2 mt-2">
              <h4 className="text-3xl font-extrabold text-red-600">{stats.dropped + stats.lostRankings}</h4>
              <span className="text-[10px] text-slate-400 font-semibold">(incl. {stats.lostRankings} lost ranks)</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-red-100/60 text-red-600 rounded-xl flex items-center justify-center shadow-sm">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SECTION C: Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PageDistributionChart stats={stats} />
        <MovementDonutChart stats={stats} />
        <GroupPerformanceChart groupSummaries={groupSummaries} />
      </div>

      {/* SECTION D: Full Keywords Table */}
      <KeywordsTable keywords={keywords} groups={groupsList} />
    </div>
  )
}
