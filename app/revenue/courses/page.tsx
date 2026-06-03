// app/revenue/courses/page.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { useRevenueData } from '@/hooks/useRevenueData'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import RevenueMonthSelector from '@/components/revenue/RevenueMonthSelector'
import RevenueCourseCard from '@/components/revenue/RevenueCourseCard'
import RevenueCourseTable from '@/components/revenue/RevenueCourseTable'
import RevenueCourseDonut from '@/components/revenue/RevenueCourseDonut'
import RevenueDemoTable from '@/components/revenue/RevenueDemoTable'
import { getAvailableRevenueMonths, getRevenueCourseBreakdown } from '@/lib/sheets'
import { Info } from 'lucide-react'

export default function RevenueCoursesPage() {
  const {
    courses: rawCourses,
    monthly,
    loading,
    refreshing,
    error,
    isMock,
    fallbackReason,
    lastUpdated,
    refresh
  } = useRevenueData()

  const [selectedMonth, setSelectedMonth] = useState('')

  useEffect(() => {
    if (monthly.length > 0 && !selectedMonth) {
      setSelectedMonth(monthly[monthly.length - 1].month)
    }
  }, [monthly, selectedMonth])

  if (loading) return <SkeletonLoader />

  if (error || monthly.length === 0 || rawCourses.length === 0) {
    return (
      <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-red-100 shadow-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-6 shadow-sm">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">No course revenue data</h2>
          <p className="text-slate-400 text-sm mt-3">
            {error || 'Please fill in the Revenue Courses tab in Google Sheets to load course breakdowns.'}
          </p>
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

  const availableMonths = getAvailableRevenueMonths(monthly)
  const currentMonth = selectedMonth || monthly[monthly.length - 1].month
  const currentIndex = availableMonths.indexOf(currentMonth)
  const prevMonth = currentIndex > 0 ? availableMonths[currentIndex - 1] : 'N/A'

  const courseBreakdown = getRevenueCourseBreakdown(rawCourses, currentMonth)

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 lg:space-y-8 min-h-screen bg-slate-50">
      {/* ── HEADER ── */}
      <Header
        title="🎓 Revenue by Course"
        currentMonth={currentMonth}
        previousMonth={prevMonth !== 'N/A' ? prevMonth : undefined}
        lastUpdated={lastUpdated}
        isMock={isMock}
        warningText={fallbackReason}
        onRefresh={refresh}
        isRefreshing={refreshing}
      />

      {/* ── MONTH SELECTOR ── */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-700">Course Analysis Month</p>
          <p className="text-xs text-slate-400 mt-0.5">Select a month to see course performance and batch/faculty stats</p>
        </div>
        <RevenueMonthSelector
          months={availableMonths}
          selected={currentMonth}
          onChange={setSelectedMonth}
          label="Analyze Month"
        />
      </div>

      {/* ── SECTION A: TOP 3 COURSES CARDS ── */}
      <div className="space-y-3">
        <h3 className="text-xs uppercase font-extrabold text-slate-450 tracking-wider">Top Performing Programs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {courseBreakdown.slice(0, 3).map((course, idx) => (
            <RevenueCourseCard
              key={course.courseName}
              course={course}
              rank={idx + 1}
            />
          ))}
        </div>
      </div>

      {/* ── SECTION B: Detailed Table + Share Donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8">
          <RevenueCourseTable courses={courseBreakdown} />
        </div>
        <div className="lg:col-span-4">
          <RevenueCourseDonut courses={courseBreakdown} />
        </div>
      </div>

      {/* ── SECTION C: Demos Registry Table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RevenueDemoTable courses={courseBreakdown} />
        </div>
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-indigo-500/10">
          <div>
            <span className="text-[10px] bg-white/20 border border-white/10 px-2 py-0.5 rounded-full text-white font-bold uppercase tracking-wider">Conversion Strategy</span>
            <h4 className="text-lg font-bold mt-4">Increase Demo Conversions</h4>
            <p className="text-xs text-indigo-150 mt-2 leading-relaxed">
              Track the attendance rates of demo batches. Programs showing a high Demo-to-Enrollment conversion rate indicate strong alignment between faculty delivery and student expectations.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 text-[10px] text-indigo-200">
            📊 Leverage live demo performance to forecast course yields.
          </div>
        </div>
      </div>
    </div>
  )
}
