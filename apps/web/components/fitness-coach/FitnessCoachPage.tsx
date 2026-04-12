'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Phone, Video, VideoOff, Clock, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CoachCharacterPanel } from './panels/CoachCharacterPanel'
import { UserCameraPanel } from './panels/UserCameraPanel'
import { TopicChips } from './ui/TopicChips'
import { TranscriptScroller } from './ui/TranscriptScroller'
import { useFitnessCoachSession } from './hooks/useFitnessCoachSession'
import { useSpeechAnimation } from './hooks/useSpeechAnimation'
import { generateTopicSuggestions } from '@/lib/vapi/topic-suggestions'
import type { TopicChip } from '@/lib/vapi/topic-suggestions'

interface TopicProfile {
  goals: string[]
  activeInjuries: string[]
  supplements: string[]
}

interface FitnessCoachPageProps {
  systemPrompt: string
  profile: TopicProfile
}

export function FitnessCoachPage({ systemPrompt, profile }: FitnessCoachPageProps) {
  const router = useRouter()
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [chips] = useState<TopicChip[]>(() => generateTopicSuggestions(profile))

  const { animState, audioLevel, onAudioLevel } = useSpeechAnimation()

  const { status, transcript, isSpeaking, start, stop, sendMessage } = useFitnessCoachSession({
    systemPrompt,
    onAudioLevel,
  })

  // Session timer
  useEffect(() => {
    if (status !== 'active') return
    const t = setInterval(() => setSessionSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [status])

  const handleEnd = useCallback(async () => {
    await stop()
    if (transcript.length > 0) {
      fetch('/api/fitness-coach/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, durationSeconds: sessionSeconds }),
      }).catch(() => {})
    }
    router.push('/dashboard/session')
  }, [stop, transcript, sessionSeconds, router])

  const fmt = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="bg-background -mx-4 -mt-8 flex h-[calc(100vh-4rem)] flex-col gap-0 overflow-hidden sm:-mx-6 lg:-mx-8">
      {/* Header */}
      <div className="border-border/30 flex shrink-0 items-center justify-between border-b px-4 py-2">
        <h1 className="text-base font-black">Fitness Koçu</h1>
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Clock size={12} />
            <span className="font-mono">{fmt(sessionSeconds)}</span>
          </div>
          <button
            onClick={() => setIsVideoOn((v) => !v)}
            aria-label={isVideoOn ? 'Kamerayı kapat' : 'Kamerayı aç'}
            className={`rounded-lg border p-2 transition-colors ${isVideoOn ? 'border-border/30 hover:bg-card' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}
          >
            {isVideoOn ? <Video size={14} /> : <VideoOff size={14} />}
          </button>
          <button
            onClick={handleEnd}
            aria-label="Görüşmeyi bitir"
            className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-400 transition-colors hover:bg-red-500/20"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Video area */}
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 p-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="h-full"
        >
          <CoachCharacterPanel
            animState={animState}
            audioLevel={audioLevel}
            isSpeaking={isSpeaking}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="h-full"
        >
          <UserCameraPanel isVideoOn={isVideoOn} isMicOn={status === 'active'} />
        </motion.div>
      </div>

      {/* Topic chips */}
      <TopicChips chips={chips} onSelect={sendMessage} disabled={status !== 'active'} />

      {/* Transcript */}
      <TranscriptScroller entries={transcript} />

      {/* Call button */}
      <div className="flex shrink-0 flex-col items-center gap-2 py-3">
        {(status === 'idle' || status === 'error') && (
          <button
            onClick={start}
            className="flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3 font-bold text-white transition-colors hover:bg-emerald-700"
          >
            <Phone size={16} /> Görüşmeyi Başlat
          </button>
        )}
        {status === 'connecting' && (
          <div className="bg-card border-border/30 text-muted-foreground flex items-center gap-2 rounded-full border px-8 py-3 text-sm">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            Bağlanıyor...
          </div>
        )}
        {status === 'active' && (
          <button
            onClick={handleEnd}
            className="flex items-center gap-2 rounded-full bg-red-600 px-8 py-3 font-bold text-white transition-colors hover:bg-red-700"
          >
            <Phone size={16} className="rotate-[135deg]" /> Görüşmeyi Bitir
          </button>
        )}
        {status === 'error' && (
          <p className="text-center text-xs text-red-400">Bağlantı hatası. Tekrar dene.</p>
        )}
      </div>
    </div>
  )
}
