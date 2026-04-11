import { useState, useCallback } from 'react'

interface VapiCoachState {
  isConnected: boolean
  isSpeaking: boolean
  transcript: string
}

export function useVapiCoach() {
  const [state, setState] = useState<VapiCoachState>({
    isConnected: false,
    isSpeaking: false,
    transcript: '',
  })

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnected: true }))
  }, [])

  const disconnect = useCallback(() => {
    setState(prev => ({ ...prev, isConnected: false, isSpeaking: false }))
  }, [])

  return { ...state, connect, disconnect }
}
