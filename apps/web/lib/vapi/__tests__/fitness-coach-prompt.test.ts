import { describe, it, expect } from 'vitest'
import { buildFitnessCoachPrompt } from '../fitness-coach-prompt'

describe('buildFitnessCoachPrompt', () => {
  const profile = {
    name: 'Ahmet',
    weightKg: 80,
    heightCm: 178,
    goals: ['weight_loss', 'muscle_gain'],
    fitnessLevel: 'intermediate' as const,
    injuries: [],
    weeklyWorkouts: 3,
    supplements: ['whey', 'creatine'],
  }

  it('includes user name', () => {
    expect(buildFitnessCoachPrompt(profile)).toContain('Ahmet')
  })

  it('includes weight and height', () => {
    const prompt = buildFitnessCoachPrompt(profile)
    expect(prompt).toContain('80')
    expect(prompt).toContain('178')
  })

  it('includes goals', () => {
    expect(buildFitnessCoachPrompt(profile)).toContain('weight_loss')
  })

  it('includes supplements', () => {
    expect(buildFitnessCoachPrompt(profile)).toContain('whey')
  })

  it('says no injuries when list is empty', () => {
    expect(buildFitnessCoachPrompt(profile)).toContain('yok')
  })

  it('includes injury when present', () => {
    const p = { ...profile, injuries: ['diz ağrısı'] }
    expect(buildFitnessCoachPrompt(p)).toContain('diz ağrısı')
  })

  it('says no supplements when list is empty', () => {
    const p = { ...profile, supplements: [] }
    expect(buildFitnessCoachPrompt(p)).toContain('belirtilmemiş')
  })
})
