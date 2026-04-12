'use client'

import { useState, useCallback, useRef } from 'react'

export type AnimationState = 'idle' | 'listening' | 'talking' | 'thinking'

export function useSpeechAnimation() {
  const [animState, setAnimState] = useState<AnimationState>('idle')
  const [audioLevel, setAudioLevel] = useState(0)
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onSpeechStart = useCallback(() => {
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
    setAnimState('talking')
  }, [])

  const onSpeechEnd = useCallback(() => {
    idleTimeoutRef.current = setTimeout(() => setAnimState('idle'), 800)
    setAnimState('listening')
  }, [])

  const onAudioLevel = useCallback((level: number) => {
    setAudioLevel(level)
  }, [])

  return { animState, audioLevel, onSpeechStart, onSpeechEnd, onAudioLevel }
}
