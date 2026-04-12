import { prisma } from '@/lib/db/client'
import { computeMorphParams } from './morph-calculator'
import { workoutCountToFitnessLevel } from './level-calculator'

export async function updateCharacterMorphCache(
  userId: string,
  data: { weightKg: number; heightCm: number; gender: string; totalWorkoutCount: number }
): Promise<void> {
  const fitnessLevel = workoutCountToFitnessLevel(data.totalWorkoutCount)
  const params = computeMorphParams({ ...data, fitnessLevel })

  await prisma.user.update({
    where: { id: userId },
    data: { characterMorphCache: params as object },
  })
}
