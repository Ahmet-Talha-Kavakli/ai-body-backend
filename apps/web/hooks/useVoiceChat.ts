'use client'

import { useCallback, useRef, useState } from 'react'

export type VoiceChatState = 'idle' | 'recording' | 'transcribing' | 'thinking' | 'speaking'

interface UseVoiceChatOptions {
  onTranscript?: (text: string) => void
  onAIResponse?: (text: string) => void
  onError?: (error: string) => void
  getAIResponse?: (userMessage: string) => Promise<string>
}

export function useVoiceChat({
  onTranscript,
  onAIResponse,
  onError,
  getAIResponse,
}: UseVoiceChatOptions = {}) {
  const [state, setState] = useState<VoiceChatState>('idle')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const startRecording = useCallback(async () => {
    if (state !== 'idle') return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.start()
      setState('recording')
    } catch {
      onError?.('Mikrofon erişimi reddedildi')
    }
  }, [state, onError])

  const stopRecording = useCallback(async () => {
    const mediaRecorder = mediaRecorderRef.current
    if (!mediaRecorder || state !== 'recording') return

    return new Promise<void>((resolve) => {
      mediaRecorder.onstop = async () => {
        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach(t => t.stop())

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        chunksRef.current = []

        if (audioBlob.size < 1000) {
          setState('idle')
          resolve()
          return
        }

        // Transcribe
        setState('transcribing')
        try {
          const formData = new FormData()
          formData.append('audio', audioBlob, 'audio.webm')

          const transcribeRes = await fetch('/api/voice/transcribe', {
            method: 'POST',
            body: formData,
          })

          if (!transcribeRes.ok) throw new Error('Transcription failed')

          const { transcript } = await transcribeRes.json()
          if (!transcript?.trim()) {
            setState('idle')
            resolve()
            return
          }

          onTranscript?.(transcript)

          // Get AI response
          setState('thinking')
          let aiText = ''

          if (getAIResponse) {
            aiText = await getAIResponse(transcript)
          } else {
            const coachRes = await fetch('/api/ai/coach-message', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userMessage: transcript, exercise: 'general', repCount: 0, targetReps: 0, setNumber: 1, totalSets: 1 }),
            })
            const data = await coachRes.json()
            aiText = data.message || 'Anlayamadım, tekrar söyler misin?'
          }

          onAIResponse?.(aiText)

          // Speak response
          setState('speaking')
          const speakRes = await fetch('/api/voice/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: aiText }),
          })

          if (speakRes.ok) {
            const audioBuffer = await speakRes.arrayBuffer()
            const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
            const url = URL.createObjectURL(blob)

            const audio = new Audio(url)
            audioRef.current = audio
            audio.onended = () => {
              URL.revokeObjectURL(url)
              setState('idle')
              resolve()
            }
            audio.onerror = () => {
              URL.revokeObjectURL(url)
              setState('idle')
              resolve()
            }
            await audio.play()
          } else {
            setState('idle')
            resolve()
          }
        } catch (err) {
          console.error('[useVoiceChat]', err)
          onError?.('Sesli sohbet sırasında hata oluştu')
          setState('idle')
          resolve()
        }
      }

      mediaRecorder.stop()
    })
  }, [state, onTranscript, onAIResponse, onError, getAIResponse])

  const stopSpeaking = useCallback(() => {
    audioRef.current?.pause()
    audioRef.current = null
    setState('idle')
  }, [])

  // TTS only (for AI coach messages)
  const speak = useCallback(async (text: string) => {
    if (!text) return
    try {
      setState('speaking')
      const res = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        setState('idle')
        return
      }

      const buffer = await res.arrayBuffer()
      const blob = new Blob([buffer], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)

      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        URL.revokeObjectURL(url)
        setState('idle')
      }
      audio.onerror = () => {
        URL.revokeObjectURL(url)
        setState('idle')
      }
      await audio.play()
    } catch {
      setState('idle')
    }
  }, [])

  const stop = useCallback(() => {
    stopSpeaking()
  }, [stopSpeaking])

  return {
    state,
    isRecording: state === 'recording',
    startRecording,
    stopRecording,
    speak,
    stop,
  }
}
