// hooks/useMetricsConfig.ts
'use client';

import { useState, useCallback, useMemo } from 'react'
import { 
  MetricConfig, META_METRICS, GOOGLE_METRICS, COMBINED_METRICS, 
  getVisibleMetricIds, saveVisibleMetricIds 
} from '@/lib/metrics-config'

export function useMetricsConfig(pageKey: string, platform: 'meta' | 'google' | 'both') {
  const allMetrics = useMemo<MetricConfig[]>(() => {
    if (platform === 'meta') return META_METRICS
    if (platform === 'google') return GOOGLE_METRICS
    return COMBINED_METRICS
  }, [platform])

  const [visibleMetricIds, setVisibleMetricIds] = useState<string[]>(() => {
    return getVisibleMetricIds(pageKey, platform)
  })

  const toggleMetric = useCallback((metricId: string) => {
    setVisibleMetricIds(prev => {
      let next: string[]
      if (prev.includes(metricId)) {
        // Prevent clearing all columns
        if (prev.length <= 1) return prev
        next = prev.filter(id => id !== metricId)
      } else {
        next = [...prev, metricId]
      }
      saveVisibleMetricIds(pageKey, next)
      return next
    })
  }, [pageKey])

  const setMetrics = useCallback((metricIds: string[]) => {
    if (metricIds.length === 0) return
    setVisibleMetricIds(metricIds)
    saveVisibleMetricIds(pageKey, metricIds)
  }, [pageKey])

  return {
    allMetrics,
    visibleMetricIds,
    toggleMetric,
    setMetrics
  }
}
