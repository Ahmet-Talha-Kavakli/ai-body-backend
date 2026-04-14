'use client'

import { useState, useCallback, useRef } from 'react'
import { searchFoods } from '@/lib/nutrition/openfoodfacts'
import type { SearchResult } from '@/lib/nutrition/types'

export function useFoodSearch() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((q: string) => {
    setQuery(q)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!q.trim()) {
      setResults([])
      return
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      const r = await searchFoods(q)
      setResults(r)
      setLoading(false)
    }, 300)
  }, [])

  return { results, loading, query, search }
}
