import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/client'
import { profileUpdateSchema } from '@/lib/validation/schemas'
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

    const profile = await prisma.userBasicProfile.findUnique({
      where: { userId },
    })

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    logger.error({ err: error }, 'Error fetching basic profile:')
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

    const parsed = profileUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Filter out undefined values
    const basicData = Object.fromEntries(
      Object.entries({
        age: parsed.data.age,
        gender: parsed.data.gender,
        height: parsed.data.height,
        weight: parsed.data.weight,
        fitnessLevel: parsed.data.fitnessLevel,
        primaryGoal: parsed.data.primaryGoal,
        experienceYears: parsed.data.experienceYears,
        targetWeight: parsed.data.targetWeight,
        targetFitnessLevel: parsed.data.targetFitnessLevel,
      }).filter(([_, v]) => v !== undefined)
    )

    const profile = await prisma.userBasicProfile.upsert({
      where: { userId },
      update: basicData,
      create: { userId, ...basicData },
    })

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    logger.error({ err: error }, 'Error saving basic profile:')
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
