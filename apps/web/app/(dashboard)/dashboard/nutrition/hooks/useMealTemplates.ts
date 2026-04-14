'use client'

import { useState, useEffect } from 'react'

export interface MealTemplate {
  id: string
  name: string
  mealType: string
  totalCalories: number
  totalProteinG: number
  totalCarbsG: number
  totalFatG: number
  items: Array<{ name: string; calories: number }>
  createdAt: string
}

interface UseMealTemplatesResult {
  templates: MealTemplate[]
  loading: boolean
  error: string | null
  createTemplate: (data: Omit<MealTemplate, 'id' | 'createdAt'>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  refetch: () => void
}

export function useMealTemplates(): UseMealTemplatesResult {
  const [templates, setTemplates] = useState<MealTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/nutrition/templates')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setTemplates(data.templates ?? [])
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

  const createTemplate = async (data: Omit<MealTemplate, 'id' | 'createdAt'>) => {
    const res = await fetch('/api/nutrition/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    setTemplates((prev) => [json.template, ...prev])
  }

  const deleteTemplate = async (id: string) => {
    const prev = templates
    setTemplates((t) => t.filter((x) => x.id !== id))
    try {
      await fetch(`/api/nutrition/templates/${id}`, { method: 'DELETE' })
    } catch {
      setTemplates(prev)
    }
  }

  return {
    templates,
    loading,
    error,
    createTemplate,
    deleteTemplate,
    refetch: () => setTick((t) => t + 1),
  }
}
