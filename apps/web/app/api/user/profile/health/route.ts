import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/client'
import { healthProfileSchema } from '@/lib/validation/schemas'
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

    const metrics = await prisma.userHealthMetrics.findUnique({
      where: { userId },
    })

    return NextResponse.json({ success: true, data: metrics })
  } catch (error) {
    logger.error({ err: error }, 'Error fetching health metrics:')
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

    const parsed = healthProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const healthData = Object.fromEntries(
      Object.entries({
        activeInjuries: parsed.data.activeInjuries,
        pastInjuries: parsed.data.pastInjuries,
        medicalRestrictions: parsed.data.medicalRestrictions,
        currentPainPoints: parsed.data.currentPainPoints,
        doctorNotes: parsed.data.doctorNotes,
      }).filter(([_, v]) => v !== undefined)
    )

    const metrics = await prisma.userHealthMetrics.upsert({
      where: { userId },
      update: healthData,
      create: { userId, ...healthData } as any,
    })

    return NextResponse.json({ success: true, data: metrics })
  } catch (error) {
    logger.error({ err: error }, 'Error saving health metrics:')
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
