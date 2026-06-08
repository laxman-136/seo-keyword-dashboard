// lib/forecast.ts

export interface ForecastProjected {
  spend: number
  leads: number
  enrolled: number
  revenue: number
  cpe: number
}

/**
 * Projects month-end numbers based on current month-to-date metrics and elapsed days.
 * 
 * @param mtdSpend Spend to date
 * @param mtdLeads Leads to date
 * @param mtdEnrolled Enrollments to date
 * @param mtdRevenue Revenue to date
 * @param elapsedDays Number of elapsed days in current month, e.g. 15
 * @param totalDays Total days in current month (usually 30 or 31)
 */
export function projectMonthEnd(
  mtdSpend: number,
  mtdLeads: number,
  mtdEnrolled: number,
  mtdRevenue: number,
  elapsedDays: number,
  totalDays: number = 30
): ForecastProjected {
  const daysMultiplier = totalDays / Math.max(1, elapsedDays)
  
  const projectedSpend = mtdSpend * daysMultiplier
  const projectedLeads = mtdLeads * daysMultiplier
  const projectedEnrolled = mtdEnrolled * daysMultiplier
  const projectedRevenue = mtdRevenue * daysMultiplier
  
  const projectedCPE = projectedEnrolled > 0 ? projectedSpend / projectedEnrolled : 0

  return {
    spend: Math.round(projectedSpend),
    leads: Math.round(projectedLeads),
    enrolled: Math.round(projectedEnrolled),
    revenue: Math.round(projectedRevenue),
    cpe: Math.round(projectedCPE)
  }
}

export interface WhatIfScenarioResult {
  landingPageConvRate: number
  projectedLeads: number
  projectedEnrolled: number
  projectedRevenue: number
  spendNeeded: number
  roas: number
}

/**
 * Calculates a what-if projection when the landing page conversion rate is optimized
 * 
 * @param currentSessions Projected month-end sessions
 * @param targetConvRate Landing page conversion rate, e.g. 6 (for 6%)
 * @param leadToEnrollRate Historic CRM lead to enrolled conversion percentage, e.g. 10 (for 10%)
 * @param currentSpend Projected month-end ad spend
 * @param avgFee Average course registration fee
 */
export function calculateWhatIfScenario(
  currentSessions: number,
  targetConvRate: number,
  leadToEnrollRate: number,
  currentSpend: number,
  avgFee: number
): WhatIfScenarioResult {
  // Conversions = Sessions * Target Conversion Rate
  const projectedLeads = Math.round(currentSessions * (targetConvRate / 100))
  // Enrolled = Conversions * CRM Conversion Rate
  const projectedEnrolled = Math.round(projectedLeads * (leadToEnrollRate / 100))
  // Revenue = Enrolled * Avg Fee
  const projectedRevenue = projectedEnrolled * avgFee
  
  const roas = currentSpend > 0 ? projectedRevenue / currentSpend : 0

  return {
    landingPageConvRate: targetConvRate,
    projectedLeads,
    projectedEnrolled,
    projectedRevenue,
    spendNeeded: currentSpend,
    roas: parseFloat(roas.toFixed(2))
  }
}
