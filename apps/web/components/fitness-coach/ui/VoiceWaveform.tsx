'use client'

interface VoiceWaveformProps {
  audioLevel: number // 0–1
  isActive: boolean
  color?: string
}

export function VoiceWaveform({ audioLevel, isActive, color = '#10b981' }: VoiceWaveformProps) {
  const bars = 12
  return (
    <div className="flex h-8 items-center justify-center gap-0.5">
      {Array.from({ length: bars }, (_, i) => {
        const center = bars / 2
        const distFromCenter = Math.abs(i - center) / center
        const baseHeight = isActive ? 0.3 + audioLevel * 0.7 * (1 - distFromCenter * 0.5) : 0.15
        const height = Math.max(4, baseHeight * 32)
        return (
          <div
            key={i}
            style={{
              width: 3,
              height,
              backgroundColor: color,
              borderRadius: 2,
              opacity: isActive ? 0.9 : 0.3,
              transition: 'height 80ms ease, opacity 200ms ease',
            }}
          />
        )
      })}
    </div>
  )
}
