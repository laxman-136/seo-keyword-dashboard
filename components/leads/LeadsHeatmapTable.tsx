// components/leads/LeadsHeatmapTable.tsx
import React, { useMemo } from 'react'
import { LeadsDetailRow } from '@/lib/types'

interface LeadsHeatmapTableProps {
  detailRows: LeadsDetailRow[]
}

export default function LeadsHeatmapTable({ detailRows }: LeadsHeatmapTableProps) {
  const { months, courses, gridData, courseMaxes } = useMemo(() => {
    if (!detailRows || detailRows.length === 0) {
      return { months: [], courses: [], gridData: {}, courseMaxes: {} }
    }

    const uniqueMonthsSet = new Set<string>()
    const uniqueCoursesSet = new Set<string>()
    
    // Sort months chronologically
    const parseMonthToDate = (m: string) => {
      const parts = m.split(' ')
      if (parts.length < 2) return new Date(m)
      const months: Record<string, number> = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 }
      return new Date(parseInt(parts[1], 10), months[parts[0].toLowerCase().substring(0, 3)] ?? 0, 1)
    }

    detailRows.forEach(r => {
      uniqueMonthsSet.add(r.month)
      uniqueCoursesSet.add(r.courseName)
    })

    const sortedMonths = Array.from(uniqueMonthsSet).sort((a, b) => parseMonthToDate(a).getTime() - parseMonthToDate(b).getTime())
    const sortedCourses = Array.from(uniqueCoursesSet)

    // Build grid data structure and find max values per course
    const grid: Record<string, Record<string, number>> = {}
    const maxes: Record<string, number> = {}

    sortedCourses.forEach(course => {
      grid[course] = {}
      let max = 1 // avoid divide by zero
      sortedMonths.forEach(month => {
        const found = detailRows.find(r => r.month === month && r.courseName === course)
        const val = found ? found.total : 0
        grid[course][month] = val
        if (val > max) max = val
      })
      maxes[course] = max
    })

    return {
      months: sortedMonths,
      courses: sortedCourses,
      gridData: grid,
      courseMaxes: maxes
    }
  }, [detailRows])

  if (!detailRows || detailRows.length === 0 || months.length < 2) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
        <p className="text-slate-400 text-sm">Add multiple months of Leads Detail data to display the course heatmap.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-sm">📅 Course Lead Heatmap (Volume Density)</h3>
        <p className="text-xs text-slate-400 mt-0.5">Visual representation of course demand fluctuations across months (darker indicates more leads)</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-slate-200 font-bold uppercase border-b border-slate-700">
              <th className="px-6 py-3 border-r border-slate-800">Course Name</th>
              {months.map(m => (
                <th key={m} className="px-4 py-3 text-center min-w-[80px]">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {courses.map(course => {
              const max = courseMaxes[course] || 1
              return (
                <tr key={course} className="hover:bg-slate-50/20 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-slate-800 border-r border-slate-150 bg-slate-50/30">
                    {course}
                  </td>
                  {months.map(month => {
                    const val = gridData[course]?.[month] ?? 0
                    const ratio = val / max
                    const opacity = val > 0 ? Math.max(0.08, ratio) : 0
                    
                    // Style adjustments based on opacity to ensure legibility
                    const bgStyle = val > 0 
                      ? { backgroundColor: `rgba(30, 64, 175, ${opacity})` } 
                      : { backgroundColor: '#f1f5f9' }
                    const textClass = val > 0 && opacity > 0.5 
                      ? 'text-white font-extrabold' 
                      : 'text-slate-800 font-bold'

                    return (
                      <td 
                        key={month} 
                        style={bgStyle}
                        className={`px-4 py-3.5 text-center font-mono border-r last:border-r-0 border-slate-150 ${textClass}`}
                        title={`${course} — ${month}: ${val} leads`}
                      >
                        {val > 0 ? val.toLocaleString() : '-'}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
