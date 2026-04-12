import { z } from 'zod'

export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced', 'elite']).optional(),
  age: z.number().int().min(13).max(120).optional(),
  gender: z.string().optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  experienceYears: z.number().int().nonnegative().optional(),
  primaryGoal: z.string().optional(),
  targetWeight: z.number().positive().optional(),
  targetFitnessLevel: z.string().optional(),
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

// Base64 regex: only A-Z, a-z, 0-9, +, /, = characters
const BASE64_REGEX = /^[A-Za-z0-9+/]+=*$/
// 5MB raw → ~6.7MB base64 (base64 expands by ~4/3)
const MAX_BASE64_LENGTH = Math.ceil(5 * 1024 * 1024 * 1.4)

export const mealAnalyzeSchema = z.object({
  imageBase64: z
    .string()
    .min(1, 'Görsel boş olamaz')
    .max(MAX_BASE64_LENGTH, 'Görsel 5MB limitini aşıyor')
    .refine((val) => BASE64_REGEX.test(val), 'Geçersiz base64 formatı'),
  mealType: z
    .enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'])
    .optional(),
})

export const coachMessageSchema = z.object({
  exercise: z.string().min(1),
  repCount: z.number().int().nonnegative(),
  targetReps: z.number().int().positive(),
  setNumber: z.number().int().positive(),
  totalSets: z.number().int().positive(),
  formFeedback: z.string().optional(),
})

export const healthProfileSchema = z.object({
  activeInjuries: z.any().optional(),
  pastInjuries: z.any().optional(),
  medicalRestrictions: z.array(z.string()).optional(),
  currentPainPoints: z.any().optional(),
  doctorNotes: z.string().optional(),
})

export const trainingProfileSchema = z.object({
  trainingDaysPerWeek: z.number().int().min(1).max(7).optional(),
  preferredExercises: z.array(z.string()).optional(),
  dislikedExercises: z.array(z.string()).optional(),
  personalRecords: z.any().optional(),
  startingStats: z.any().optional(),
  trainingStyle: z.string().optional(),
  preferredDuration: z.number().int().min(10).optional(),
})

export const nutritionProfileSchema = z.object({
  proteinTarget: z.number().nonnegative().optional(),
  calorieTarget: z.number().nonnegative().optional(),
  dietType: z.string().optional(),
  avgSleepHours: z.number().min(0).max(24).optional(),
  stressLevel: z.number().int().min(0).max(10).optional(),
  alcoholConsumption: z.string().optional(),
  smoking: z.boolean().optional(),
  waterIntakeTarget: z.number().nonnegative().optional(),
  supplementStack: z.array(z.string()).optional(),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type HealthProfileInput = z.infer<typeof healthProfileSchema>
export type TrainingProfileInput = z.infer<typeof trainingProfileSchema>
export type NutritionProfileInput = z.infer<typeof nutritionProfileSchema>
export type SessionCompleteInput = z.infer<typeof sessionCompleteSchema>
export type MealAnalyzeInput = z.infer<typeof mealAnalyzeSchema>
export type CoachMessageInput = z.infer<typeof coachMessageSchema>
