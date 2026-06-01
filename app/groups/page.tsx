// app/groups/page.tsx
'use client';

import React, { useState, useEffect } from 'react'
import { useKeywordData } from '@/hooks/useKeywordData'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import GroupDetailTable from '@/components/tables/GroupDetailTable'
import { ChevronRight, SearchCheck } from 'lucide-react'
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

  // Keep active index bounded safely
  useEffect(() => {
    if (groupSummaries.length > 0 && activeGroupIndex >= groupSummaries.length) {
      setActiveGroupIndex(0)
    }
  }, [groupSummaries, activeGroupIndex])

  if (loading) {
    return <SkeletonLoader />
  }

  if (groupSummaries.length === 0 || !stats) {
    return (
      <div className="p-8 text-center text-slate-400 font-semibold mt-12">
        No ranking data found. Please check Google Sheets configuration.
      </div>
    )
  }

  const activeGroup = groupSummaries[activeGroupIndex] || groupSummaries[0]
  
  // Filter keywords to match active group
  const activeKeywords = keywords.filter(kw => kw.group === activeGroup.name)

  return (
    <div className="w-full max-w-[1600px] mx-auto p-8 space-y-8 min-h-screen">
      {/* Header Panel */}
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

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Side: 13 Groups tab list */}
        <div className="w-full lg:w-80 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-1.5 no-print">
          <div className="px-3 pb-3 mb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Course Categories ({groupSummaries.length})
            </h3>
          </div>
          <div className="max-h-[600px] overflow-y-auto pr-1 space-y-1">
            {groupSummaries.map((g, idx) => {
              const isActive = activeGroupIndex === idx
              const p1Total = g.p1Top + g.p1Good
              return (
                <button
                  key={g.name}
                  onClick={() => setActiveGroupIndex(idx)}
                  className={cn(
                    "w-full text-left flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group",
                    isActive 
                      ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 shadow-sm"
                      : "hover:bg-slate-50 border border-transparent text-slate-500 hover:text-slate-800"
                  )}
                >
                  <span className="truncate pr-2">{g.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm border",
                      p1Total > 0 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    )}>
                      {p1Total} P1
                    </span>
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform",
                      isActive ? "text-emerald-500 translate-x-0.5" : "text-slate-300 group-hover:text-slate-500"
                    )} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Side: Active group's visual details & tables */}
        <div className="flex-1 w-full space-y-6">
          {/* Active Group Status Summary Bar Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Active Category Profile</span>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight mt-0.5">
                  {activeGroup.name}
                </h2>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl shrink-0">
                <SearchCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-700">
                  {activeGroup.total} Total Keywords
                </span>
              </div>
            </div>

            {/* Micro pills summarizing this group's band distribution */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
              {/* P1 Top */}
              <div className="bg-emerald-50/50 border border-emerald-100/80 px-3 py-2.5 rounded-xl text-center shadow-sm">
                <span className="block text-[9px] uppercase font-bold text-emerald-600">P1 Top</span>
                <span className="text-lg font-black text-emerald-600 block mt-0.5">{activeGroup.p1Top}</span>
              </div>

              {/* P1 Good */}
              <div className="bg-blue-50/50 border border-blue-100/80 px-3 py-2.5 rounded-xl text-center shadow-sm">
                <span className="block text-[9px] uppercase font-bold text-blue-600">P1 Good</span>
                <span className="text-lg font-black text-blue-600 block mt-0.5">{activeGroup.p1Good}</span>
              </div>

              {/* Page 2 */}
              <div className="bg-amber-50/50 border border-amber-100/80 px-3 py-2.5 rounded-xl text-center shadow-sm">
                <span className="block text-[9px] uppercase font-bold text-amber-600">Page 2</span>
                <span className="text-lg font-black text-amber-600 block mt-0.5">{activeGroup.page2}</span>
              </div>

              {/* Page 3 */}
              <div className="bg-orange-50/50 border border-orange-100/80 px-3 py-2.5 rounded-xl text-center shadow-sm">
                <span className="block text-[9px] uppercase font-bold text-orange-600">Page 3</span>
                <span className="text-lg font-black text-orange-600 block mt-0.5">{activeGroup.page3}</span>
              </div>

              {/* Page 4+ */}
              <div className="bg-red-50/50 border border-red-100/80 px-3 py-2.5 rounded-xl text-center shadow-sm">
                <span className="block text-[9px] uppercase font-bold text-red-600">Page 4+</span>
                <span className="text-lg font-black text-red-600 block mt-0.5">{activeGroup.page4Plus}</span>
              </div>

              {/* Not Ranking */}
              <div className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-center shadow-sm">
                <span className="block text-[9px] uppercase font-bold text-slate-500">Not Ranking</span>
                <span className="text-lg font-black text-slate-600 block mt-0.5">{activeGroup.notRanking}</span>
              </div>
            </div>
          </div>

          {/* Group details table view */}
          <GroupDetailTable keywords={activeKeywords} />
        </div>
      </div>
    </div>
  )
}
