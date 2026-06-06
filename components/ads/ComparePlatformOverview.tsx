// components/ads/ComparePlatformOverview.tsx
'use client';

import React from 'react'
import { MetaAccountOverview, GoogleAccountOverview } from '@/lib/types'
import { Award, Zap, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComparePlatformOverviewProps {
  meta: MetaAccountOverview
  google: GoogleAccountOverview
}

export default function ComparePlatformOverview({ meta, google }: ComparePlatformOverviewProps) {
  const googleWebCPL = google.websiteConversions > 0 ? google.spend / google.websiteConversions : 0

  // Metrics definitions for Side-by-side
  const comparisonItems = [
    {
      id: 'spend',
      label: 'Investment Spend',
      metaVal: meta.spend,
      metaDisp: `₹${Math.round(meta.spend).toLocaleString()}`,
      googleVal: google.spend,
      googleDisp: `₹${Math.round(google.spend).toLocaleString()}`,
      // Higher is not necessarily better for spend, so we check who spent more
      winner: meta.spend > google.spend ? 'meta' : 'google',
      winnerText: 'Higher Investment',
      isLowerBetter: false
    },
    {
      id: 'impressions',
      label: 'Total Impressions',
      metaVal: meta.impressions,
      metaDisp: meta.impressions.toLocaleString(),
      googleVal: google.impressions,
      googleDisp: google.impressions.toLocaleString(),
      winner: meta.impressions > google.impressions ? 'meta' : 'google',
      isLowerBetter: false
    },
    {
      id: 'clicks',
      label: 'Link Clicks',
      metaVal: meta.clicks,
      metaDisp: meta.clicks.toLocaleString(),
      googleVal: google.clicks,
      googleDisp: google.clicks.toLocaleString(),
      winner: meta.clicks > google.clicks ? 'meta' : 'google',
      isLowerBetter: false
    },
    {
      id: 'ctr',
      label: 'Click-Through Rate (CTR %)',
      metaVal: meta.ctr,
      metaDisp: `${meta.ctr.toFixed(2)}%`,
      googleVal: google.ctr,
      googleDisp: `${google.ctr.toFixed(2)}%`,
      winner: meta.ctr > google.ctr ? 'meta' : 'google',
      isLowerBetter: false
    },
    {
      id: 'cpc',
      label: 'Average Cost Per Click',
      metaVal: meta.cpc,
      metaDisp: `₹${meta.cpc.toFixed(2)}`,
      googleVal: google.avgCpc,
      googleDisp: `₹${google.avgCpc.toFixed(2)}`,
      // Lower CPC is better
      winner: meta.cpc > 0 && (meta.cpc < google.avgCpc || google.avgCpc === 0) ? 'meta' : 'google',
      isLowerBetter: true
    },
    {
      id: 'leadFormFills',
      label: 'Lead Form Fills',
      metaVal: meta.leadFormFills,
      metaDisp: meta.leadFormFills.toLocaleString(),
      googleVal: google.formSubmissions,
      googleDisp: google.formSubmissions.toLocaleString(),
      winner: meta.leadFormFills > google.formSubmissions ? 'meta' : 'google',
      isLowerBetter: false
    },
    {
      id: 'costPerLeadForm',
      label: 'Cost Per Form Lead (CPL)',
      metaVal: meta.costPerLeadForm,
      metaDisp: `₹${meta.costPerLeadForm.toFixed(2)}`,
      googleVal: google.costPerFormSubmission,
      googleDisp: `₹${google.costPerFormSubmission.toFixed(2)}`,
      winner: meta.costPerLeadForm > 0 && (meta.costPerLeadForm < google.costPerFormSubmission || google.costPerFormSubmission === 0) ? 'meta' : 'google',
      isLowerBetter: true
    },
    {
      id: 'websiteLeads',
      label: 'Website Leads',
      metaVal: meta.websiteLeads,
      metaDisp: meta.websiteLeads.toLocaleString(),
      googleVal: google.websiteConversions,
      googleDisp: google.websiteConversions.toLocaleString(),
      winner: meta.websiteLeads > google.websiteConversions ? 'meta' : 'google',
      isLowerBetter: false
    },
    {
      id: 'costPerWebsiteLead',
      label: 'Cost Per Web Lead (CPL)',
      metaVal: meta.costPerWebsiteLead,
      metaDisp: `₹${meta.costPerWebsiteLead.toFixed(2)}`,
      googleVal: googleWebCPL,
      googleDisp: `₹${googleWebCPL.toFixed(2)}`,
      winner: meta.costPerWebsiteLead > 0 && (meta.costPerWebsiteLead < googleWebCPL || googleWebCPL === 0) ? 'meta' : 'google',
      isLowerBetter: true
    },
    {
      id: 'conversions',
      label: 'Total Conversions',
      metaVal: meta.totalConversions,
      metaDisp: meta.totalConversions.toLocaleString(),
      googleVal: google.conversions,
      googleDisp: google.conversions.toLocaleString(),
      winner: meta.totalConversions > google.conversions ? 'meta' : 'google',
      isLowerBetter: false
    }
  ]

  // Count winners
  const metaWins = comparisonItems.filter(i => i.id !== 'spend' && i.winner === 'meta').length
  const googleWins = comparisonItems.filter(i => i.id !== 'spend' && i.winner === 'google').length

  return (
    <div className="space-y-6">
      {/* Platform Winner announcement banner */}
      <div className={cn(
        "p-5 border rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300",
        metaWins > googleWins
          ? "bg-blue-50/40 border-blue-150 text-blue-900"
          : googleWins > metaWins
            ? "bg-cyan-50/30 border-cyan-150 text-cyan-900"
            : "bg-slate-50 border-slate-200 text-slate-700"
      )}>
        <div className="flex items-center gap-3">
          <Award className={cn(
            "w-8 h-8 shrink-0",
            metaWins > googleWins ? "text-blue-600" : googleWins > metaWins ? "text-cyan-600" : "text-slate-500"
          )} />
          <div>
            <h3 className="text-sm font-extrabold">
              {metaWins > googleWins 
                ? "Meta Ads takes the Lead Performance!"
                : googleWins > metaWins 
                  ? "Google Ads dominates Conversion Value!"
                  : "Platforms are Neck-and-Neck!"
              }
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Meta won {metaWins} benchmarks vs Google's {googleWins} benchmarks. Review CPC vs CPL metrics below.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm">
            <span>Facebook</span>
            <span className="bg-blue-700/80 px-1.5 py-0.5 rounded-md text-[9px]">{metaWins}</span>
          </div>
          <div className="bg-cyan-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm">
            <span>Google</span>
            <span className="bg-cyan-700/80 px-1.5 py-0.5 rounded-md text-[9px]">{googleWins}</span>
          </div>
        </div>
      </div>

      {/* Head to Head Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-700">Side-by-Side Efficiency Performance</span>
          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> Platform Efficiencies
          </span>
        </div>

        <div className="overflow-x-auto text-left">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-150 bg-slate-50 text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                <th className="py-3 px-4 w-52">Comparison Metric</th>
                <th className="py-3 px-4 text-center bg-blue-50/20 border-r border-blue-50">📘 Meta Ads Platform</th>
                <th className="py-3 px-4 text-center bg-cyan-50/10">🔵 Google Ads Platform</th>
                <th className="py-3 px-4 text-center w-40">Winner Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-xs">
              {comparisonItems.map(item => {
                const isMetaWin = item.winner === 'meta'
                const isGoogleWin = item.winner === 'google'
                return (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50/30">
                    <td className="py-3 px-4 font-bold text-slate-700">{item.label}</td>
                    <td className={cn(
                      "py-3 px-4 text-center font-mono font-bold bg-blue-50/10 border-r border-blue-50/20",
                      isMetaWin ? "text-blue-600 text-sm font-extrabold" : "text-slate-500"
                    )}>
                      {item.metaDisp}
                    </td>
                    <td className={cn(
                      "py-3 px-4 text-center font-mono font-bold bg-cyan-50/5",
                      isGoogleWin ? "text-cyan-600 text-sm font-extrabold" : "text-slate-500"
                    )}>
                      {item.googleDisp}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center">
                        {isMetaWin ? (
                          <span className="flex items-center gap-1 text-[9px] font-extrabold bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full border border-blue-200">
                            📘 Meta
                          </span>
                        ) : isGoogleWin ? (
                          <span className="flex items-center gap-1 text-[9px] font-extrabold bg-cyan-50 text-cyan-800 px-2.5 py-1 rounded-full border border-cyan-200">
                            🔵 Google
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
