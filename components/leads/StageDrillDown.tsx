// components/leads/StageDrillDown.tsx
'use client';

import React, { useState } from 'react'
import { ChevronDown, Layers, BarChart2 } from 'lucide-react'
import { STATUS_TO_CATEGORY } from '@/lib/telecrm-api'
import { LeadCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

interface StageDrillDownProps {
  stageBreakdown?: Record<string, number>
}

const CATEGORY_COLORS: Record<LeadCategory, { bg: string; text: string; border: string }> = {
  'Enrolled': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  'High Potential': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
  'Medium Potential': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
  'Fresh/Unqualified': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100' },
  'Low/Cold': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' }
}

export default function StageDrillDown({ stageBreakdown = {} }: StageDrillDownProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Group raw statuses by category
  const groupedStages = React.useMemo(() => {
    const groups: Record<LeadCategory, Array<{ stage: string; count: number }>> = {
      'Enrolled': [],
      'High Potential': [],
      'Medium Potential': [],
      'Fresh/Unqualified': [],
      'Low/Cold': []
    }

    // Initialize all known statuses from mapping
    Object.entries(STATUS_TO_CATEGORY).forEach(([stage, cat]) => {
      const count = stageBreakdown[stage] || 0
      groups[cat].push({ stage, count })
    })

    // Sort stages in each group by count descending
    Object.keys(groups).forEach((key) => {
      const cat = key as LeadCategory
      groups[cat].sort((a, b) => b.count - a.count)
    })

    return groups
  }, [stageBreakdown])

  const categoriesOrder: LeadCategory[] = [
    'Enrolled',
    'High Potential',
    'Medium Potential',
    'Fresh/Unqualified',
    'Low/Cold'
  ]

  const totalStagesCount = Object.values(stageBreakdown).reduce((sum, count) => sum + count, 0)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-6">
      {/* Header / Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">TeleCRM Raw Stage Drill-Down</h3>
            <p className="text-xs text-slate-400 mt-0.5">Explore raw counts for all 16 CRM stages</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {totalStagesCount} total entries
          </span>
          <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="border-t border-slate-100 p-6 bg-slate-50/30 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoriesOrder.map((category) => {
              const stages = groupedStages[category] || []
              const catTotal = stages.reduce((sum, s) => sum + s.count, 0)
              const colors = CATEGORY_COLORS[category]

              return (
                <div key={category} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col">
                  {/* Category Header */}
                  <div className={cn("flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-bold mb-4", colors.bg, colors.text, colors.border)}>
                    <span>{category}</span>
                    <span>{catTotal}</span>
                  </div>

                  {/* Stages List */}
                  <div className="space-y-3 flex-1">
                    {stages.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4">No stages found</p>
                    ) : (
                      stages.map(({ stage, count }) => {
                        const pct = catTotal > 0 ? (count / catTotal) * 100 : 0
                        return (
                          <div key={stage} className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-700">
                              <span className="font-semibold truncate max-w-[200px]" title={stage}>
                                {stage}
                              </span>
                              <span className="font-bold shrink-0 pl-2">{count}</span>
                            </div>
                            {/* Simple visual progress bar */}
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all duration-300", 
                                  category === 'Enrolled' ? 'bg-emerald-500' :
                                  category === 'High Potential' ? 'bg-amber-500' :
                                  category === 'Medium Potential' ? 'bg-blue-500' :
                                  category === 'Fresh/Unqualified' ? 'bg-slate-400' : 'bg-red-400'
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
