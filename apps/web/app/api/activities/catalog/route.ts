import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const q = req.nextUrl.searchParams.get('q')?.trim()

  const [catalog, userScores, subtypes] = await Promise.all([
    db.activityCatalog.findMany({
      where: q
        ? {
            OR: [
              { nametr: { contains: q, mode: 'insensitive' } },
              { nameen: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { category: 'asc' },
    }),
    db.userActivityScore.findMany({
      where: { userId: user.id },
      select: {
        catalogId: true,
        score: true,
        aiNote: true,
        benefits: true,
        cautions: true,
        frequency: true,
        bestTime: true,
      },
    }),
    db.activitySubType.findMany({ orderBy: { key: 'asc' } }),
  ])

  const scoreMap = Object.fromEntries(userScores.map((s) => [s.catalogId, s]))
  const subtypeMap = subtypes.reduce<Record<string, { key: string; nametr: string }[]>>(
    (acc, s) => {
      if (!acc[s.activityType]) acc[s.activityType] = []
      acc[s.activityType]!.push({ key: s.key, nametr: s.nametr })
      return acc
    },
    {}
  )

  return NextResponse.json(
    catalog.map((c) => ({
      ...c,
      userScore: scoreMap[c.id] ?? null,
      subtypes: subtypeMap[c.activityType] ?? [],
    }))
  )
})
