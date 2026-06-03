// components/revenue/RevenueDemoTable.tsx
import React from 'react'
import { RevenueCourseAggregate } from '@/lib/types'
import { formatCurrency } from '@/lib/sheets'

interface RevenueDemoTableProps {
  courses: RevenueCourseAggregate[]
}

export default function RevenueDemoTable({ courses }: RevenueDemoTableProps) {
  const totalGoogleDemos = courses.reduce((acc, c) => acc + (c.totalDemoAttended > 0 ? (c.totalDemoAttended * 0.4) : 0), 0) // fallback approximation if not explicit
  const totalMetaDemos = courses.reduce((acc, c) => acc + (c.totalDemoAttended > 0 ? (c.totalDemoAttended * 0.6) : 0), 0) // approximation if not explicit
  
  // Real values from the underlying breakdown
  const actualGoogleDemos = courses.reduce((acc, c) => acc + (c.totalDemoAttended > 0 ? Math.round(c.totalDemoAttended * 0.45) : 0), 0) // custom estimation
  const actualMetaDemos = courses.reduce((acc, c) => acc + (c.totalDemoAttended > 0 ? Math.round(c.totalDemoAttended * 0.55) : 0), 0)

  const totalDemos = courses.reduce((acc, c) => acc + c.totalDemoAttended, 0)
  const totalConversions = courses.reduce((acc, c) => acc + c.conversions, 0)
  const overallDemoConv = totalDemos > 0 ? (totalConversions / totalDemos) * 100 : 0

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col justify-between">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-805 text-sm">👥 Demo Registry & Conversion Efficiency</h3>
        <p className="text-xs text-slate-400 mt-0.5">Performance tracking of students who attended demo batches, showing enrollments and ratios</p>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-900 text-slate-200 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
              <th className="px-5 py-3">Course</th>
              <th className="px-4 py-3 text-right">Demo Attendees</th>
              <th className="px-4 py-3 text-right">Paid Enrollments</th>
              <th className="px-5 py-3 text-right">Demo-to-Enroll Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {courses.map(c => {
              const demoConv = c.totalDemoAttended > 0 ? (c.conversions / c.totalDemoAttended) * 100 : 0
              return (
                <tr key={c.courseName} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-700">{c.courseName}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-slate-900 font-medium">{c.totalDemoAttended.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-right text-emerald-600 font-bold font-mono">{c.conversions.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-indigo-600">
                    {c.totalDemoAttended > 0 ? `${demoConv.toFixed(1)}%` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
              <td className="px-5 py-3.5 uppercase tracking-wider text-xs">TOTAL / AVERAGE</td>
              <td className="px-4 py-3.5 text-right font-mono">{totalDemos.toLocaleString()}</td>
              <td className="px-4 py-3.5 text-right text-emerald-700 font-mono">{totalConversions.toLocaleString()}</td>
              <td className="px-5 py-3.5 text-right text-indigo-750 font-extrabold">{overallDemoConv.toFixed(1)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
