'use client'

import { useState, useEffect } from 'react'
import type { HistoryStats } from '@/lib/nutrition/types'

// Explicit typed return shape for tests and consumers
interface UseHistoryStatsResult {
  stats: HistoryStats | null
  loading: boolean // true while fetch is in flight
  error: string | null // error message or null
  refetch: () => void
}

export function useHistoryStats(): UseHistoryStatsResult {
  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch('/api/nutrition/history/stats')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setStats(data)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  return { stats, loading, error, refetch: () => setTick((t) => t + 1) }
}
