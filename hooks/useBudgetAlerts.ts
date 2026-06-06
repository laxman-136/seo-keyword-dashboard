// hooks/useBudgetAlerts.ts
'use client';

import { useState, useEffect } from 'react'
import { AdsBudgetAlert } from '@/lib/types'

// Global count cache to let sidebar query immediately
let globalAlertCount = 0
let globalAlerts: AdsBudgetAlert[] = []

export function useBudgetAlerts() {
  const [alerts, setAlerts] = useState<AdsBudgetAlert[]>(globalAlerts)
  const [count, setCount] = useState(globalAlertCount)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const checkAlerts = async () => {
      try {
        const res = await fetch('/api/ads/overview')
        if (res.ok) {
          const payload = await res.json()
          const alertsList = payload.budgetAlerts || []
          if (active) {
            globalAlerts = alertsList
            globalAlertCount = alertsList.length
            setAlerts(alertsList)
            setCount(alertsList.length)
          }
        }
      } catch (err) {
        console.error('Failed to load budget alerts for sidebar:', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    checkAlerts()
    return () => { active = false }
  }, [])

  return { alerts, count, loading }
}
