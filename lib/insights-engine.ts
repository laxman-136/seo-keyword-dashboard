// lib/insights-engine.ts
import { AttributedLead, CampaignAttributionResult } from './attribution'
import { GA4LandingPage } from './types'

export interface Insight {
  type: 'opportunity' | 'warning' | 'critical' | 'positive'
  category: 'budget' | 'creative' | 'audience' | 'keyword' | 'placement' | 'course' | 'website'
  title: string
  detail: string
  impact: 'high' | 'medium' | 'low'
  estimatedRevenueImpact: number | null
  recommendedAction: string
  dataPoints: string[]
}

export function generateInsights(
  attributionData: CampaignAttributionResult[],
  landingPages: GA4LandingPage[],
  metaFrequencyAvg: number,
  keywordsData: Array<{ text: string; spend: number; conversions: number }>,
  totalBudget: number
): Insight[] {
  const insights: Insight[] = []

  // Rule 1: Critical — High spend, zero enrollments
  attributionData.forEach(campaign => {
    if (campaign.enrolledLeads === 0 && campaign.costPerLead > 0 && campaign.costPerLead * campaign.totalLeads > 10000) {
      const spend = Math.round(campaign.costPerLead * campaign.totalLeads)
      insights.push({
        type: 'critical',
        category: 'budget',
        title: `Wasted Budget on ${campaign.campaignName}`,
        detail: `This campaign spent ₹${spend.toLocaleString()} with ZERO enrolled students.`,
        impact: 'high',
        estimatedRevenueImpact: spend, // saving this budget is direct return
        recommendedAction: 'Pause this campaign immediately or audit its audience targeting and landing page relevance.',
        dataPoints: [`Spend: ₹${spend}`, `Enrollments: 0`]
      })
    }
  })

  // Rule 2: Opportunity — High ROAS, low budget allocation
  attributionData.forEach(campaign => {
    const spend = campaign.costPerLead * campaign.totalLeads
    if (campaign.trueROAS > 4.5 && spend < totalBudget * 0.15 && spend > 0) {
      const pct = ((spend / totalBudget) * 100).toFixed(1)
      insights.push({
        type: 'opportunity',
        category: 'budget',
        title: `Scale High-Performer: ${campaign.campaignName}`,
        detail: `Campaign is achieving a strong ${campaign.trueROAS}x True ROAS but only accounts for ${pct}% of total spend.`,
        impact: 'high',
        estimatedRevenueImpact: Math.round(spend * 1.5),
        recommendedAction: `Increase daily budget for this campaign by 30% to capture more high-value enrollments.`,
        dataPoints: [`ROAS: ${campaign.trueROAS}x`, `Budget Share: ${pct}%`]
      })
    }
  })

  // Rule 3: Warning — Audience fatigue
  if (metaFrequencyAvg > 3.5) {
    insights.push({
      type: 'warning',
      category: 'creative',
      title: 'Meta Audience Fatigue Warning',
      detail: `Average frequency on Meta is ${metaFrequencyAvg.toFixed(2)}, indicating users are seeing the same ad too many times.`,
      impact: 'medium',
      estimatedRevenueImpact: null,
      recommendedAction: 'Expand audience targeting parameters or introduce fresh creative assets (new hook videos or carousels).',
      dataPoints: [`Avg Frequency: ${metaFrequencyAvg.toFixed(2)}`, `Optimal Limit: 2.5`]
    })
  }

  // Rule 4: Keyword waste
  keywordsData.forEach(kw => {
    if (kw.spend > 5000 && kw.conversions === 0) {
      insights.push({
        type: 'warning',
        category: 'keyword',
        title: `Inefficient Keyword: "${kw.text}"`,
        detail: `Spent ₹${kw.spend.toLocaleString()} with 0 student conversions.`,
        impact: 'medium',
        estimatedRevenueImpact: kw.spend,
        recommendedAction: `Add "${kw.text}" as a negative keyword in Google Ads to prevent further wasteful search match costs.`,
        dataPoints: [`Keyword Spend: ₹${kw.spend}`, `Conversions: 0`]
      })
    }
  })

  // Rule 5: Landing page bounce warning (GA4)
  landingPages.forEach(page => {
    if (page.bounceRate > 70 && page.sessions > 100) {
      insights.push({
        type: 'warning',
        category: 'website',
        title: `High Bounce Rate on ${page.pagePath}`,
        detail: `The landing page has a bounce rate of ${page.bounceRate.toFixed(1)}% across ${page.sessions} sessions.`,
        impact: 'medium',
        estimatedRevenueImpact: null,
        recommendedAction: 'Optimize page load times, check mobile rendering layouts, and align ad messaging hooks more closely with page headers.',
        dataPoints: [`Bounce Rate: ${page.bounceRate.toFixed(1)}%`, `Sessions: ${page.sessions}`]
      })
    }
  })

  // Add default positive insight if no critical errors are present
  if (insights.filter(i => i.type === 'critical').length === 0 && attributionData.length > 0) {
    const bestCampaign = [...attributionData].sort((a, b) => b.trueROAS - a.trueROAS)[0]
    if (bestCampaign && bestCampaign.trueROAS > 1) {
      insights.push({
        type: 'positive',
        category: 'budget',
        title: `Healthy ROAS Core Found`,
        detail: `Attribution engine validates "${bestCampaign.campaignName}" as the primary conversion driver.`,
        impact: 'low',
        estimatedRevenueImpact: null,
        recommendedAction: 'Continue current bidding parameters and protect budget share for this campaign.',
        dataPoints: [`Top Campaign: ${bestCampaign.campaignName}`, `ROAS: ${bestCampaign.trueROAS}x`]
      })
    }
  }

  return insights
}
