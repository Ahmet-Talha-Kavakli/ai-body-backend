import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/client'
import { nutritionProfileSchema } from '@/lib/validation/schemas'

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

    const metrics = await prisma.userNutritionMetrics.findUnique({
      where: { userId },
    })

    return NextResponse.json({ success: true, data: metrics })
  } catch (error) {
    console.error('Error fetching nutrition metrics:', error)
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

    const parsed = nutritionProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const nutritionData = Object.fromEntries(
      Object.entries({
        proteinTarget: parsed.data.proteinTarget,
        calorieTarget: parsed.data.calorieTarget,
        dietType: parsed.data.dietType,
        avgSleepHours: parsed.data.avgSleepHours,
        stressLevel: parsed.data.stressLevel,
        alcoholConsumption: parsed.data.alcoholConsumption,
        smoking: parsed.data.smoking,
        waterIntakeTarget: parsed.data.waterIntakeTarget,
        supplementStack: parsed.data.supplementStack,
      }).filter(([_, v]) => v !== undefined)
    )

    const metrics = await prisma.userNutritionMetrics.upsert({
      where: { userId },
      update: nutritionData,
      create: { userId, ...nutritionData } as any,
    })

    return NextResponse.json({ success: true, data: metrics })
  } catch (error) {
    console.error('Error saving nutrition metrics:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
