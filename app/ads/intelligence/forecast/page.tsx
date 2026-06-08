// app/ads/intelligence/forecast/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react'
import { useDateRange } from '@/hooks/useDateRange'
import DateRangePicker from '@/components/ads/DateRangePicker'
import RefreshBar from '@/components/ads/RefreshBar'
import { TrendingUp, AlertCircle, HelpCircle } from 'lucide-react'

export default function ForecastPage() {
  const { preset, from, to, label, setDateRange } = useDateRange()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (bypassCache = false) => {
    try {
      if (bypassCache) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const query = new URLSearchParams({ preset })
      if (preset === 'custom' && from && to) {
        query.set('from', from)
        query.set('to', to)
      }
      if (bypassCache) {
        query.set('refresh', 'true')
      }

      const res = await fetch(`/api/ads/intelligence/forecast?${query.toString()}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to fetch forecast data')
      }

      const resData = await res.json()
      setData(resData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while fetching forecast data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [preset, from, to])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    fetchData(true)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">Performance Forecasting</h1>
            <p className="text-xs text-slate-400 mt-1">Linear statistical projections and landing page optimization what-if calculations</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker />
          <RefreshBar
            loading={loading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>Error loading Forecasts: {error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-[250px] bg-white border border-slate-200 rounded-2xl" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Month-End Runrate Projection */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <h4 className="text-base font-extrabold text-slate-800">Month-End Runrate Projections</h4>
              <p className="text-xs text-slate-400">Statistical linear extrapolation of current spending velocity and conversion rates</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Spend Runrate</span>
                <h4 className="text-lg font-bold text-slate-800 mt-1">₹{data.projected.spend.toLocaleString()}</h4>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Leads Runrate</span>
                <h4 className="text-lg font-bold text-slate-800 mt-1">{data.projected.leads.toLocaleString()}</h4>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Enrolled Runrate</span>
                <h4 className="text-lg font-bold text-slate-800 mt-1">{data.projected.enrolled}</h4>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Revenue Runrate</span>
                <h4 className="text-lg font-bold text-slate-800 mt-1">₹{data.projected.revenue.toLocaleString()}</h4>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Projected CPE</span>
                <h4 className="text-lg font-bold text-slate-800 mt-1">₹{data.projected.cpe.toLocaleString()}</h4>
              </div>
            </div>
          </div>

          {/* What If Scenario Optimization */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <h4 className="text-base font-extrabold text-slate-800">What-If Optimization Scenarios</h4>
              <p className="text-xs text-slate-400">Simulate how improving landing page conversion rates impacts registrations and ROAS</p>
            </div>
            <div className="space-y-4">
              {data.scenarios.map((s: any, idx: number) => (
                <div key={idx} className="p-5 rounded-xl border border-indigo-100 bg-indigo-50/10 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white">Scenario {idx + 1}</span>
                    <h5 className="text-sm font-extrabold text-slate-800 mt-2">Optimize Landing Page CR to {s.landingPageConvRate}%</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Assumes current ad click counts remain constant.</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-right">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Projected Leads</p>
                      <p className="text-sm font-bold text-slate-800">{s.projectedLeads}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Projected Enrolled</p>
                      <p className="text-sm font-bold text-slate-800">{s.projectedEnrolled}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Projected Revenue</p>
                      <p className="text-sm font-bold text-slate-800">₹{s.projectedRevenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Projected ROAS</p>
                      <p className="text-sm font-black text-indigo-600">{s.roas}x</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
