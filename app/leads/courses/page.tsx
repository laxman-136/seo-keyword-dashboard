// app/leads/courses/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Header from '@/components/layout/Header'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import LeadsCourseCard from '@/components/leads/LeadsCourseCard'
import LeadsCourseTable from '@/components/leads/LeadsCourseTable'
import LeadsCourseTrendChart from '@/components/leads/LeadsCourseTrendChart'
import LiveDataBadge from '@/components/leads/LiveDataBadge'
import RefreshBar from '@/components/leads/RefreshBar'
import DateRangePicker from '@/components/ads/DateRangePicker'
import { useDateRange } from '@/hooks/useDateRange'
import { Info, BookOpen } from 'lucide-react'

import { getClientCachedData, setClientCachedData } from '@/lib/client-cache'

export default function LeadsByCoursePage() {
  const { preset, from, to, label: rangeLabel } = useDateRange()

  const [courses, setCourses] = useState<any[]>([])
  const [trend, setTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState('all')

  const fetchData = useCallback(async (isRefresh = false) => {
    const cacheKey = `courses_${from}_${to}`

    if (!isRefresh) {
      const cached = getClientCachedData(cacheKey)
      if (cached) {
        setCourses(cached.courses)
        setTrend(cached.trend)
        setLoading(false)
        // Background revalidation (non-blocking)
        fetchFromNetwork(cacheKey, true)
        return
      }
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)

    await fetchFromNetwork(cacheKey, false)
  }, [from, to])

  const fetchFromNetwork = async (cacheKey: string, isBackground = false) => {
    try {
      const headers: Record<string, string> = {}
      if (typeof window !== 'undefined') {
        const clientToken = localStorage.getItem('client-telecrm-api-token')
        const clientEnterpriseId = localStorage.getItem('client-telecrm-enterprise-id')
        if (clientToken) headers['x-telecrm-api-token'] = clientToken
        if (clientEnterpriseId) headers['x-telecrm-enterprise-id'] = clientEnterpriseId
      }

      const urlCourses = `/api/leads/courses?from=${from}&to=${to}`
      const urlTrend = `/api/leads/trend?months=6`

      const [resCourses, resTrend] = await Promise.all([
        fetch(urlCourses, { headers }),
        fetch(urlTrend, { headers })
      ])

      if (!resCourses.ok) {
        const errorData = await resCourses.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch course breakdown (Status: ${resCourses.status})`)
      }
      if (!resTrend.ok) {
        const errorData = await resTrend.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch monthly trend (Status: ${resTrend.status})`)
      }

      const payloadCourses = await resCourses.json()
      const payloadTrend = await resTrend.json()

      setCourses(payloadCourses)
      setTrend(payloadTrend)
      setClientCachedData(cacheKey, { courses: payloadCourses, trend: payloadTrend })
    } catch (err: any) {
      console.error(err)
      if (!isBackground) {
        setError(err?.message || 'Error loading course details')
      }
    } finally {
      if (!isBackground) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const handleConfigChange = () => {
      fetchData()
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('active-config-updated', handleConfigChange)
      return () => {
        window.removeEventListener('active-config-updated', handleConfigChange)
      }
    }
  }, [fetchData])

  // Get unique courses list for filter dropdown
  const uniqueCourses = useMemo(() => {
    return Array.from(new Set(courses.map(c => c.courseName)))
  }, [courses])

  // Map courses to structure expected by table
  const mappedCourses = useMemo(() => {
    return courses.map(c => ({
      ...c,
      organic: c.organicLeads,
      website: c.websiteLeads,
      ads: c.adsLeads,
      llm: c.llmLeads
    }))
  }, [courses])

  // Filter breakdown list if a specific course is selected
  const filteredCourses = useMemo(() => {
    return selectedCourse === 'all'
      ? mappedCourses
      : mappedCourses.filter(c => c.courseName === selectedCourse)
  }, [selectedCourse, mappedCourses])

  // Map trend to list of detailRows for LeadsCourseTrendChart
  const detailRows = useMemo(() => {
    const rows: any[] = []
    trend.forEach(t => {
      if (t.courses) {
        Object.entries(t.courses).forEach(([courseName, total]) => {
          rows.push({
            month: t.month,
            courseName,
            total: total as number,
            enrolled: 0,
            highPotential: 0,
            mediumPotential: 0,
            freshUnqualified: 0,
            lowCold: 0,
            organic: 0,
            website: 0
          })
        })
      }
    })
    return rows
  }, [trend])

  if (loading) {
    return <SkeletonLoader />
  }

  if (error) {
    return (
      <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-red-100 shadow-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-6 shadow-sm">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Connection Failed</h2>
          <p className="text-slate-400 text-sm mt-3">
            {error || 'Unable to retrieve course metrics from TeleCRM API.'}
          </p>
          <button onClick={() => fetchData()} className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all w-full">
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 lg:space-y-8 min-h-screen bg-slate-50">
      {/* Header Panel */}
      <Header
        title="📚 Leads by Course"
        currentMonth={rangeLabel}
        onRefresh={() => fetchData(true)}
        isRefreshing={refreshing}
      />

      {/* Selectors & Info Row */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <LiveDataBadge />
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full sm:w-auto">
            <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="text-xs font-semibold bg-transparent text-slate-700 outline-none cursor-pointer min-w-[150px]"
            >
              <option value="all">All Courses</option>
              {uniqueCourses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RefreshBar
            loading={loading}
            refreshing={refreshing}
            lastUpdated={trend?.[trend.length - 1]?.monthStart ? new Date(trend[trend.length - 1].monthStart).toISOString() : new Date().toISOString()}
            onRefresh={() => fetchData(true)}
          />
          <DateRangePicker />
        </div>
      </div>

      {/* SECTION A: Course cards */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, idx) => {
            const overallRank = mappedCourses.findIndex(c => c.courseName === course.courseName) + 1
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
          <p className="text-slate-400 text-sm">No course registrations recorded for this period.</p>
        </div>
      )}

      {/* SECTION B: Detailed course table */}
      <div className="grid grid-cols-1 gap-6">
        <LeadsCourseTable courses={filteredCourses} />
      </div>

      {/* SECTION C: Course trend chart */}
      {detailRows.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          <LeadsCourseTrendChart detailRows={detailRows} />
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p className="text-slate-400 text-sm">No course trend logs available.</p>
        </div>
      )}
    </div>
  )
}
