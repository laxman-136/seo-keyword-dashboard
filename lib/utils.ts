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
 * Format month label for CEO readability (e.g. "May-26" -> "May 2026" or "May-2026" -> "May 2026")
 */
export function formatMonthLabel(monthKey: any): string {
  if (!monthKey) return ''

  let keyStr = ''
  if (monthKey instanceof Date) {
    try {
      keyStr = monthKey.toISOString().split('T')[0]
    } catch {
      keyStr = String(monthKey)
    }
  } else {
    keyStr = String(monthKey)
  }

  // If it's a daily date like YYYY-MM-DD (e.g. 2026-06-04)
  if (/^\d{4}-\d{2}-\d{2}$/.test(keyStr)) {
    const [year, month, day] = keyStr.split('-')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthIndex = parseInt(month, 10) - 1
    const monthName = monthNames[monthIndex] || month
    // Format to "04 Jun 2026"
    return `${day} ${monthName} ${year}`
  }

  const [mon, yr] = keyStr.split('-')
  if (!mon || !yr) return keyStr

  // Handle both 2-digit years ("26") and 4-digit years ("2026")
  let year = yr
  if (yr.length === 2) {
    const fullYears: Record<string, string> = {
      '25': '2025',
      '26': '2026',
      '27': '2027',
      '28': '2028'
    }
    year = fullYears[yr] || `20${yr}`
  }

  const monthNames: Record<string, string> = {
    'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
    'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
    'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
  }
  const monthName = monthNames[mon] || mon

  return `${monthName} ${year}`
}
