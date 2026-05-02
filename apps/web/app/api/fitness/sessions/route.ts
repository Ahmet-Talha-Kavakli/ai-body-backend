import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

const SetSchema = z.object({
  exerciseId: z.string(),
  setNumber: z.number().int().min(1),
  reps: z.number().int().min(0).max(9999).optional(),
  weightKg: z.number().min(0).max(9999).optional(),
  durationSeconds: z.number().int().min(0).optional(),
})

const PostSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionName: z.string().max(80).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
  sets: z.array(SetSchema).min(1),
})

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)

  const sessions = await db.workoutSession.findMany({
    where: { userId: user.id, date },
    include: {
      completedSets: {
        include: {
          exercise: {
            select: { id: true, name: true, nametr: true, gifUrl: true, muscleGroups: true },
          },
        },
        orderBy: [{ exerciseId: 'asc' }, { setNumber: 'asc' }],
      },
    },
    orderBy: { startedAt: 'asc' },
  })

  return NextResponse.json(
    sessions.map((s) => ({
      id: s.id,
      date: s.date,
      sessionName: s.sessionName,
      durationSeconds: s.durationSeconds,
      notes: s.notes,
      startedAt: s.startedAt,
      exercises: buildExerciseSummary(s.completedSets),
      totalSets: s.completedSets.length,
      totalVolume: s.completedSets.reduce(
        (acc, cs) => acc + (cs.weightKg ?? 0) * (cs.reps ?? 1),
        0
      ),
    }))
  )
})

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json()
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const data = parsed.data

  // Auto-generate session name from exercise names if not provided
  let sessionName = data.sessionName
  if (!sessionName) {
    const exerciseIds = [...new Set(data.sets.map((s) => s.exerciseId))]
    const exs = await db.exercise.findMany({
      where: { id: { in: exerciseIds } },
      select: { nametr: true, name: true, muscleGroups: true },
      take: 3,
    })
    sessionName = exs.map((e) => e.nametr ?? e.name).join(', ')
  }

  const session = await db.workoutSession.create({
    data: {
      userId: user.id,
      date: data.date,
      sessionName,
      durationSeconds: data.durationSeconds,
      notes: data.notes,
      startedAt: new Date(),
      endedAt: new Date(),
      completedSets: {
        create: data.sets.map((s) => ({
          exerciseId: s.exerciseId,
          setNumber: s.setNumber,
          reps: s.reps,
          weightKg: s.weightKg,
          durationSeconds: s.durationSeconds,
          formScore: 0,
          repData: [],
        })),
      },
    },
    include: {
      completedSets: {
        include: {
          exercise: {
            select: { id: true, name: true, nametr: true, gifUrl: true, muscleGroups: true },
          },
        },
      },
    },
  })

  return NextResponse.json(
    {
      id: session.id,
      date: session.date,
      sessionName: session.sessionName,
      durationSeconds: session.durationSeconds,
      notes: session.notes,
      startedAt: session.startedAt,
      exercises: buildExerciseSummary(session.completedSets),
      totalSets: session.completedSets.length,
      totalVolume: session.completedSets.reduce(
        (acc, cs) => acc + (cs.weightKg ?? 0) * (cs.reps ?? 1),
        0
      ),
    },
    { status: 201 }
  )
})

function buildExerciseSummary(sets: any[]) {
  const map = new Map<string, any>()
  for (const s of sets) {
    if (!map.has(s.exerciseId)) {
      map.set(s.exerciseId, {
        exerciseId: s.exerciseId,
        name: s.exercise?.nametr ?? s.exercise?.name ?? '',
        gifUrl: s.exercise?.gifUrl ?? null,
        muscleGroups: s.exercise?.muscleGroups ?? [],
        sets: [],
      })
    }
    map.get(s.exerciseId).sets.push({
      setNumber: s.setNumber,
      reps: s.reps,
      weightKg: s.weightKg,
    })
  }
  return Array.from(map.values())
}
