import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkoutStore } from '../workoutStore'
import { WorkoutSession, CompletedSet } from '../../types/workout'

describe('workoutStore', () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      currentSession: null,
      completedSets: [],
      currentRepData: [],
      sessionNotes: '',
    })
  })

  describe('startSession', () => {
    it('should initialize a new session with active status', () => {
      const session: WorkoutSession = {
        id: 'session-1',
        userId: 'user-1',
        programId: 'program-1',
        dayId: 'day-1',
        startedAt: Date.now(),
        status: 'active',
        completedExercises: [],
      }

      useWorkoutStore.getState().startSession(session)
      const state = useWorkoutStore.getState()

      expect(state.currentSession).toBeDefined()
      expect(state.currentSession?.status).toBe('active')
      expect(state.completedSets).toEqual([])
      expect(state.currentRepData).toEqual([])
    })
  })

  describe('completeSet', () => {
    it('should add a completed set to the store', () => {
      const set: CompletedSet = {
        exerciseId: 'ex-1',
        setNumber: 1,
        reps: 10,
        weight: 100,
        formScore: 85,
      }

      useWorkoutStore.getState().completeSet(set)
      const state = useWorkoutStore.getState()

      expect(state.completedSets).toHaveLength(1)
      expect(state.completedSets[0]).toEqual(set)
    })

    it('should accumulate multiple sets', () => {
      const set1: CompletedSet = {
        exerciseId: 'ex-1',
        setNumber: 1,
        reps: 10,
      }
      const set2: CompletedSet = {
        exerciseId: 'ex-1',
        setNumber: 2,
        reps: 8,
      }

      useWorkoutStore.getState().completeSet(set1)
      useWorkoutStore.getState().completeSet(set2)
      const state = useWorkoutStore.getState()

      expect(state.completedSets).toHaveLength(2)
    })
  })

  describe('session status transitions', () => {
    it('should pause an active session', () => {
      const session: WorkoutSession = {
        id: 'session-1',
        userId: 'user-1',
        programId: 'program-1',
        dayId: 'day-1',
        startedAt: Date.now(),
        status: 'active',
        completedExercises: [],
      }

      useWorkoutStore.getState().startSession(session)
      useWorkoutStore.getState().pauseSession()

      expect(useWorkoutStore.getState().currentSession?.status).toBe('paused')
    })

    it('should resume a paused session', () => {
      const session: WorkoutSession = {
        id: 'session-1',
        userId: 'user-1',
        programId: 'program-1',
        dayId: 'day-1',
        startedAt: Date.now(),
        status: 'active',
        completedExercises: [],
      }

      useWorkoutStore.getState().startSession(session)
      useWorkoutStore.getState().pauseSession()
      useWorkoutStore.getState().resumeSession()

      expect(useWorkoutStore.getState().currentSession?.status).toBe('active')
    })

    it('should abandon a session and set endedAt', () => {
      const session: WorkoutSession = {
        id: 'session-1',
        userId: 'user-1',
        programId: 'program-1',
        dayId: 'day-1',
        startedAt: Date.now(),
        status: 'active',
        completedExercises: [],
      }

      useWorkoutStore.getState().startSession(session)
      useWorkoutStore.getState().abandonSession()

      const state = useWorkoutStore.getState()
      expect(state.currentSession?.status).toBe('abandoned')
      expect(state.currentSession?.endedAt).toBeDefined()
    })
  })

  describe('getCompletedSetCount', () => {
    it('should return correct set count', () => {
      const set1: CompletedSet = {
        exerciseId: 'ex-1',
        setNumber: 1,
        reps: 10,
      }
      const set2: CompletedSet = {
        exerciseId: 'ex-1',
        setNumber: 2,
        reps: 8,
      }

      useWorkoutStore.getState().completeSet(set1)
      useWorkoutStore.getState().completeSet(set2)

      expect(useWorkoutStore.getState().getCompletedSetCount()).toBe(2)
    })
  })

  describe('getCompletedSetsForExercise', () => {
    it('should return sets for specific exercise', () => {
      const set1: CompletedSet = {
        exerciseId: 'ex-1',
        setNumber: 1,
        reps: 10,
      }
      const set2: CompletedSet = {
        exerciseId: 'ex-2',
        setNumber: 1,
        reps: 12,
      }
      const set3: CompletedSet = {
        exerciseId: 'ex-1',
        setNumber: 2,
        reps: 8,
      }

      useWorkoutStore.getState().completeSet(set1)
      useWorkoutStore.getState().completeSet(set2)
      useWorkoutStore.getState().completeSet(set3)

      const ex1Sets = useWorkoutStore.getState().getCompletedSetsForExercise('ex-1')
      expect(ex1Sets).toHaveLength(2)
      expect(ex1Sets[0].exerciseId).toBe('ex-1')
      expect(ex1Sets[1].exerciseId).toBe('ex-1')
    })
  })

  describe('updateSetFormScore', () => {
    it('should update form score for a set', () => {
      const set: CompletedSet = {
        exerciseId: 'ex-1',
        setNumber: 1,
        reps: 10,
        formScore: 0,
      }

      useWorkoutStore.getState().completeSet(set)
      useWorkoutStore.getState().updateSetFormScore(0, 92)

      const updated = useWorkoutStore.getState().completedSets[0]
      expect(updated.formScore).toBe(92)
    })
  })

  describe('reset', () => {
    it('should clear all state', () => {
      const session: WorkoutSession = {
        id: 'session-1',
        userId: 'user-1',
        programId: 'program-1',
        dayId: 'day-1',
        startedAt: Date.now(),
        status: 'active',
        completedExercises: [],
      }

      useWorkoutStore.getState().startSession(session)
      useWorkoutStore.getState().completeSet({
        exerciseId: 'ex-1',
        setNumber: 1,
        reps: 10,
      })
      useWorkoutStore.getState().reset()

      const state = useWorkoutStore.getState()
      expect(state.currentSession).toBeNull()
      expect(state.completedSets).toEqual([])
    })
  })
})
