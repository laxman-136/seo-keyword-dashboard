// components/leads/intelligence/CourseDemandComponents.tsx
import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { BookOpen, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react'

type BatchStatus = 'Batch Ready' | 'Building' | 'Insufficient' | 'Active'

interface BatchReadinessCardsProps {
  totalCourses: number
  batchReady: number
  building: number
  insufficient: number
}

export function BatchReadinessCards({ totalCourses, batchReady, building, insufficient }: BatchReadinessCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tracked Courses</span>
          <BookOpen className="w-5 h-5 text-slate-400" />
        </div>
        <h3 className="text-3xl font-extrabold text-slate-800">{totalCourses}</h3>
        <p className="text-xs text-slate-400 mt-1">Active oracle & SAP courses</p>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Batch Ready</span>
          <CheckCircle className="w-5 h-5 text-emerald-500" />
        </div>
        <h3 className="text-3xl font-extrabold text-emerald-700">{batchReady}</h3>
        <p className="text-xs text-emerald-400 mt-1">Pipeline ≥ 5 confirmed leads</p>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-yellow-100 bg-yellow-50/20 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Building Pipeline</span>
          <Clock className="w-5 h-5 text-yellow-500" />
        </div>
        <h3 className="text-3xl font-extrabold text-yellow-700">{building}</h3>
        <p className="text-xs text-yellow-400 mt-1">Needs 2–4 more enrollments</p>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-red-100 bg-red-50/20 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Insufficient</span>
          <XCircle className="w-5 h-5 text-red-500" />
        </div>
        <h3 className="text-3xl font-extrabold text-red-700">{insufficient}</h3>
        <p className="text-xs text-red-400 mt-1">Needs urgent lead generation</p>
      </div>
    </div>
  )
}

interface CourseDemandTableProps {
  courses: Array<{
    course: string
    totalLeads: number
    enrolled: number
    highPotential: number
    pipelineSize: number
    batchStatus: BatchStatus
    estimatedStartWindow: string
    demandTrend: 'Rising' | 'Stable' | 'Falling'
  }>
}

export function CourseDemandTable({ courses }: CourseDemandTableProps) {
  const statusColor: Record<BatchStatus, string> = {
    'Batch Ready': 'bg-emerald-50 text-emerald-700',
    'Building': 'bg-yellow-50 text-yellow-700',
    'Insufficient': 'bg-red-50 text-red-700',
    'Active': 'bg-blue-50 text-blue-700',
  }
  const trendIcon: Record<string, string> = { Rising: '📈', Stable: '➡️', Falling: '📉' }

  const chartData = courses.map(c => ({ name: c.course.replace('Oracle Fusion ', '').replace(' Online Training', ''), pipeline: c.pipelineSize, enrolled: c.enrolled }))

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h4 className="text-base font-bold text-slate-800 mb-1">Pipeline vs Enrolled per Course</h4>
        <p className="text-xs text-slate-400 mb-4">Compare warm pipeline (ready-to-close) vs already enrolled students</p>
        <div className="min-h-[260px]">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="pipeline" name="Warm Pipeline" fill="#6366f1" radius={[4,4,0,0]} />
              <Bar dataKey="enrolled" name="Enrolled" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h4 className="text-base font-bold text-slate-800">Batch Readiness Details</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                <th className="py-3 px-5">Course</th>
                <th className="py-3 px-5 text-center">Total Leads</th>
                <th className="py-3 px-5 text-center">Enrolled</th>
                <th className="py-3 px-5 text-center">Hot Pipeline</th>
                <th className="py-3 px-5 text-center">Batch Status</th>
                <th className="py-3 px-5 text-center">Est. Start Window</th>
                <th className="py-3 px-5 text-center">Demand Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {courses.map(c => (
                <tr key={c.course} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-5 font-bold text-slate-800">{c.course}</td>
                  <td className="py-3.5 px-5 text-center">{c.totalLeads}</td>
                  <td className="py-3.5 px-5 text-center text-emerald-600 font-bold">{c.enrolled}</td>
                  <td className="py-3.5 px-5 text-center text-indigo-600">{c.pipelineSize}</td>
                  <td className="py-3.5 px-5 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColor[c.batchStatus]}`}>{c.batchStatus}</span>
                  </td>
                  <td className="py-3.5 px-5 text-center text-slate-500">{c.estimatedStartWindow}</td>
                  <td className="py-3.5 px-5 text-center">{trendIcon[c.demandTrend]} {c.demandTrend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
