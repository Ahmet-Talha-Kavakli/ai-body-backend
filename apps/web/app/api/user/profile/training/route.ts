import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/client'
import { trainingProfileSchema } from '@/lib/validation/schemas'
import { logger } from '@/lib/logger'

async function getDbUserId(clerkId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  return user?.id ?? null
}

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = await getDbUserId(clerkId)
    if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const history = await prisma.userTrainingHistory.findUnique({
      where: { userId },
    })

    return NextResponse.json({ success: true, data: history })
  } catch (error) {
    logger.error({ err: error }, 'Error fetching training history:')
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = await getDbUserId(clerkId)
    if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await request.json()

    const parsed = trainingProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const trainingData = Object.fromEntries(
      Object.entries({
        trainingDaysPerWeek: parsed.data.trainingDaysPerWeek,
        preferredExercises: parsed.data.preferredExercises,
        dislikedExercises: parsed.data.dislikedExercises,
        personalRecords: parsed.data.personalRecords,
        startingStats: parsed.data.startingStats,
        trainingStyle: parsed.data.trainingStyle,
        preferredDuration: parsed.data.preferredDuration,
      }).filter(([_, v]) => v !== undefined)
    )

    const history = await prisma.userTrainingHistory.upsert({
      where: { userId },
      update: trainingData,
      create: { userId, ...trainingData } as any,
    })

    return NextResponse.json({ success: true, data: history })
  } catch (error) {
    logger.error({ err: error }, 'Error saving training history:')
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
