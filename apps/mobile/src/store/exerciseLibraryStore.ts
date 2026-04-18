import { create } from 'zustand'
import { Exercise, ExerciseLibrary } from '../types/exercise'

interface ExerciseLibraryState {
  exercises: Map<string, Exercise>
  library: ExerciseLibrary | null
  lastUpdated: number | null
  isLoading: boolean
  error: string | null
}

interface ExerciseLibraryStore extends ExerciseLibraryState {
  // Loading
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void

  // Library management
  setLibrary: (library: ExerciseLibrary) => void
  updateLibrary: (library: ExerciseLibrary) => void

  // Exercise access
  getExercise: (exerciseId: string) => Exercise | undefined
  getExercisesByCategory: (category: string) => Exercise[]
  getExercisesByMuscle: (muscle: string) => Exercise[]
  getExercisesByDifficulty: (difficulty: string) => Exercise[]
  getAllExercises: () => Exercise[]

  // Exercise caching
  cacheExercise: (exercise: Exercise) => void
  cacheExercises: (exercises: Exercise[]) => void
  isCached: (exerciseId: string) => boolean
  getCacheSize: () => number

  // Form rules
  getFormRules: (exerciseId: string) => any[]
  getPoseConfig: (exerciseId: string) => any | undefined

  // Search
  searchExercises: (query: string) => Exercise[]

  // Lifecycle
  clear: () => void
}

const initialState: ExerciseLibraryState = {
  exercises: new Map(),
  library: null,
  lastUpdated: null,
  isLoading: false,
  error: null,
}

export const useExerciseLibraryStore = create<ExerciseLibraryStore>((set, get) => ({
  ...initialState,

  setLoading: (isLoading: boolean) =>
    set({
      isLoading,
    }),

  setError: (error: string | null) =>
    set({
      error,
    }),

  setLibrary: (library: ExerciseLibrary) => {
    const exercisesMap = new Map<string, Exercise>()
    library.exercises.forEach((exercise) => {
      exercisesMap.set(exercise.id, exercise)
    })

    set({
      library,
      exercises: exercisesMap,
      lastUpdated: library.lastUpdated,
      error: null,
    })
  },

  updateLibrary: (library: ExerciseLibrary) => {
    const currentExercises = new Map(get().exercises)
    library.exercises.forEach((exercise) => {
      currentExercises.set(exercise.id, exercise)
    })

    set({
      library,
      exercises: currentExercises,
      lastUpdated: library.lastUpdated,
    })
  },

  getExercise: (exerciseId: string) => {
    return get().exercises.get(exerciseId)
  },

  getExercisesByCategory: (category: string) => {
    const exercises: Exercise[] = []
    get().exercises.forEach((exercise) => {
      if (exercise.category === category) {
        exercises.push(exercise)
      }
    })
    return exercises
  },

  getExercisesByMuscle: (muscle: string) => {
    const exercises: Exercise[] = []
    get().exercises.forEach((exercise) => {
      if (exercise.primaryMuscles.includes(muscle) || exercise.secondaryMuscles?.includes(muscle)) {
        exercises.push(exercise)
      }
    })
    return exercises
  },

  getExercisesByDifficulty: (difficulty: string) => {
    const exercises: Exercise[] = []
    get().exercises.forEach((exercise) => {
      if (exercise.difficulty === difficulty) {
        exercises.push(exercise)
      }
    })
    return exercises
  },

  getAllExercises: () => {
    return Array.from(get().exercises.values())
  },

  cacheExercise: (exercise: Exercise) =>
    set((state) => {
      const updated = new Map(state.exercises)
      updated.set(exercise.id, exercise)
      return {
        exercises: updated,
      }
    }),

  cacheExercises: (exercises: Exercise[]) =>
    set((state) => {
      const updated = new Map(state.exercises)
      exercises.forEach((exercise) => {
        updated.set(exercise.id, exercise)
      })
      return {
        exercises: updated,
      }
    }),

  isCached: (exerciseId: string) => {
    return get().exercises.has(exerciseId)
  },

  getCacheSize: () => {
    return get().exercises.size
  },

  getFormRules: (exerciseId: string) => {
    const exercise = get().getExercise(exerciseId)
    return exercise?.formRules || []
  },

  getPoseConfig: (exerciseId: string) => {
    const exercise = get().getExercise(exerciseId)
    return exercise?.poseConfig
  },

  searchExercises: (query: string) => {
    const lowerQuery = query.toLowerCase()
    const results: Exercise[] = []

    get().exercises.forEach((exercise) => {
      if (
        exercise.name.toLowerCase().includes(lowerQuery) ||
        exercise.description?.toLowerCase().includes(lowerQuery) ||
        exercise.primaryMuscles.some((muscle) => muscle.toLowerCase().includes(lowerQuery)) ||
        exercise.category.toLowerCase().includes(lowerQuery)
      ) {
        results.push(exercise)
      }
    })

    return results
  },

  clear: () =>
    set({
      exercises: new Map(),
      library: null,
      lastUpdated: null,
      isLoading: false,
      error: null,
    }),
}))
