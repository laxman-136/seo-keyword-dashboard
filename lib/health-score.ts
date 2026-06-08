// lib/health-score.ts

export interface HealthScore {
  score: number
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F'
  areasToImprove: string[]
}

export function calculateAccountHealthScore(data: {
  avgCPL: number
  targetCPL: number
  enrollmentROAS: number
  qualityLeadRate: number
  budgetPacing: number          // % of ideal pace, e.g. 100
  frequencyAvg: number          // Meta frequency, e.g. 2.1
  qualityScoreAvg: number       // Google QS avg (1-10)
  responseRate: number          // % leads contacted < 1hr, e.g. 75
}): HealthScore {
  let score = 0
  const areasToImprove: string[] = []

  // 1. CPL vs Target (20 pts)
  // Target is target CPL. If CPL <= target CPL, get full 20 pts.
  // Else, scale down. If CPL >= 2 * target CPL, get 0 pts.
  if (data.avgCPL > 0 && data.targetCPL > 0) {
    if (data.avgCPL <= data.targetCPL) {
      score += 20
    } else {
      const ratio = data.avgCPL / data.targetCPL
      const pts = Math.max(0, 20 - (ratio - 1) * 20)
      score += Math.round(pts)
      if (ratio > 1.3) {
        areasToImprove.push(`Cost Per Lead (₹${Math.round(data.avgCPL)}) is ${Math.round((ratio - 1) * 100)}% above the target of ₹${data.targetCPL}.`)
      }
    }
  } else {
    score += 15 // default fallback points
  }

  // 2. Enrollment ROAS (25 pts)
  // Target is ROAS >= 4.0x (full 25 pts).
  // Under 1.0x (0 pts). Linearly scale.
  if (data.enrollmentROAS >= 4.0) {
    score += 25
  } else {
    const pts = Math.max(0, (data.enrollmentROAS / 4.0) * 25)
    score += Math.round(pts)
    if (data.enrollmentROAS < 2.5) {
      areasToImprove.push(`Attributed ROAS is low at ${data.enrollmentROAS.toFixed(2)}x (target is 4.0x). Optimize bottom-funnel close rates.`)
    }
  }

  // 3. Quality Lead Rate (20 pts)
  // Target: High Potential + Enrolled leads / Total leads >= 40% (full 20 pts).
  // Scale down linearly.
  if (data.qualityLeadRate >= 40) {
    score += 20
  } else {
    const pts = Math.max(0, (data.qualityLeadRate / 40) * 20)
    score += Math.round(pts)
    if (data.qualityLeadRate < 25) {
      areasToImprove.push(`Lead Quality Rate is only ${data.qualityLeadRate.toFixed(1)}% (target is 40%). Verify ad hooks and keywords targeting.`)
    }
  }

  // 4. Budget Efficiency / Pacing (10 pts)
  // Target: Pacing is between 85% and 115% of ideal (full 10 pts).
  // If way off, deduct points.
  const pacingOffset = Math.abs(data.budgetPacing - 100)
  if (pacingOffset <= 15) {
    score += 10
  } else {
    const pts = Math.max(0, 10 - (pacingOffset - 15) * 0.2)
    score += Math.round(pts)
    if (data.budgetPacing > 115) {
      areasToImprove.push(`Ad accounts are over-pacing at ${Math.round(data.budgetPacing)}% of ideal monthly spend. Consider capping daily caps.`)
    } else if (data.budgetPacing < 85) {
      areasToImprove.push(`Ad accounts are under-pacing at ${Math.round(data.budgetPacing)}% of ideal monthly spend. Increase bids or expand audience pools.`)
    }
  }

  // 5. Audience Freshness / Fatigue (10 pts)
  // Target: Meta average frequency < 2.5 (full 10 pts).
  // If frequency >= 4.0 (0 pts).
  if (data.frequencyAvg <= 2.5) {
    score += 10
  } else {
    const pts = Math.max(0, 10 - ((data.frequencyAvg - 2.5) / 1.5) * 10)
    score += Math.round(pts)
    if (data.frequencyAvg > 3.2) {
      areasToImprove.push(`Audience fatigue detected on Meta (average frequency ${data.frequencyAvg.toFixed(2)}). Creative refresh recommended.`)
    }
  }

  // 6. Google Quality Score (10 pts)
  // Target: average QS >= 8/10 (full 10 pts).
  // Scale down linearly.
  if (data.qualityScoreAvg >= 8.0) {
    score += 10
  } else {
    const pts = Math.max(0, (data.qualityScoreAvg / 8.0) * 10)
    score += Math.round(pts)
    if (data.qualityScoreAvg < 6.0) {
      areasToImprove.push(`Google Keyword Quality Score is low at ${data.qualityScoreAvg.toFixed(1)}/10. Improve landing page experience or ad copy copy relevance.`)
    }
  }

  // 7. Team Response Speed (5 pts)
  // Target: response rate < 1 hr is >= 80% (full 5 pts).
  if (data.responseRate >= 80) {
    score += 5
  } else {
    const pts = Math.max(0, (data.responseRate / 80) * 5)
    score += Math.round(pts)
    if (data.responseRate < 60) {
      areasToImprove.push(`Only ${Math.round(data.responseRate)}% of fresh leads are called within the first hour. Team follow-up speed must improve.`)
    }
  }

  // Calculate final grade
  let grade: HealthScore['grade'] = 'F'
  if (score >= 90) grade = 'A+'
  else if (score >= 80) grade = 'A'
  else if (score >= 70) grade = 'B+'
  else if (score >= 60) grade = 'B'
  else if (score >= 50) grade = 'C'
  else if (score >= 40) grade = 'D'

  return {
    score: Math.min(100, Math.max(0, score)),
    grade,
    areasToImprove
  }
}
