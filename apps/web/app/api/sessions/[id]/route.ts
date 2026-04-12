import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { sessionCompleteSchema } from '@/lib/validation/schemas'
import { writeSessionMemory } from '@/lib/memory/memory-writer'
import type { SessionMemoryInput } from '@/lib/memory/types'
import { logger } from '@/lib/logger'

// Seansı bitir ve kaydet
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()
    const parsed = sessionCompleteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const {
      durationSeconds,
      caloriesBurned,
      overallFormScore,
      notes,
      heartRateData,
      completedSets,
    } = parsed.data

    const session = await db.$transaction(async (tx) => {
      const updatedSession = await tx.workoutSession.update({
        where: { id, userId: user.id },
        data: {
          endedAt: new Date(),
          durationSeconds,
          caloriesBurned,
          overallFormScore,
          notes,
          heartRateData: heartRateData as never,
        },
      })

      // Set'leri kaydet
      if (completedSets && completedSets.length > 0) {
        for (const set of completedSets) {
          let exercise = await tx.exercise.findUnique({ where: { slug: set.exerciseSlug } })

          if (!exercise) {
            exercise = await tx.exercise.create({
              data: {
                name: set.exerciseName,
                slug: set.exerciseSlug,
                description: set.exerciseName,
                muscleGroups: set.muscleGroups ?? [],
                equipment: [],
                difficultyLevel: 'intermediate',
                animationKey: set.exerciseSlug,
                cues: [],
                commonMistakes: [],
              },
            })
          }

          await tx.completedSet.create({
            data: {
              sessionId: updatedSession.id,
              exerciseId: exercise.id,
              setNumber: set.setNumber,
              reps: set.reps,
              weightKg: set.weightKg,
              durationSeconds: set.durationSeconds,
              formScore: set.formScore ?? 85,
              repData: (set.repData ?? []) as never,
            },
          })
        }
      }

      return updatedSession
    })

    // Hafıza katmanına yaz — fire-and-forget, response'u bloklamaz
    if (completedSets && completedSets.length > 0) {
      const exerciseMap: Record<
        string,
        { name: string; sets: SessionMemoryInput['exercises'][0]['sets']; scores: number[] }
      > = {}

      for (const set of completedSets) {
        // exerciseName, sessionCompleteSchema Zod validation'dan garantili geliyor
        const key = set.exerciseName
        if (!exerciseMap[key]) exerciseMap[key] = { name: key, sets: [], scores: [] }
        exerciseMap[key].sets.push({
          setNumber: set.setNumber,
          reps: set.reps ?? null,
          weightKg: set.weightKg ?? null,
          formScore: set.formScore ?? 0,
        })
        exerciseMap[key].scores.push(set.formScore ?? 0)
      }

      writeSessionMemory({
        userId: user.id,
        sessionId: id,
        exercises: Object.values(exerciseMap).map((ex) => ({
          name: ex.name,
          sets: ex.sets,
          avgFormScore:
            ex.scores.length > 0 ? ex.scores.reduce((a, b) => a + b, 0) / ex.scores.length : 0,
        })),
        durationSeconds: durationSeconds ?? 0,
        overallFormScore: overallFormScore ?? null,
        caloriesBurned: caloriesBurned ?? null,
        notes: notes ?? null,
      }).catch(() => {}) // Hafıza hatası seans kaydını asla etkilemez
    }

    return NextResponse.json({ success: true, session })
  } catch (error) {
    logger.error({ err: error }, 'Session update error:')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
