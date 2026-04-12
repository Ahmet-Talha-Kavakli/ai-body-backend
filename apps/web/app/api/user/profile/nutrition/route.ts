import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/client'
import { nutritionProfileSchema } from '@/lib/validation/schemas'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const parsed = nutritionProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const metrics = await prisma.userNutritionMetrics.upsert({
      where: { userId },
      update: parsed.data as any,
      create: { userId, ...parsed.data } as any,
    })

    return NextResponse.json({ success: true, data: metrics })
  } catch (error) {
    console.error('Error saving nutrition metrics:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
