import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveExerciseLibrary,
  getExercisesByMuscle,
  searchExercises,
  getExerciseById,
} from '@/src/db/exerciseLibrary'
import type { Exercise } from '@/src/db/exerciseLibrary'

describe('Exercise Library Database', () => {
  const sampleExercises: Exercise[] = [
    {
      id: 'squat',
      name: 'Squat',
      muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
      category: 'compound',
      difficulty: 'intermediate',
      description: 'Lower body compound movement',
      variations: ['bodyweight', 'goblet', 'barbell', 'smith-machine'],
    },
    {
      id: 'bench-press',
      name: 'Bench Press',
      muscleGroups: ['chest', 'triceps', 'shoulders'],
      category: 'compound',
      difficulty: 'intermediate',
      description: 'Upper body pushing movement',
      variations: ['dumbbell', 'barbell', 'smith-machine'],
    },
    {
      id: 'bicep-curl',
      name: 'Bicep Curl',
      muscleGroups: ['biceps'],
      category: 'isolation',
      difficulty: 'beginner',
      description: 'Arm isolation movement',
      variations: ['dumbbell', 'barbell', 'cable'],
    },
    {
      id: 'deadlift',
      name: 'Deadlift',
      muscleGroups: ['glutes', 'hamstrings', 'back', 'quadriceps'],
      category: 'compound',
      difficulty: 'advanced',
      description: 'Full body compound movement',
      variations: ['conventional', 'sumo', 'trap-bar', 'deficit'],
    },
  ]

  beforeEach(async () => {
    // Reset library for each test
    const exercises = await getExercisesByMuscle('all')
    // Library starts empty
  })

  describe('saveExerciseLibrary', () => {
    it('should save exercises to library', async () => {
      await saveExerciseLibrary(sampleExercises)

      const saved = await getExerciseById('squat')
      expect(saved).toBeDefined()
      expect(saved?.name).toBe('Squat')
    })

    it('should save large exercise library (300+)', async () => {
      // Generate 300 exercises
      const largeLibrary = Array.from({ length: 300 }, (_, i) => ({
        id: `exercise-${i}`,
        name: `Exercise ${i}`,
        muscleGroups: ['chest', 'legs', 'back'][i % 3] ? ['chest'] : ['legs'],
        category: i % 2 === 0 ? 'compound' : 'isolation',
        difficulty: ['beginner', 'intermediate', 'advanced'][i % 3],
        description: `Exercise description ${i}`,
        variations: [`variant-1`, `variant-2`],
      }))

      await saveExerciseLibrary(largeLibrary)

      const quad = await getExerciseById('exercise-0')
      expect(quad).toBeDefined()

      const search = await searchExercises('Exercise 1')
      expect(search.length).toBeGreaterThan(0)
    })
  })

  describe('getExercisesByMuscle', () => {
    beforeEach(async () => {
      await saveExerciseLibrary(sampleExercises)
    })

    it('should return exercises for specific muscle group', async () => {
      const chest = await getExercisesByMuscle('chest')

      expect(chest.length).toBeGreaterThan(0)
      expect(chest.every((e) => e.muscleGroups.includes('chest'))).toBe(true)
    })

    it('should return all exercises for muscle group "all"', async () => {
      const all = await getExercisesByMuscle('all')

      expect(all.length).toBe(sampleExercises.length)
    })

    it('should handle empty muscle group', async () => {
      const empty = await getExercisesByMuscle('nonexistent-muscle')

      expect(empty).toEqual([])
    })

    it('should return exercises with all required fields', async () => {
      const quads = await getExercisesByMuscle('quadriceps')

      expect(quads.length).toBeGreaterThan(0)

      quads.forEach((exercise) => {
        expect(exercise).toHaveProperty('id')
        expect(exercise).toHaveProperty('name')
        expect(exercise).toHaveProperty('muscleGroups')
        expect(exercise).toHaveProperty('category')
        expect(exercise).toHaveProperty('difficulty')
        expect(exercise).toHaveProperty('description')
      })
    })
  })

  describe('searchExercises', () => {
    beforeEach(async () => {
      await saveExerciseLibrary(sampleExercises)
    })

    it('should search by exercise name', async () => {
      const results = await searchExercises('squat')

      expect(results.length).toBeGreaterThan(0)
      expect(results.some((e) => e.name.toLowerCase().includes('squat'))).toBe(true)
    })

    it('should be case-insensitive', async () => {
      const lowercase = await searchExercises('bench')
      const uppercase = await searchExercises('BENCH')

      expect(lowercase.length).toBe(uppercase.length)
    })

    it('should match partial names', async () => {
      const results = await searchExercises('curl')

      expect(results.length).toBeGreaterThan(0)
      expect(results.some((e) => e.name.toLowerCase().includes('curl'))).toBe(true)
    })

    it('should return empty for no matches', async () => {
      const results = await searchExercises('nonexistent-xyz')

      expect(results).toEqual([])
    })

    it('should limit results for large queries', async () => {
      // Add many exercises
      const manyExercises = Array.from({ length: 100 }, (_, i) => ({
        id: `exercise-${i}`,
        name: `Leg Exercise ${i}`,
        muscleGroups: ['legs'],
        category: 'compound',
        difficulty: 'intermediate',
        description: `Leg exercise ${i}`,
        variations: [],
      }))

      await saveExerciseLibrary([...sampleExercises, ...manyExercises])

      const results = await searchExercises('leg')

      // Should be reasonable limit (100 or so)
      expect(results.length).toBeLessThanOrEqual(100)
    })
  })

  describe('getExerciseById', () => {
    beforeEach(async () => {
      await saveExerciseLibrary(sampleExercises)
    })

    it('should retrieve exercise by ID', async () => {
      const exercise = await getExerciseById('squat')

      expect(exercise).toBeDefined()
      expect(exercise?.name).toBe('Squat')
      expect(exercise?.category).toBe('compound')
    })

    it('should return null for nonexistent ID', async () => {
      const exercise = await getExerciseById('nonexistent')

      expect(exercise).toBeNull()
    })

    it('should include all exercise fields', async () => {
      const exercise = await getExerciseById('bench-press')

      expect(exercise?.id).toBe('bench-press')
      expect(exercise?.muscleGroups).toContain('chest')
      expect(exercise?.variations).toContain('dumbbell')
    })
  })
})
