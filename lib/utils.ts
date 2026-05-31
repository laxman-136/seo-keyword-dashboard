// lib/utils.ts

/**
 * Merges conditional Tailwind classnames cleanly
 */
export function cn(...inputs: (string | undefined | null | boolean | Record<string, boolean>)[]) {
  const classes: string[] = []

  inputs.forEach(input => {
    if (!input) return

    if (typeof input === 'string') {
      classes.push(input)
    } else if (typeof input === 'object') {
      Object.entries(input).forEach(([key, value]) => {
        if (value) classes.push(key)
      })
    }
  })

  return classes.join(' ')
}

/**
 * Format month label for CEO readability (e.g. "May-26" -> "May 2026")
 */
export function formatMonthLabel(monthKey: string): string {
  if (!monthKey) return ''
  const [mon, yr] = monthKey.split('-')
  if (!mon || !yr) return monthKey

  const fullYears: Record<string, string> = {
    '25': '2025',
    '26': '2026',
    '27': '2027',
    '28': '2028'
  }
  const year = fullYears[yr] || `20${yr}`

  const monthNames: Record<string, string> = {
    'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
    'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
    'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
  }
  const monthName = monthNames[mon] || mon

  return `${monthName} ${year}`
}
