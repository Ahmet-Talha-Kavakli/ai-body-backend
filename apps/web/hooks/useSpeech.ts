'use client'

import { useCallback, useRef } from 'react'

export function useSpeech() {
  const synthRef = useRef<SpeechSynthesis | null>(null)

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return
    if (!window.speechSynthesis) return

    synthRef.current = window.speechSynthesis
    synthRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'tr-TR'
    utterance.rate = 1.05
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Türkçe ses varsa seç
    const voices = synthRef.current.getVoices()
    const trVoice = voices.find(v => v.lang.startsWith('tr'))
    if (trVoice) utterance.voice = trVoice

    synthRef.current.speak(utterance)
  }, [])

  const stop = useCallback(() => {
    if (typeof window === 'undefined') return
    window.speechSynthesis?.cancel()
  }, [])

  return { speak, stop }
}
