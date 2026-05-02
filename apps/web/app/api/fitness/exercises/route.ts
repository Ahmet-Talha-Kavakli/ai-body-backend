import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') // "evde" | "salonda" | "outdoor" | null (all)
  const q = searchParams.get('q')?.trim()

  const exercises = await db.exercise.findMany({
    where: {
      ...(category ? { fitnessCategory: category } : {}),
      ...(q
        ? {
            OR: [
              { nametr: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      nametr: true,
      slug: true,
      muscleGroups: true,
      equipment: true,
      bodyPart: true,
      target: true,
      secondaryMuscles: true,
      gifUrl: true,
      fitnessCategory: true,
    },
    orderBy: [{ fitnessCategory: 'asc' }, { nametr: 'asc' }],
    take: 500,
  })

  return NextResponse.json(exercises)
})
