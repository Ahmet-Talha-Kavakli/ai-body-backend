'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, PhoneOff } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { createVapiInstance } from '@/lib/vapi/session'
import { buildPersonaPrompt } from '@/lib/sessions/prompts'
import { PERSONAS } from '@/lib/sessions/personas'
import type { PersonaId } from '@/lib/sessions/personas'
import type Vapi from '@vapi-ai/web'

type SessionStatus = 'idle' | 'connecting' | 'active' | 'ending'

interface VoiceSessionRoomProps {
  personaId: PersonaId
}

export function VoiceSessionRoom({ personaId }: VoiceSessionRoomProps) {
  const { user } = useUser()
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const vapiRef = useRef<Vapi | null>(null)
  const persona = PERSONAS[personaId]

  const startSession = useCallback(async () => {
    setError(null)
    setStatus('connecting')
    try {
      const vapi = createVapiInstance()
      vapiRef.current = vapi

      vapi.on('call-start', () => setStatus('active'))
      vapi.on('call-end', () => setStatus('idle'))
      vapi.on('speech-start', () => setIsSpeaking(true))
      vapi.on('speech-end', () => setIsSpeaking(false))
      vapi.on('message', (msg: { type: string; role?: string; transcript?: string }) => {
        if (msg.type === 'transcript' && msg.role === 'assistant') {
          setTranscript(msg.transcript ?? '')
        }
      })

      const systemPrompt = buildPersonaPrompt(personaId, {
        name: user?.firstName ?? 'kullanıcı',
      })

      const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_FRIENDLY ?? ''

      if (!assistantId) {
        setError('Bu seans henüz yapılandırılmamış. VAPI assistant ID gerekli.')
        setStatus('idle')
        return
      }

      try {
        await vapi.start(assistantId, {
          model: {
            provider: 'openai',
            model: 'gpt-4o',
            messages: [{ role: 'system', content: systemPrompt }],
          },
        })
      } catch (err) {
        console.error('VAPI start error:', err)
        setError('Seans başlatılamadı. Lütfen tekrar deneyin.')
        setStatus('idle')
      }
    } catch (err) {
      console.error('VAPI session error:', err)
      setStatus('idle')
    }
  }, [personaId, user])

  const endSession = useCallback(() => {
    setStatus('ending')
    vapiRef.current?.stop()
    setTimeout(() => setStatus('idle'), 500)
  }, [])

  const toggleMute = useCallback(() => {
    if (vapiRef.current) {
      const next = !isMuted
      setIsMuted(next)
      vapiRef.current.setMuted(next)
    }
  }, [isMuted])

  useEffect(() => {
    return () => {
      vapiRef.current?.stop()
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-black p-6">
      {/* Persona Avatar Area */}
      <div className="flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-8">
        {/* Avatar */}
        <motion.div
          animate={isSpeaking ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
          className="relative"
        >
          {isSpeaking && (
            <>
              <motion.div
                animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${persona.gradient} blur-xl`}
              />
              <motion.div
                animate={{ scale: [1, 1.2], opacity: [0.2, 0] }}
                transition={{ duration: 1, delay: 0.2, repeat: Infinity }}
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${persona.gradient} blur-2xl`}
              />
            </>
          )}

          <div
            className={`relative h-32 w-32 rounded-full bg-gradient-to-br ${persona.gradient} flex items-center justify-center text-6xl shadow-2xl`}
          >
            {persona.emoji}
          </div>
        </motion.div>

        {/* Persona Info */}
        <div className="text-center">
          <h2 className="text-2xl font-black text-white">{persona.name}</h2>
          <p className={`text-sm font-semibold ${persona.accentColor} mt-1`}>{persona.role}</p>
        </div>

        {/* Sound wave (while AI speaks) */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1"
            >
              {[...Array(7)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [4, 20 + i * 3, 4] }}
                  transition={{ duration: 0.5, delay: i * 0.07, repeat: Infinity }}
                  className={`w-1 rounded-full bg-gradient-to-b ${persona.gradient}`}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status text */}
        <div className="text-center">
          {status === 'idle' && (
            <p className="text-sm text-white/40">Seansa başlamak için aşağıdaki butona bas</p>
          )}
          {status === 'connecting' && (
            <p className={`text-sm font-semibold ${persona.accentColor}`}>Bağlanıyor...</p>
          )}
          {status === 'active' && !isSpeaking && (
            <p className="text-sm text-white/40">Dinliyorum... 🎤</p>
          )}
          {status === 'active' && isSpeaking && (
            <p className={`text-sm font-semibold ${persona.accentColor}`}>
              {persona.name} konuşuyor...
            </p>
          )}
        </div>

        {/* Last transcript */}
        <AnimatePresence>
          {transcript && status === 'active' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <p className="text-center text-sm italic text-white/70">&ldquo;{transcript}&rdquo;</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="mb-2 text-sm font-semibold text-red-400">Seans Başlatılamadı</p>
          <p className="text-xs text-white/50">{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="w-full max-w-sm space-y-4">
        {status === 'idle' ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={startSession}
            className={`w-full rounded-2xl bg-gradient-to-r py-4 ${persona.gradient} text-lg font-bold text-white shadow-lg`}
          >
            Seansı Başlat 🎤
          </motion.button>
        ) : (
          <div className="flex items-center gap-4">
            {/* Mute toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleMute}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
                isMuted ? 'border-red-500/30 bg-red-500/20' : 'border-white/20 bg-white/10'
              }`}
            >
              {isMuted ? (
                <MicOff size={22} className="text-red-400" />
              ) : (
                <Mic size={22} className="text-white" />
              )}
            </motion.button>

            {/* End session */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={endSession}
              disabled={status === 'ending'}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/20 py-4 font-bold text-red-400 disabled:opacity-50"
            >
              <PhoneOff size={20} />
              Seansı Bitir
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}
