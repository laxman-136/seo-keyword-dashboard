// components/ads/MetricCustomizer.tsx
'use client';

import React, { useState } from 'react'
import { Settings, X, RotateCcw } from 'lucide-react'
import { MetricConfig } from '@/lib/metrics-config'
import { cn } from '@/lib/utils'

interface MetricCustomizerProps {
  allMetrics: MetricConfig[]
  visibleMetricIds: string[]
  onToggle: (id: string) => void
  onReset?: () => void
}

export default function MetricCustomizer({ allMetrics, visibleMetricIds, onToggle, onReset }: MetricCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Group metrics by category
  const categories = {
    budget: allMetrics.filter(m => m.category === 'budget'),
    performance: allMetrics.filter(m => m.category === 'performance'),
    conversion: allMetrics.filter(m => m.category === 'conversion')
  }

  const categoryLabels = {
    budget: 'Budget & Spend',
    performance: 'Performance Metrics',
    conversion: 'Conversions & Outcomes'
  }

  return (
    <>
      {/* Settings Column Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-sm text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all outline-none shrink-0"
        title="Customize columns"
      >
        <Settings className="w-4 h-4 text-slate-400" />
        <span>Columns</span>
        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
          {visibleMetricIds.length}
        </span>
      </button>

      {/* Customize Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setIsOpen(false)} />

          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 mx-4 z-50 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-600 animate-spin-slow" /> Customize Active Columns
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Select which metrics are displayed in the campaigns spreadsheet view.</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Checklist Content */}
            <div className="space-y-5 max-h-[350px] overflow-y-auto pr-1">
              {(Object.keys(categories) as Array<keyof typeof categories>).map(cat => {
                const list = categories[cat]
                if (list.length === 0) return null

                return (
                  <div key={cat} className="space-y-2.5">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-l-2 border-blue-500 pl-2">
                      {categoryLabels[cat]}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {list.map(metric => {
                        const isChecked = visibleMetricIds.includes(metric.id)
                        return (
                          <label
                            key={metric.id}
                            className={cn(
                              "flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none",
                              isChecked
                                ? "bg-blue-50/20 border-blue-200/60 hover:bg-blue-50/40"
                                : "bg-white border-slate-150 hover:bg-slate-50"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => onToggle(metric.id)}
                              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-3.5 h-3.5"
                            />
                            <div className="min-w-0">
                              <span className={cn(
                                "block text-xs font-bold leading-none",
                                isChecked ? "text-slate-800" : "text-slate-600"
                              )}>
                                {metric.label}
                              </span>
                              <span className="block text-[9px] text-slate-400 font-medium leading-normal mt-0.5">
                                {metric.description}
                              </span>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-150 pt-4 mt-6">
              {onReset ? (
                <button
                  onClick={() => {
                    onReset()
                    setIsOpen(false)
                  }}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200/80 px-3 py-2 rounded-xl transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
