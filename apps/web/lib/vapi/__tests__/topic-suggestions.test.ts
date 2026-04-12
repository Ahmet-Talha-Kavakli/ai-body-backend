import { describe, it, expect } from 'vitest'
import { generateTopicSuggestions } from '../topic-suggestions'

describe('generateTopicSuggestions', () => {
  const baseProfile = {
    goals: [] as string[],
    activeInjuries: [] as string[],
    supplements: [] as string[],
  }

  it('always includes base chips', () => {
    const chips = generateTopicSuggestions(baseProfile)
    expect(chips.length).toBeGreaterThanOrEqual(4)
    expect(chips.some((c) => c.label.includes('beslenme') || c.label.includes('Bugün'))).toBe(true)
  })

  it('adds injury chip when injuries present', () => {
    const chips = generateTopicSuggestions({ ...baseProfile, activeInjuries: ['diz'] })
    expect(chips.some((c) => c.label.toLowerCase().includes('sakatlık'))).toBe(true)
  })

  it('no injury chip when no injuries', () => {
    const chips = generateTopicSuggestions(baseProfile)
    expect(chips.some((c) => c.label.toLowerCase().includes('sakatlık'))).toBe(false)
  })

  it('adds weight_loss chip when goal present', () => {
    const chips = generateTopicSuggestions({ ...baseProfile, goals: ['weight_loss'] })
    expect(chips.some((c) => c.label.toLowerCase().includes('kalori'))).toBe(true)
  })

  it('each chip has label and prompt', () => {
    const chips = generateTopicSuggestions(baseProfile)
    chips.forEach((c) => {
      expect(c.label).toBeTruthy()
      expect(c.prompt).toBeTruthy()
    })
  })
})
