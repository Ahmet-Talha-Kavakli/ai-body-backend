import { z } from 'zod'

export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
})

export const sessionCompleteSchema = z.object({
  durationSeconds: z.number().int().positive(),
  caloriesBurned: z.number().int().nonnegative().optional(),
  overallFormScore: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
  heartRateData: z.unknown().optional(),
  completedSets: z
    .array(
      z.object({
        exerciseSlug: z.string().min(1),
        exerciseName: z.string().min(1),
        muscleGroups: z.array(z.string()).optional(),
        setNumber: z.number().int().positive(),
        reps: z.number().int().nonnegative().optional(),
        weightKg: z.number().nonnegative().optional(),
        durationSeconds: z.number().int().nonnegative().optional(),
        formScore: z.number().min(0).max(100).optional(),
        repData: z.array(z.unknown()).optional(),
      })
    )
    .optional(),
})

export const mealAnalyzeSchema = z.object({
  imageBase64: z.string().min(1),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
})

export const coachMessageSchema = z.object({
  exercise: z.string().min(1),
  repCount: z.number().int().nonnegative(),
  targetReps: z.number().int().positive(),
  setNumber: z.number().int().positive(),
  totalSets: z.number().int().positive(),
  formFeedback: z.string().optional(),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type SessionCompleteInput = z.infer<typeof sessionCompleteSchema>
export type MealAnalyzeInput = z.infer<typeof mealAnalyzeSchema>
export type CoachMessageInput = z.infer<typeof coachMessageSchema>
