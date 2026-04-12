'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface TranscriptEntry {
  speaker: 'assistant' | 'user'
  text: string
  timestamp: number
}

interface UseFitnessCoachSessionOptions {
  systemPrompt: string
  onAudioLevel?: (level: number) => void
}

export type SessionStatus = 'idle' | 'connecting' | 'active' | 'ended' | 'error'

interface FitnessCoachSessionState {
  status: SessionStatus
  transcript: TranscriptEntry[]
  isSpeaking: boolean
  errorMessage: string | null
}

export function useFitnessCoachSession({
  systemPrompt,
  onAudioLevel,
}: UseFitnessCoachSessionOptions) {
  const [state, setState] = useState<FitnessCoachSessionState>({
    status: 'idle',
    transcript: [],
    isSpeaking: false,
    errorMessage: null,
  })
  const vapiRef = useRef<any>(null)

  const start = useCallback(async () => {
    setState((s) => ({ ...s, status: 'connecting', errorMessage: null }))
    try {
      const { default: Vapi } = await import('@vapi-ai/web')
      const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ?? '')
      vapiRef.current = vapi

      vapi.on('call-start', () => setState((s) => ({ ...s, status: 'active' })))
      vapi.on('call-end', () => setState((s) => ({ ...s, status: 'ended' })))
      vapi.on('error', (err: unknown) =>
        setState((s) => ({ ...s, status: 'error', errorMessage: String(err) }))
      )
      vapi.on('speech-start', () => setState((s) => ({ ...s, isSpeaking: true })))
      vapi.on('speech-end', () => setState((s) => ({ ...s, isSpeaking: false })))
      vapi.on('volume-level', (level: number) => onAudioLevel?.(level))
      vapi.on('message', (msg: any) => {
        if (msg.type === 'transcript' && msg.transcriptType === 'final') {
          setState((s) => ({
            ...s,
            transcript: [
              ...s.transcript,
              {
                speaker: msg.role as 'assistant' | 'user',
                text: msg.transcript,
                timestamp: Date.now(),
              },
            ],
          }))
        }
      })

      await vapi.start({
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: systemPrompt }],
        },
        voice: { provider: 'playht', voiceId: 'tr-TR-EmelNeural' },
        transcriber: { provider: 'deepgram', language: 'tr' },
      })
    } catch {
      setState((s) => ({
        ...s,
        status: 'error',
        errorMessage: 'Bağlantı hatası. Lütfen tekrar deneyin.',
      }))
    }
  }, [systemPrompt, onAudioLevel])

  const stop = useCallback(async () => {
    if (vapiRef.current) {
      await vapiRef.current.stop()
      vapiRef.current = null
    }
    setState((s) => ({ ...s, status: 'ended' }))
  }, [])

  const sendMessage = useCallback((message: string) => {
    vapiRef.current?.send({
      type: 'add-message',
      message: { role: 'user', content: message },
    })
  }, [])

  useEffect(() => {
    return () => {
      vapiRef.current?.stop()
    }
  }, [])

  return { ...state, start, stop, sendMessage }
}
