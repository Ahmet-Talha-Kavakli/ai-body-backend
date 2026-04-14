'use client'

import { useState, useEffect } from 'react'

interface RecentFood {
  name: string
  calories: number
}

export function useRecentFoods() {
  const [foods, setFoods] = useState<RecentFood[]>([])

  useEffect(() => {
    fetch('/api/nutrition/recent-foods')
      .then((r) => r.json())
      .then((d) => setFoods(d.recentFoods ?? []))
      .catch(() => {})
  }, [])

  return { foods }
}
