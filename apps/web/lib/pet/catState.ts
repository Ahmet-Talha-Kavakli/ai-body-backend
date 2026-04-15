import type { CatMood } from './catMood'

export interface PetState {
  id: string
  name: string
  level: number
  xp: number
  mood: CatMood
  coins: number
  outfit: string | null
  accessories: string[]
  hasInjury: boolean
  injuredPart: string | null
  lastSeenAt: Date
}

// XP to level mapping
export function xpToLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

// XP needed for next level
export function xpForNextLevel(level: number): number {
  return level * level * 100
}

// Calculate XP progress (0-100%)
export function xpProgress(xp: number): number {
  const level = xpToLevel(xp)
  const currentLevelXp = (level - 1) * (level - 1) * 100
  const nextLevelXp = xpForNextLevel(level)
  return Math.round(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)
}
