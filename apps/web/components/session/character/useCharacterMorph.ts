'use client'

import { useState, useEffect } from 'react'
import type { CharacterMorphParams } from '@fitai/shared-types'

const DEFAULT_PARAMS: CharacterMorphParams = {
  bmi: 22,
  muscleLevel: 0,
  heightNorm: 1.0,
  gender: 'other',
  fitnessLevel: 'beginner',
  updatedAt: '',
}

export function useCharacterMorph() {
  const [params, setParams] = useState<CharacterMorphParams>(DEFAULT_PARAMS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/character/morph')
      .then((r) => r.json())
      .then((data: CharacterMorphParams) => setParams(data))
      .catch(() => {}) // keep defaults on error
      .finally(() => setIsLoading(false))
  }, [])

  return { params, isLoading }
}
