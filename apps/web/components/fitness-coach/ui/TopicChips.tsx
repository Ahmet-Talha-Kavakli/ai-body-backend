'use client'

import type { TopicChip } from '@/lib/vapi/topic-suggestions'

interface TopicChipsProps {
  chips: TopicChip[]
  onSelect: (prompt: string) => void
  disabled?: boolean
}

export function TopicChips({ chips, onSelect, disabled }: TopicChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {chips.map((chip) => (
        <button
          key={chip.label}
          onClick={() => onSelect(chip.prompt)}
          disabled={disabled}
          className="bg-card/60 border-border/50 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}
