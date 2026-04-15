'use client'

import dynamic from 'next/dynamic'
import { VoiceWaveform } from '../ui/VoiceWaveform'
import { useCharacterMorph } from '@/components/session/character/useCharacterMorph'
import type { AnimationState } from '../hooks/useSpeechAnimation'

const PTCharacter3D = dynamic(
  () =>
    import('@/components/session/character/PTCharacter3D').then((m) => ({
      default: m.PTCharacter3D,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    ),
  }
)

interface CoachCharacterPanelProps {
  animState: AnimationState
  audioLevel: number
  isSpeaking: boolean
}

export function CoachCharacterPanel({
  animState,
  audioLevel,
  isSpeaking,
}: CoachCharacterPanelProps) {
  const { params } = useCharacterMorph()

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-emerald-500/20 bg-gray-950">
      {/* Badge */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-lg bg-emerald-600/90 px-2.5 py-1">
        <div
          className={`h-1.5 w-1.5 rounded-full ${isSpeaking ? 'animate-pulse bg-white' : 'bg-white/50'}`}
        />
        <span className="text-xs font-semibold text-white">
          {animState === 'talking'
            ? 'Konuşuyor'
            : animState === 'listening'
              ? 'Dinliyor'
              : 'AI Koç'}
        </span>
      </div>

      {/* 3D Character */}
      <div className="flex-1">
        <PTCharacter3D
          morphParams={params}
          exerciseSlug="idle"
          isActive={false}
          className="h-full w-full"
        />
      </div>

      {/* Waveform */}
      <div className="pb-3">
        <VoiceWaveform audioLevel={audioLevel} isActive={isSpeaking} />
      </div>
    </div>
  )
}
