// app/leads/courses/page.tsx
'use client';

import React, { useState, useEffect } from 'react'
import { useLeadsData } from '@/hooks/useLeadsData'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import LeadsCourseCard from '@/components/leads/LeadsCourseCard'
import LeadsCourseTable from '@/components/leads/LeadsCourseTable'
import LeadsCourseTrendChart from '@/components/leads/LeadsCourseTrendChart'
import LeadsMonthSelector from '@/components/leads/LeadsMonthSelector'
import { getAvailableLeadsMonths, getLeadsCourseBreakdown } from '@/lib/sheets'
import { Info, BookOpen } from 'lucide-react'

export default function LeadsByCoursePage() {
  const {
    monthly,
    detail,
    loading,
    refreshing,
    error,
    isMock,
    fallbackReason,
    lastUpdated,
    refresh
  } = useLeadsData()

  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('all')

  // Set default selected month to latest month in dataset
  useEffect(() => {
    if (monthly.length > 0 && !selectedMonth) {
      setSelectedMonth(monthly[monthly.length - 1].month)
    }
  }, [monthly, selectedMonth])

  if (loading) {
    return <SkeletonLoader />
  }

  if (error || monthly.length === 0) {
    return (
      <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-red-100 shadow-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-6 shadow-sm">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">No leads data yet</h2>
          <p className="text-slate-400 text-sm mt-3">
            {error || 'Please populate the leads sheets in your Google Sheet.'}
          </p>
          <button onClick={() => refresh()} className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all w-full">
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  const availableMonths = getAvailableLeadsMonths(monthly)
  const currentMonth = selectedMonth || monthly[monthly.length - 1].month
  const courseBreakdown = getLeadsCourseBreakdown(detail, currentMonth)

  // Get unique courses list for filter dropdown
  const uniqueCourses = Array.from(new Set(detail.map(d => d.courseName)))

  // Filter breakdown list if a specific course is selected
  const filteredBreakdown = selectedCourse === 'all'
    ? courseBreakdown
    : courseBreakdown.filter(c => c.courseName === selectedCourse)

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 lg:space-y-8 min-h-screen bg-slate-50">
      {/* Header Panel */}
      <Header
        title="📚 Leads by Course"
        currentMonth={currentMonth}
        lastUpdated={lastUpdated}
        isMock={isMock}
        warningText={fallbackReason}
        onRefresh={refresh}
        isRefreshing={refreshing}
      />

      {/* Selectors Row */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        {/* Course Selector */}
        <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm w-full sm:w-auto">
          <BookOpen className="w-5 h-5 text-slate-400 shrink-0" />
          <div className="flex-1 sm:flex-initial flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter Course</span>
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="text-sm font-semibold border border-slate-200 rounded-xl px-4 py-1.5 text-slate-700 bg-white outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-400 cursor-pointer min-w-[200px]"
            >
              <option value="all">All Courses</option>
              {uniqueCourses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Month Selector */}
        <LeadsMonthSelector
          months={availableMonths}
          selected={currentMonth}
          onChange={setSelectedMonth}
          label="Analyze Month"
        />
      </div>

      {/* SECTION A: Course cards (grid layout) */}
      {filteredBreakdown.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBreakdown.map((course, idx) => {
            // Find rank index in the overall breakdown list (before filters)
            const overallRank = courseBreakdown.findIndex(c => c.courseName === course.courseName) + 1
            return (
              <LeadsCourseCard 
                key={course.courseName} 
                course={course} 
                rank={overallRank} 
              />
            )
          })}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p className="text-slate-400 text-sm">No course breakdown details found. Make sure "Leads Detail" is populated for {currentMonth}.</p>
        </div>
      )}

      {/* SECTION B: Detailed course table */}
      <div className="grid grid-cols-1 gap-6">
        <LeadsCourseTable courses={filteredBreakdown} />
      </div>

      {/* SECTION C: Course trend chart over time */}
      {detail.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          <LeadsCourseTrendChart detailRows={detail} />
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p className="text-slate-400 text-sm">Add Leads Detail sheet to display course trend lines</p>
        </div>
      )}
    </div>
  )
}
