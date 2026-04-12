import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

const DEFAULT_PARAMS = {
  bmi: 22,
  muscleLevel: 0,
  heightNorm: 1.0,
  gender: 'other',
  fitnessLevel: 'beginner',
  updatedAt: new Date().toISOString(),
}

export async function GET(_req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { characterMorphCache: true },
  })

  const params = (user?.characterMorphCache as typeof DEFAULT_PARAMS | null) ?? DEFAULT_PARAMS

  return NextResponse.json(params)
}
