import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/client'
import { healthProfileSchema } from '@/lib/validation/schemas'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const metrics = await prisma.userHealthMetrics.findUnique({
      where: { userId },
    })

    return NextResponse.json({ success: true, data: metrics })
  } catch (error) {
    console.error('Error fetching health metrics:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const parsed = healthProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const metrics = await prisma.userHealthMetrics.upsert({
      where: { userId },
      update: parsed.data,
      create: { userId, ...parsed.data },
    })

    return NextResponse.json({ success: true, data: metrics })
  } catch (error) {
    console.error('Error saving health metrics:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
