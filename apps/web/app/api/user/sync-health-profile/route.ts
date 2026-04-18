import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/logger'

/**
 * POST /api/user/sync-health-profile
 * UserBasicProfile + UserTrainingHistory → HealthProfile sync
 * Onboarding formu HealthProfile'ı güncellemiyorsa bu endpoint'i çağır.
 */
export async function POST() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({
      where: { clerkId },
      include: {
        healthProfile: true,
      },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Mevcut profil verilerini al
    const [basicProfile, trainingHistory] = await Promise.all([
      db.userBasicProfile.findUnique({ where: { userId: user.id } }),
      db.userTrainingHistory.findUnique({ where: { userId: user.id } }),
    ])

    if (!basicProfile) {
      return NextResponse.json({ error: 'Önce onboarding tamamla.' }, { status: 400 })
    }

    // HealthProfile'ı upsert et
    await db.healthProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        fitnessLevel: basicProfile.fitnessLevel ?? 'beginner',
        goals: basicProfile.primaryGoal ? [basicProfile.primaryGoal] : ['general_fitness'],
        sessionDurationMinutes: trainingHistory?.preferredDuration ?? 45,
        availableEquipment: (trainingHistory?.preferredExercises as string[]) ?? [],
        availableDaysPerWeek: trainingHistory?.trainingDaysPerWeek ?? 4,
        age: basicProfile.age ?? 25,
        weightKg: basicProfile.weight ?? 70,
        heightCm: basicProfile.height ?? 175,
        gender: basicProfile.gender ?? 'prefer_not_to_say',
      },
      update: {
        fitnessLevel: basicProfile.fitnessLevel ?? 'beginner',
        goals: basicProfile.primaryGoal ? [basicProfile.primaryGoal] : ['general_fitness'],
        sessionDurationMinutes: trainingHistory?.preferredDuration ?? 45,
        availableEquipment: (trainingHistory?.preferredExercises as string[]) ?? [],
        availableDaysPerWeek: trainingHistory?.trainingDaysPerWeek ?? 4,
        age: basicProfile.age ?? 25,
        weightKg: basicProfile.weight ?? 70,
        heightCm: basicProfile.height ?? 175,
        gender: basicProfile.gender ?? 'prefer_not_to_say',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'sync-health-profile error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
