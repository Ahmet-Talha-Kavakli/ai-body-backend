import { describe, it, expect } from 'vitest'
import { ACHIEVEMENTS, getXpForLevel, getLevelFromXp } from '../definitions'

describe('Achievement definitions', () => {
  it('has at least 15 achievements', () => {
    expect(Object.keys(ACHIEVEMENTS).length).toBeGreaterThanOrEqual(15)
  })

  it('each achievement has required fields', () => {
    for (const [id, a] of Object.entries(ACHIEVEMENTS)) {
      expect(a.id, `${id} missing id`).toBe(id)
      expect(a.title, `${id} missing title`).toBeTruthy()
      expect(a.xp, `${id} missing xp`).toBeGreaterThan(0)
      expect(a.tier, `${id} missing tier`).toMatch(/^(bronze|silver|gold|platinum)$/)
    }
  })

  it('getXpForLevel returns increasing values', () => {
    expect(getXpForLevel(2)).toBeGreaterThan(getXpForLevel(1))
    expect(getXpForLevel(10)).toBeGreaterThan(getXpForLevel(5))
  })

  it('getLevelFromXp returns correct level', () => {
    expect(getLevelFromXp(0)).toBe(1)
    expect(getLevelFromXp(getXpForLevel(1))).toBe(2)
    expect(getLevelFromXp(getXpForLevel(4))).toBe(5)
  })
})
