import { describe, it, expect } from 'vitest'
import { buildSessionMemoryText } from '../session-summarizer'
import type { SessionMemoryInput } from '../types'

const mockInput: SessionMemoryInput = {
  userId: 'user_123',
  sessionId: 'session_abc',
  exercises: [
    {
      name: 'Barbell Squat',
      sets: [
        { setNumber: 1, reps: 5, weightKg: 100, formScore: 85 },
        { setNumber: 2, reps: 5, weightKg: 100, formScore: 88 },
        { setNumber: 3, reps: 4, weightKg: 100, formScore: 72 },
      ],
      avgFormScore: 81.7,
    },
    {
      name: 'Romanian Deadlift',
      sets: [
        { setNumber: 1, reps: 8, weightKg: 80, formScore: 90 },
        { setNumber: 2, reps: 8, weightKg: 80, formScore: 92 },
      ],
      avgFormScore: 91,
    },
  ],
  durationSeconds: 3600,
  overallFormScore: 85,
  caloriesBurned: 450,
  notes: 'Sol diz biraz ağrıdı son sette',
}

describe('buildSessionMemoryText', () => {
  it('includes exercise names', () => {
    const { text } = buildSessionMemoryText(mockInput)
    expect(text).toContain('Barbell Squat')
    expect(text).toContain('Romanian Deadlift')
  })

  it('includes max weight', () => {
    const { text } = buildSessionMemoryText(mockInput)
    expect(text).toContain('100')
  })

  it('includes total volume', () => {
    const { text } = buildSessionMemoryText(mockInput)
    // Barbell Squat: (5+5+4)*100=1400, RDL: (8+8)*80=1280 → toplam 2680
    expect(text).toContain('2680')
  })

  it('includes overall form score', () => {
    const { text } = buildSessionMemoryText(mockInput)
    expect(text).toContain('85')
  })

  it('includes user notes', () => {
    const { text } = buildSessionMemoryText(mockInput)
    expect(text).toContain('Sol diz')
  })

  it('extracts tags from exercise names', () => {
    const { tags } = buildSessionMemoryText(mockInput)
    expect(tags).toContain('squat')
    expect(tags).toContain('deadlift')
  })

  it('tags pain keywords from notes', () => {
    const { tags } = buildSessionMemoryText(mockInput)
    expect(tags).toContain('knee_issue')
    expect(tags).toContain('pain_reported')
  })

  it('handles null optional fields without throwing', () => {
    const minimal: SessionMemoryInput = {
      ...mockInput,
      overallFormScore: null,
      caloriesBurned: null,
      notes: null,
    }
    expect(() => buildSessionMemoryText(minimal)).not.toThrow()
  })
})
