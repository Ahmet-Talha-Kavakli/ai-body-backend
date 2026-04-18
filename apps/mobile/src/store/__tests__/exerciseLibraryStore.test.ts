import { describe, it, expect, beforeEach } from 'vitest'
import { useExerciseLibraryStore } from '../exerciseLibraryStore'
import { Exercise, ExerciseLibrary } from '../../types/exercise'

describe('exerciseLibraryStore', () => {
  beforeEach(() => {
    useExerciseLibraryStore.getState().clear()
  })

  const createMockExercise = (overrides?: Partial<Exercise>): Exercise => ({
    id: 'ex-1',
    name: 'Bench Press',
    category: 'chest',
    difficulty: 'intermediate',
    primaryMuscles: ['chest', 'triceps'],
    secondaryMuscles: ['shoulders'],
    formRules: [],
    poseConfig: {
      requiredKeypoints: [],
      bodyPositions: [],
      referenceAngles: {},
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  })

  describe('setLibrary', () => {
    it('should load exercise library', () => {
      const exercises = [
        createMockExercise({ id: 'ex-1' }),
        createMockExercise({ id: 'ex-2', name: 'Squat' }),
      ]
      const library: ExerciseLibrary = {
        exercises,
        lastUpdated: Date.now(),
        version: '1.0',
      }

      useExerciseLibraryStore.getState().setLibrary(library)
      const state = useExerciseLibraryStore.getState()

      expect(state.library).toEqual(library)
      expect(state.exercises.size).toBe(2)
    })
  })

  describe('getExercise', () => {
    it('should retrieve a cached exercise', () => {
      const exercise = createMockExercise()
      const library: ExerciseLibrary = {
        exercises: [exercise],
        lastUpdated: Date.now(),
        version: '1.0',
      }

      useExerciseLibraryStore.getState().setLibrary(library)
      const retrieved = useExerciseLibraryStore.getState().getExercise('ex-1')

      expect(retrieved).toEqual(exercise)
    })

    it('should return undefined for non-existent exercise', () => {
      const retrieved = useExerciseLibraryStore.getState().getExercise('non-existent')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('getExercisesByCategory', () => {
    it('should filter exercises by category', () => {
      const exercises = [
        createMockExercise({ id: 'ex-1', category: 'chest' }),
        createMockExercise({ id: 'ex-2', category: 'legs' }),
        createMockExercise({ id: 'ex-3', category: 'chest' }),
      ]
      const library: ExerciseLibrary = {
        exercises,
        lastUpdated: Date.now(),
        version: '1.0',
      }

      useExerciseLibraryStore.getState().setLibrary(library)
      const chest = useExerciseLibraryStore.getState().getExercisesByCategory('chest')

      expect(chest).toHaveLength(2)
      expect(chest.every((ex) => ex.category === 'chest')).toBe(true)
    })
  })

  describe('getExercisesByMuscle', () => {
    it('should filter by primary muscle', () => {
      const exercises = [
        createMockExercise({
          id: 'ex-1',
          primaryMuscles: ['chest'],
        }),
        createMockExercise({
          id: 'ex-2',
          primaryMuscles: ['legs'],
        }),
      ]
      const library: ExerciseLibrary = {
        exercises,
        lastUpdated: Date.now(),
        version: '1.0',
      }

      useExerciseLibraryStore.getState().setLibrary(library)
      const chest = useExerciseLibraryStore.getState().getExercisesByMuscle('chest')

      expect(chest).toHaveLength(1)
      expect(chest[0].id).toBe('ex-1')
    })

    it('should filter by secondary muscle', () => {
      const exercises = [
        createMockExercise({
          id: 'ex-1',
          primaryMuscles: ['chest'],
          secondaryMuscles: ['triceps'],
        }),
      ]
      const library: ExerciseLibrary = {
        exercises,
        lastUpdated: Date.now(),
        version: '1.0',
      }

      useExerciseLibraryStore.getState().setLibrary(library)
      const triceps = useExerciseLibraryStore.getState().getExercisesByMuscle('triceps')

      expect(triceps).toHaveLength(1)
    })
  })

  describe('searchExercises', () => {
    it('should search by name', () => {
      const exercises = [
        createMockExercise({ id: 'ex-1', name: 'Bench Press' }),
        createMockExercise({ id: 'ex-2', name: 'Dumbbell Press' }),
        createMockExercise({ id: 'ex-3', name: 'Squat' }),
      ]
      const library: ExerciseLibrary = {
        exercises,
        lastUpdated: Date.now(),
        version: '1.0',
      }

      useExerciseLibraryStore.getState().setLibrary(library)
      const results = useExerciseLibraryStore.getState().searchExercises('press')

      expect(results).toHaveLength(2)
    })

    it('should search by muscle', () => {
      const exercises = [
        createMockExercise({
          id: 'ex-1',
          name: 'Bench Press',
          primaryMuscles: ['chest'],
          secondaryMuscles: ['triceps'],
        }),
        createMockExercise({
          id: 'ex-2',
          name: 'Squat',
          primaryMuscles: ['legs'],
          secondaryMuscles: [],
        }),
      ]
      const library: ExerciseLibrary = {
        exercises,
        lastUpdated: Date.now(),
        version: '1.0',
      }

      useExerciseLibraryStore.getState().setLibrary(library)
      const results = useExerciseLibraryStore.getState().searchExercises('legs')

      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('ex-2')
    })
  })

  describe('cacheExercise', () => {
    it('should add exercise to cache', () => {
      const exercise = createMockExercise()

      useExerciseLibraryStore.getState().cacheExercise(exercise)

      expect(useExerciseLibraryStore.getState().getExercise('ex-1')).toEqual(exercise)
    })
  })

  describe('getCacheSize', () => {
    it('should return correct cache size', () => {
      const exercises = [
        createMockExercise({ id: 'ex-1' }),
        createMockExercise({ id: 'ex-2' }),
        createMockExercise({ id: 'ex-3' }),
      ]
      const library: ExerciseLibrary = {
        exercises,
        lastUpdated: Date.now(),
        version: '1.0',
      }

      useExerciseLibraryStore.getState().setLibrary(library)

      expect(useExerciseLibraryStore.getState().getCacheSize()).toBe(3)
    })
  })

  describe('isCached', () => {
    it('should check if exercise is cached', () => {
      const exercise = createMockExercise()

      useExerciseLibraryStore.getState().cacheExercise(exercise)

      expect(useExerciseLibraryStore.getState().isCached('ex-1')).toBe(true)
      expect(useExerciseLibraryStore.getState().isCached('non-existent')).toBe(false)
    })
  })
})
