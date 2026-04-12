import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const bodyPart = searchParams.get('bodyPart')
    const equipment = searchParams.get('equipment')
    const search = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') ?? '20')

    const exercises = await db.exercise.findMany({
      where: {
        ...(bodyPart && { bodyPart }),
        ...(equipment && { equipment: { has: equipment } }),
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
      },
      take: limit,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ exercises })
  } catch (error) {
    logger.error({ err: error }, 'Error fetching exercises:')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
