import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Aktif AI programını getir
    const program = await db.workoutProgram.findFirst({
      where: { userId: user.id, isActive: true },
      include: {
        weeks: {
          include: {
            days: {
              include: {
                exercises: {
                  include: { exercise: true },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { dayNumber: 'asc' },
            },
          },
          orderBy: { weekNumber: 'asc' },
        },
      },
    })

    // Tüm programları da getir (liste için)
    const allPrograms = await db.workoutProgram.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, isActive: true, generatedByAi: true, createdAt: true },
    })

    return NextResponse.json({ program, allPrograms })
  } catch (error) {
    logger.error({ err: error }, 'Program fetch error:')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
