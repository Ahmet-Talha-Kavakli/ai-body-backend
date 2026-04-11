import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { sessionCompleteSchema } from '@/lib/validation/schemas'

// Seansı bitir ve kaydet
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { durationSeconds, caloriesBurned, overallFormScore, notes, heartRateData, completedSets } = parsed.data

    const session = await db.$transaction(async (tx) => {
      const updatedSession = await tx.workoutSession.update({
        where: { id, userId: user.id },
        data: {
          endedAt: new Date(),
          durationSeconds,
          caloriesBurned,
          overallFormScore,
          notes,
          heartRateData,
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
              repData: set.repData ?? [],
            },
          })
        }
      }

      return updatedSession
    })

    return NextResponse.json({ success: true, session })
  } catch (error) {
    console.error('Session update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
