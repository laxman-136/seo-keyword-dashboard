// hooks/useDateRange.ts
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { DatePreset, DateRange, resolveDateRange } from '@/lib/dateRange'

export function useDateRange() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const preset = useMemo(() => {
    return (searchParams.get('preset') || 'last_7_days') as DatePreset
  }, [searchParams])

  const from = useMemo(() => {
    return searchParams.get('from') || undefined
  }, [searchParams])

  const to = useMemo(() => {
    return searchParams.get('to') || undefined
  }, [searchParams])

  const dateRange = useMemo<DateRange>(() => {
    return resolveDateRange(preset, from, to)
  }, [preset, from, to])

  const setDateRange = useCallback((newPreset: DatePreset, newFrom?: string, newTo?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('preset', newPreset)
    if (newPreset === 'custom' && newFrom && newTo) {
      params.set('from', newFrom)
      params.set('to', newTo)
    } else {
      params.delete('from')
      params.delete('to')
    }
    
    // Push state
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [pathname, router, searchParams])

  return {
    preset,
    from: dateRange.from,
    to: dateRange.to,
    label: dateRange.label,
    dateRange,
    setDateRange
  }
}
