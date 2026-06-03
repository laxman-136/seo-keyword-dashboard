// app/groups/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react'
import { useKeywordData } from '@/hooks/useKeywordData'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import GroupDetailTable from '@/components/tables/GroupDetailTable'
import { SearchCheck, Search, X, ChevronDown, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function GroupDetailView() {
  const {
    keywords,
    stats,
    groupSummaries,
    isMock,
    fallbackReason,
    lastUpdated,
    loading,
    refreshing,
    refresh
  } = useKeywordData()

  const [activeGroupIndex, setActiveGroupIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (groupSummaries.length > 0 && activeGroupIndex >= groupSummaries.length) {
      setActiveGroupIndex(0)
    }
  }, [groupSummaries, activeGroupIndex])

  if (loading) return <SkeletonLoader />

  if (groupSummaries.length === 0 || !stats) {
    return (
      <div className="p-8 text-center text-slate-400 font-semibold mt-12">
        No ranking data found. Please check Google Sheets configuration.
      </div>
    )
  }

  const activeGroup = groupSummaries[activeGroupIndex] || groupSummaries[0]
  const activeKeywords = keywords.filter(kw => kw.group === activeGroup.name)

  const filtered = groupSummaries.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const bandConfig = [
    { key: 'p1Top',      label: 'P1 Top',      value: activeGroup.p1Top,       cls: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
    { key: 'p1Good',     label: 'P1 Good',     value: activeGroup.p1Good,      cls: 'bg-blue-50 border-blue-100 text-blue-700'           },
    { key: 'page2',      label: 'Page 2',      value: activeGroup.page2,       cls: 'bg-amber-50 border-amber-100 text-amber-700'        },
    { key: 'page3',      label: 'Page 3',      value: activeGroup.page3,       cls: 'bg-orange-50 border-orange-100 text-orange-700'     },
    { key: 'page4Plus',  label: 'Page 4+',     value: activeGroup.page4Plus,   cls: 'bg-red-50 border-red-100 text-red-700'              },
    { key: 'notRanking', label: 'Not Ranking', value: activeGroup.notRanking,  cls: 'bg-slate-50 border-slate-200 text-slate-500'        },
  ]

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 min-h-screen bg-slate-50">

      {/* ── HEADER ── */}
      <Header
        title="Group Details View"
        currentMonth={stats.currentMonth}
        previousMonth={stats.previousMonth}
        lastUpdated={lastUpdated}
        isMock={isMock}
        warningText={fallbackReason}
        onRefresh={refresh}
        isRefreshing={refreshing}
      />

      {/* ── COURSE CATEGORIES PANEL ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print">

        {/* Panel header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
              <BarChart2 className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Course Categories</h3>
              <p className="text-[11px] text-slate-400">{groupSummaries.length} groups — click a category to inspect</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative flex items-center max-w-xs w-full hidden sm:flex">
            <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search categories…"
              className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 text-slate-700 placeholder:text-slate-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile: active group summary + toggle */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="sm:hidden flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <span className="max-w-[120px] truncate">{activeGroup.name}</span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform', mobileOpen && 'rotate-180')} />
          </button>
        </div>

        {/* Mobile search (only visible when expanded or always) */}
        <div className="px-5 pt-3 pb-0 sm:hidden">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search categories…"
              className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 text-slate-700 placeholder:text-slate-400 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 text-slate-400">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category chip grid */}
        <div className={cn(
          'px-5 py-4 transition-all',
          // On mobile: collapsible. On desktop: always visible.
          'sm:block',
          !mobileOpen && searchQuery === '' ? 'hidden sm:block' : 'block'
        )}>
          <div className="flex flex-wrap gap-2">
            {filtered.length === 0 && (
              <p className="text-xs text-slate-400 py-2">No categories match "{searchQuery}"</p>
            )}
            {filtered.map((g) => {
              const idx = groupSummaries.indexOf(g)
              const isActive = activeGroupIndex === idx
              const p1Total = g.p1Top + g.p1Good
              const hasP1 = p1Total > 0

              return (
                <button
                  key={g.name}
                  onClick={() => {
                    setActiveGroupIndex(idx)
                    setMobileOpen(false)
                    setSearchQuery('')
                  }}
                  title={g.name}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all duration-150 group',
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-md shadow-violet-400/25'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50/40 hover:shadow-sm'
                  )}
                >
                  <span className="leading-none">{g.name}</span>

                  {/* P1 badge */}
                  <span className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none',
                    isActive
                      ? 'bg-white/20 text-white'
                      : hasP1
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                  )}>
                    {p1Total}P1
                  </span>

                  {/* Keyword count */}
                  <span className={cn(
                    'text-[10px] font-medium leading-none',
                    isActive ? 'text-white/70' : 'text-slate-400'
                  )}>
                    {g.total}kw
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Active selection indicator (mobile) */}
        {!mobileOpen && !searchQuery && (
          <div className="sm:hidden px-5 pb-4 pt-0 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-xs text-slate-500">Viewing: <span className="font-bold text-slate-800">{activeGroup.name}</span></span>
          </div>
        )}
      </div>

      {/* ── ACTIVE CATEGORY DETAILS ── */}
      <div className="space-y-5">

        {/* Category header + band stats */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Active group title bar */}
          <div className="px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-200">Active Category Profile</p>
              <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">{activeGroup.name}</h2>
            </div>
            <div className="flex items-center gap-2 bg-white/15 border border-white/25 px-3.5 py-2 rounded-xl shrink-0">
              <SearchCheck className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white">{activeGroup.total} Keywords</span>
            </div>
          </div>

          {/* Band distribution pills */}
          <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-100">
            {bandConfig.map(b => (
              <div key={b.key} className="flex flex-col items-center justify-center py-4 px-3 gap-1">
                <span className={cn(
                  'text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                  b.cls
                )}>
                  {b.label}
                </span>
                <span className={cn(
                  'text-2xl font-black mt-1',
                  b.value > 0 ? b.cls.split(' ').find(c => c.startsWith('text-')) : 'text-slate-400'
                )}>
                  {b.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Keyword table */}
        <GroupDetailTable keywords={activeKeywords} />
      </div>
    </div>
  )
}
