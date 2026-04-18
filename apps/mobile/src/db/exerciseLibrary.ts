/**
 * Exercise library database with 300+ exercises
 * Supports searching, filtering by muscle group, and managing variations
 */

export interface Exercise {
  id: string
  name: string
  muscleGroups: string[]
  category: 'compound' | 'isolation' | 'cardio' | 'stretching'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  description: string
  variations?: string[]
}

// In-memory exercise library (in production, would use SQLite)
let exerciseLibrary: Map<string, Exercise> = new Map()

/**
 * Save exercises to the library
 */
export async function saveExerciseLibrary(exercises: Exercise[]): Promise<void> {
  exerciseLibrary.clear()

  for (const exercise of exercises) {
    exerciseLibrary.set(exercise.id, exercise)
  }

  console.log(`Loaded ${exercises.length} exercises into library`)
}

/**
 * Get exercises by muscle group
 */
export async function getExercisesByMuscle(muscleGroup: string): Promise<Exercise[]> {
  if (muscleGroup === 'all') {
    return Array.from(exerciseLibrary.values())
  }

  return Array.from(exerciseLibrary.values()).filter((exercise) =>
    exercise.muscleGroups.some((m) => m.toLowerCase() === muscleGroup.toLowerCase())
  )
}

/**
 * Search exercises by name
 */
export async function searchExercises(query: string): Promise<Exercise[]> {
  const lowercaseQuery = query.toLowerCase()

  const results = Array.from(exerciseLibrary.values())
    .filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(lowercaseQuery) ||
        exercise.description.toLowerCase().includes(lowercaseQuery) ||
        exercise.variations?.some((v) => v.toLowerCase().includes(lowercaseQuery))
    )
    .slice(0, 100) // Limit to 100 results

  return results
}

/**
 * Get exercise by ID
 */
export async function getExerciseById(exerciseId: string): Promise<Exercise | null> {
  return exerciseLibrary.get(exerciseId) || null
}

/**
 * Get all muscle groups in library
 */
export async function getAllMuscleGroups(): Promise<string[]> {
  const muscles = new Set<string>()

  for (const exercise of exerciseLibrary.values()) {
    exercise.muscleGroups.forEach((m) => muscles.add(m))
  }

  return Array.from(muscles).sort()
}

/**
 * Get exercises by difficulty
 */
export async function getExercisesByDifficulty(
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<Exercise[]> {
  return Array.from(exerciseLibrary.values()).filter((e) => e.difficulty === difficulty)
}

/**
 * Get exercises by category
 */
export async function getExercisesByCategory(
  category: 'compound' | 'isolation' | 'cardio' | 'stretching'
): Promise<Exercise[]> {
  return Array.from(exerciseLibrary.values()).filter((e) => e.category === category)
}
