import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/client'
import { buildFitnessCoachPrompt } from '@/lib/vapi/fitness-coach-prompt'
import { workoutCountToFitnessLevel } from '@/lib/character/level-calculator'

export async function GET(_req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [healthProfile, workoutCount, user] = await Promise.all([
    prisma.healthProfile.findUnique({
      where: { userId: clerkId },
    }),
    prisma.workoutSession.count({
      where: { userId: clerkId },
    }),
    prisma.user.findUnique({
      where: { clerkId },
      select: { name: true },
    }),
  ])

  const fitnessLevel = workoutCountToFitnessLevel(workoutCount)

  const profile = {
    name: user?.name ?? 'Kullanıcı',
    weightKg: (healthProfile as any)?.weightKg ?? 70,
    heightCm: (healthProfile as any)?.heightCm ?? 170,
    goals: (healthProfile as any)?.goals ?? [],
    fitnessLevel,
    injuries: (healthProfile as any)?.injuries ?? [],
    weeklyWorkouts: workoutCount,
    supplements: (healthProfile as any)?.supplements ?? [],
  }

  const systemPrompt = buildFitnessCoachPrompt(profile)

  return NextResponse.json({ profile, systemPrompt })
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { transcript, durationSeconds = 0 } = body

  const session = await prisma.fitnessCoachSession.create({
    data: {
      userId: clerkId,
      transcript,
      durationSeconds,
    },
  })

  return NextResponse.json({ id: session.id }, { status: 201 })
}
