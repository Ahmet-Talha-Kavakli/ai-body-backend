'use client'

import { useEffect, useRef } from 'react'
import type { TranscriptEntry } from '../hooks/useFitnessCoachSession'

interface TranscriptScrollerProps {
  entries: TranscriptEntry[]
}

export function TranscriptScroller({ entries }: TranscriptScrollerProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries.length])

  if (entries.length === 0) {
    return (
      <div className="text-muted-foreground px-4 py-2 text-center text-xs">
        Konuşmak için başlat&apos;a bas...
      </div>
    )
  }

  return (
    <div className="max-h-24 flex-1 space-y-1 overflow-y-auto px-4 py-2">
      {entries.map((entry, i) => (
        <div
          key={i}
          className={`text-xs ${entry.speaker === 'assistant' ? 'text-emerald-400' : 'text-blue-300'}`}
        >
          <span className="mr-1 font-semibold">
            {entry.speaker === 'assistant' ? 'Koç:' : 'Sen:'}
          </span>
          {entry.text}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
