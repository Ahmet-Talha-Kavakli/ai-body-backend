import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const q = req.nextUrl.searchParams.get('q')?.trim()

  const catalog = await db.drinkCatalog.findMany({
    where: q
      ? {
          OR: [
            { nametr: { contains: q, mode: 'insensitive' } },
            { nameen: { contains: q, mode: 'insensitive' } },
            { category: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { category: 'asc' },
  })

  const scores = await db.userDrinkScore.findMany({
    where: { userId: user.id },
    select: {
      catalogId: true,
      score: true,
      aiNote: true,
      benefits: true,
      cautions: true,
      bestTime: true,
      dailyLimit: true,
    },
  })

  const scoreMap = new Map(scores.map((s) => [s.catalogId, s]))

  const result = catalog.map((item) => {
    const score = scoreMap.get(item.id)
    return {
      ...item,
      userScore: score
        ? {
            score: score.score,
            aiNote: score.aiNote,
            benefits: score.benefits,
            cautions: score.cautions,
            bestTime: score.bestTime,
            dailyLimit: score.dailyLimit,
          }
        : null,
    }
  })

  return NextResponse.json(result)
})
