'use client'

import { PTCharacter3D } from '../character/PTCharacter3D'
import { useCharacterMorph } from '../character/useCharacterMorph'

interface CharacterPanelProps {
  exerciseSlug: string
  isActive: boolean
  isResting: boolean
  aiMessage: string
  poseActive: boolean
}

export function CharacterPanel({
  exerciseSlug,
  isActive,
  isResting,
  aiMessage,
  poseActive,
}: CharacterPanelProps) {
  const { params, isLoading } = useCharacterMorph()
  const slug = isResting ? 'rest' : isActive ? exerciseSlug : 'idle'

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-emerald-500/20 bg-gray-950">
      {/* Badge */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-lg bg-emerald-600/90 px-2.5 py-1">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        <span className="text-xs font-semibold text-white">AI Koç</span>
      </div>

      {/* Pose indicator */}
      {poseActive && (
        <div className="absolute right-3 top-3 z-10 rounded-lg bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400">
          Pose Aktif
        </div>
      )}

      {/* 3D character — only show when loaded */}
      {!isLoading && (
        <PTCharacter3D
          morphParams={params}
          exerciseSlug={slug}
          isActive={isActive && !isResting}
          className="h-full w-full"
        />
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      )}

      {/* AI message bubble */}
      {aiMessage && (
        <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-emerald-700/90 px-3 py-2.5 backdrop-blur-sm">
          <p className="text-xs leading-relaxed text-white">{aiMessage}</p>
        </div>
      )}
    </div>
  )
}
