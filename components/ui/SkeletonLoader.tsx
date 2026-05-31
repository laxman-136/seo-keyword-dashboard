// components/ui/SkeletonLoader.tsx
import React from 'react'

export default function SkeletonLoader() {
  return (
    <div className="p-8 space-y-8 animate-pulse w-full max-w-[1600px] mx-auto">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-48 bg-slate-200 rounded"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
          <div className="h-10 w-36 bg-slate-200 rounded-xl"></div>
        </div>
      </div>

      {/* KPI Cards Row Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-200/60 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between">
            <div className="h-3 w-16 bg-slate-200 rounded"></div>
            <div className="h-8 w-12 bg-slate-300 rounded-lg"></div>
            <div className="h-3 w-20 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* Charts Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-[360px] bg-slate-200/50 border border-slate-100 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-4 w-40 bg-slate-200 rounded"></div>
              <div className="h-3 w-56 bg-slate-200 rounded"></div>
            </div>
            <div className="flex-1 w-full bg-slate-200/60 rounded-xl mt-6"></div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-slate-200/40 border border-slate-100 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="h-4 w-48 bg-slate-200 rounded"></div>
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-200/80 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
