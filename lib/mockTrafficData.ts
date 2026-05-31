// lib/mockTrafficData.ts
import { TrafficRow, TrafficSource, TrafficCountry } from './types'
import { TRAFFIC_SOURCES, TRAFFIC_COUNTRIES } from './calculations'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Base distribution weights for sources
const SOURCE_WEIGHTS: Record<TrafficSource, number> = {
  'Organic': 0.45,
  'Direct': 0.20,
  'Paid Search': 0.12,
  'Referral': 0.08,
  'Social': 0.05,
  'Video': 0.04,
  'Cross Network': 0.02,
  'Display': 0.02,
  'Email': 0.01,
  'Unassigned': 0.01
}

// Base distribution weights for countries
const COUNTRY_WEIGHTS: Record<TrafficCountry, number> = {
  'India': 0.55,
  'USA': 0.15,
  'UAE': 0.08,
  'Saudi Arabia': 0.06,
  'Canada': 0.05,
  'Pakistan': 0.04,
  'United Kingdom': 0.03,
  'Poland': 0.02,
  'Others': 0.02
}

/**
 * Generate sequential traffic mock data from Jan 2024 to May 2026 programmatically
 */
export function generateMockTrafficData(): TrafficRow[] {
  const rows: TrafficRow[] = []

  const startYear = 2024
  const startMonth = 0 // January
  const endYear = 2026
  const endMonth = 4 // May

  let baseUsers = 18000 // Starts at 18k users

  for (let year = startYear; year <= endYear; year++) {
    const maxMonth = year === endYear ? endMonth : 11
    
    for (let month = (year === startYear ? startMonth : 0); month <= maxMonth; month++) {
      // Steady compounding growth of ~3% per month
      baseUsers = baseUsers * 1.025

      // Seasonal factors (e.g. Higher in Q1 Jan/Feb, dips slightly in Nov/Dec)
      let seasonalFactor = 1.0
      if (month === 0 || month === 1) seasonalFactor = 1.12 // +12% Jan/Feb
      if (month === 10 || month === 11) seasonalFactor = 0.90 // -10% Nov/Dec

      // Add a slight pseudo-random fluctuation based on the month/year indices (reproducible)
      const randomSeed = Math.sin(year * 12 + month) * 0.05 // +/- 5%
      
      const totalUsers = Math.round(baseUsers * seasonalFactor * (1 + randomSeed))
      const newUsers = Math.round(totalUsers * 0.62) // New users ~62% of total

      const sources = {} as Record<TrafficSource, number>
      TRAFFIC_SOURCES.forEach(s => {
        sources[s] = Math.round(totalUsers * SOURCE_WEIGHTS[s])
      })

      const countries = {} as Record<TrafficCountry, number>
      TRAFFIC_COUNTRIES.forEach(c => {
        countries[c] = Math.round(totalUsers * COUNTRY_WEIGHTS[c])
      })

      const monthName = MONTHS[month]
      const monthLabel = `${monthName}-${year}`

      rows.push({
        month: monthLabel,
        date: new Date(year, month, 1),
        totalUsers,
        newUsers,
        sources,
        countries
      })
    }
  }

  return rows
}

export const MOCK_TRAFFIC = generateMockTrafficData()

/**
 * Returns mock Google Sheets API grid for the Traffic sheet
 */
export function getMockTrafficSheetsResponse(): { values: string[][] } {
  const headers = [
    'Month',
    'Total Users',
    'New Users',
    ...TRAFFIC_SOURCES,
    ...TRAFFIC_COUNTRIES
  ]

  const values: string[][] = [headers]

  MOCK_TRAFFIC.forEach(r => {
    const row = [
      r.month,
      String(r.totalUsers),
      String(r.newUsers),
      ...TRAFFIC_SOURCES.map(s => String(r.sources[s] || 0)),
      ...TRAFFIC_COUNTRIES.map(c => String(r.countries[c] || 0))
    ]
    values.push(row)
  })

  return { values }
}
