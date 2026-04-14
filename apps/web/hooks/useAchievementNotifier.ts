'use client'

import { useState, useCallback } from 'react'
import type { AchievementDef } from '@/lib/achievements/definitions'

interface QueueItem {
  achievement: AchievementDef
  newLevel?: number
  leveledUp?: boolean
}

export function useAchievementNotifier() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [current, setCurrent] = useState<QueueItem | null>(null)

  const notify = useCallback(
    (items: QueueItem[]) => {
      if (items.length === 0) return
      if (!current) {
        setCurrent(items[0])
        setQueue(items.slice(1))
      } else {
        setQueue((prev) => [...prev, ...items])
      }
    },
    [current]
  )

  const dismiss = useCallback(() => {
    setCurrent(null)
    setQueue((prev) => {
      if (prev.length === 0) return prev
      const [next, ...rest] = prev
      setTimeout(() => setCurrent(next), 300)
      return rest
    })
  }, [])

  return { current, notify, dismiss }
}
