import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { FitnessCoachPage } from '@/components/fitness-coach/FitnessCoachPage'
import { buildFitnessCoachPrompt } from '@/lib/vapi/fitness-coach-prompt'
import { workoutCountToFitnessLevel } from '@/lib/character/level-calculator'
import { prisma } from '@/lib/db/client'
import type { FitnessLevel } from '@fitai/shared-types'

export default async function FitnessCoachRoute() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const [healthProfile, workoutCount, user] = await Promise.all([
    prisma.healthProfile.findUnique({ where: { userId } }),
    prisma.workoutSession.count({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ])

  const fitnessLevel: FitnessLevel = workoutCountToFitnessLevel(workoutCount)

  const profile = {
    name: user?.name ?? 'Kullanıcı',
    weightKg: healthProfile?.weightKg ?? 70,
    heightCm: healthProfile?.heightCm ?? 175,
    goals: (healthProfile?.goals as string[]) ?? [],
    fitnessLevel,
    injuries: [] as string[],
    weeklyWorkouts: 0,
    supplements: [] as string[],
  }

  const topicProfile = {
    goals: profile.goals,
    activeInjuries: profile.injuries,
    supplements: profile.supplements,
  }

  const systemPrompt = buildFitnessCoachPrompt(profile)

  return <FitnessCoachPage systemPrompt={systemPrompt} profile={topicProfile} />
}
