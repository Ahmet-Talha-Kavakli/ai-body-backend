import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/client'
import { trainingProfileSchema } from '@/lib/validation/schemas'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const history = await prisma.userTrainingHistory.findUnique({
      where: { userId },
    })

    return NextResponse.json({ success: true, data: history })
  } catch (error) {
    console.error('Error fetching training history:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const parsed = trainingProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const history = await prisma.userTrainingHistory.upsert({
      where: { userId },
      update: parsed.data,
      create: { userId, ...parsed.data },
    })

    return NextResponse.json({ success: true, data: history })
  } catch (error) {
    console.error('Error saving training history:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
