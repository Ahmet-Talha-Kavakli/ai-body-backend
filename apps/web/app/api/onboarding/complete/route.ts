import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/logger'

interface OnboardingCompleteBody {
  primaryGoal: string
  age: number | undefined
  gender: string
  height: number | undefined
  weight: number | undefined
  targetWeight: number | undefined
  fitnessLevel: string
  trainingDaysPerWeek: number
  medicalRestrictions: string[]
  activeInjuries: string[]
  dietType: string
  avgSleepHours: number
  stressLevel: number
  waterIntakeTarget: number
  petName: string
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: OnboardingCompleteBody
    try {
      body = (await req.json()) as OnboardingCompleteBody
    } catch {
      return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const userId = user.id

    // 1. UserBasicProfile — upsert
    await db.userBasicProfile.upsert({
      where: { userId },
      create: {
        userId,
        age: body.age ?? null,
        gender: body.gender || null,
        height: body.height ?? null,
        weight: body.weight ?? null,
        targetWeight: body.targetWeight ?? null,
        fitnessLevel: body.fitnessLevel || null,
        primaryGoal: body.primaryGoal || null,
      },
      update: {
        age: body.age ?? undefined,
        gender: body.gender || undefined,
        height: body.height ?? undefined,
        weight: body.weight ?? undefined,
        targetWeight: body.targetWeight ?? undefined,
        fitnessLevel: body.fitnessLevel || undefined,
        primaryGoal: body.primaryGoal || undefined,
      },
    })

    // 2. UserHealthMetrics — upsert
    await db.userHealthMetrics.upsert({
      where: { userId },
      create: {
        userId,
        medicalRestrictions: body.medicalRestrictions ?? [],
        activeInjuries:
          body.activeInjuries.length > 0
            ? body.activeInjuries.map((bodyPart) => ({
                bodyPart,
                injuryType: 'unknown',
                severity: 'mild',
              }))
            : undefined,
      },
      update: {
        medicalRestrictions: body.medicalRestrictions ?? [],
        activeInjuries:
          body.activeInjuries.length > 0
            ? body.activeInjuries.map((bodyPart) => ({
                bodyPart,
                injuryType: 'unknown',
                severity: 'mild',
              }))
            : undefined,
      },
    })

    // 3. UserNutritionMetrics — upsert
    await db.userNutritionMetrics.upsert({
      where: { userId },
      create: {
        userId,
        dietType: body.dietType || null,
        avgSleepHours: body.avgSleepHours ?? null,
        stressLevel: body.stressLevel ?? null,
        waterIntakeTarget: body.waterIntakeTarget ?? null,
      },
      update: {
        dietType: body.dietType || undefined,
        avgSleepHours: body.avgSleepHours ?? undefined,
        stressLevel: body.stressLevel ?? undefined,
        waterIntakeTarget: body.waterIntakeTarget ?? undefined,
      },
    })

    // 4. UserTrainingHistory — upsert (training days)
    await db.userTrainingHistory.upsert({
      where: { userId },
      create: {
        userId,
        trainingDaysPerWeek: body.trainingDaysPerWeek ?? null,
      },
      update: {
        trainingDaysPerWeek: body.trainingDaysPerWeek ?? undefined,
      },
    })

    // 5. Also update legacy HealthProfile for backward compat
    await db.healthProfile.upsert({
      where: { userId },
      create: {
        userId,
        fitnessLevel: body.fitnessLevel || 'beginner',
        goals: body.primaryGoal ? [body.primaryGoal] : [],
        sessionDurationMinutes: 45,
        availableEquipment: [],
        availableDaysPerWeek: body.trainingDaysPerWeek ?? 3,
        age: body.age ?? 25,
        weightKg: body.weight ?? 70,
        heightCm: body.height ?? 175,
        gender: body.gender || 'prefer_not_to_say',
      },
      update: {
        fitnessLevel: body.fitnessLevel || 'beginner',
        goals: body.primaryGoal ? [body.primaryGoal] : [],
        availableDaysPerWeek: body.trainingDaysPerWeek ?? 3,
        age: body.age ?? 25,
        weightKg: body.weight ?? 70,
        heightCm: body.height ?? 175,
        gender: body.gender || 'prefer_not_to_say',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Onboarding complete error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
