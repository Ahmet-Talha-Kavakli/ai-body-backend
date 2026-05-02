import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url)
  const exerciseId = searchParams.get('exerciseId')

  if (exerciseId) {
    // Single exercise records
    const sets = await db.completedSet.findMany({
      where: { session: { userId: user.id }, exerciseId },
      orderBy: { weightKg: 'desc' },
      take: 100,
    })

    const maxWeight = sets.reduce((m, s) => Math.max(m, s.weightKg ?? 0), 0)
    const maxReps = sets.reduce((m, s) => Math.max(m, s.reps ?? 0), 0)
    const totalSets = sets.length

    return NextResponse.json({ exerciseId, maxWeight, maxReps, totalSets })
  }

  // All exercises personal records
  const sessions = await db.workoutSession.findMany({
    where: { userId: user.id },
    select: { id: true },
  })
  const sessionIds = sessions.map((s) => s.id)

  const sets = await db.completedSet.findMany({
    where: { sessionId: { in: sessionIds } },
    include: { exercise: { select: { id: true, nametr: true, name: true } } },
  })

  const recordMap = new Map<
    string,
    { name: string; maxWeight: number; maxReps: number; totalSets: number }
  >()
  for (const s of sets) {
    const key = s.exerciseId
    const name = s.exercise.nametr ?? s.exercise.name
    const prev = recordMap.get(key) ?? { name, maxWeight: 0, maxReps: 0, totalSets: 0 }
    recordMap.set(key, {
      name,
      maxWeight: Math.max(prev.maxWeight, s.weightKg ?? 0),
      maxReps: Math.max(prev.maxReps, s.reps ?? 0),
      totalSets: prev.totalSets + 1,
    })
  }

  return NextResponse.json(
    Array.from(recordMap.entries()).map(([exerciseId, r]) => ({ exerciseId, ...r }))
  )
})
