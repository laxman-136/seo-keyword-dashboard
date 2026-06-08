// lib/dateRange.ts

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last_3_days'
  | 'last_7_days'
  | 'last_14_days'
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'this_quarter'
  | 'this_year'
  | 'custom'

export interface DateRange {
  from: string    // YYYY-MM-DD
  to: string      // YYYY-MM-DD
  preset: DatePreset
  label: string   // "Last 7 Days" etc
}

/**
 * Returns YYYY-MM-DD string for a Date in IST
 */
export function getISTDateString(date: Date = new Date()): string {
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' } as const
  const formatter = new Intl.DateTimeFormat('en-US', options)
  const parts = formatter.formatToParts(date)
  const year = parts.find(p => p.type === 'year')?.value || '2026'
  const month = parts.find(p => p.type === 'month')?.value || '06'
  const day = parts.find(p => p.type === 'day')?.value || '06'
  return `${year}-${month}-${day}`
}

/**
 * Gets a Date object representing midnight in IST for a given date
 */
export function getISTDateObject(date: Date = new Date()): Date {
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' } as const
  const formatter = new Intl.DateTimeFormat('en-US', options)
  const formattedStr = formatter.format(date) // "M/D/YYYY"
  return new Date(formattedStr)
}

const PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last_3_days: 'Last 3 Days',
  last_7_days: 'Last 7 Days',
  last_14_days: 'Last 14 Days',
  this_month: 'This Month',
  last_month: 'Last Month',
  last_3_months: 'Last 3 Months',
  this_quarter: 'This Quarter',
  this_year: 'This Year',
  custom: 'Custom Range'
}

export function resolveDateRange(preset: DatePreset, customFrom?: string, customTo?: string): DateRange {
  const today = getISTDateObject()
  let fromDate = new Date(today)
  let toDate = new Date(today)
  let label = PRESET_LABELS[preset]

  switch (preset) {
    case 'today':
      // toDate = fromDate = today
      break

    case 'yesterday':
      fromDate.setDate(today.getDate() - 1)
      toDate.setDate(today.getDate() - 1)
      break

    case 'last_3_days':
      fromDate.setDate(today.getDate() - 2)
      break

    case 'last_7_days':
      fromDate.setDate(today.getDate() - 6)
      break

    case 'last_14_days':
      fromDate.setDate(today.getDate() - 13)
      break

    case 'this_month':
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1)
      break

    case 'last_month': {
      fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      toDate = new Date(today.getFullYear(), today.getMonth(), 0)
      break
    }

    case 'last_3_months':
      fromDate = new Date(today.getFullYear(), today.getMonth() - 3, 1)
      break

    case 'this_quarter': {
      const qMonth = Math.floor(today.getMonth() / 3) * 3
      fromDate = new Date(today.getFullYear(), qMonth, 1)
      break
    }

    case 'this_year':
      fromDate = new Date(today.getFullYear(), 0, 1)
      break

    case 'custom':
      if (customFrom && customTo) {
        // Enforce max range of 365 days
        const f = new Date(customFrom)
        const t = new Date(customTo)
        const diffTime = Math.abs(t.getTime() - f.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays > 365) {
          // Cap to 365 days
          const adjustedTo = new Date(f)
          adjustedTo.setDate(f.getDate() + 365)
          return {
            from: customFrom,
            to: getISTDateString(adjustedTo),
            preset: 'custom',
            label: `Custom (capped 365d)`
          }
        }
        return {
          from: customFrom,
          to: customTo,
          preset: 'custom',
          label: `${customFrom} to ${customTo}`
        }
      }
      break
  }

  return {
    from: getISTDateString(fromDate),
    to: getISTDateString(toDate),
    preset,
    label
  }
}

export function formatForMetaAPI(range: DateRange): { since: string; until: string } {
  return {
    since: range.from,
    until: range.to
  }
}

export function formatForGoogleAPI(range: DateRange): { startDate: string; endDate: string } {
  // Google Ads API expects YYYYMMDD or YYYY-MM-DD depending on endpoint/client.
  // Standard format is YYYYMMDD (no dashes) or YYYY-MM-DD
  return {
    startDate: range.from.replace(/-/g, ''),
    endDate: range.to.replace(/-/g, '')
  }
}
