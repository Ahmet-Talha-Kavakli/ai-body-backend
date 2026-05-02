import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async () => {
  try {
    const presets = await db.dietPreset.findMany({
      orderBy: [{ popularityScore: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        description: true,
        heroImageUrl: true,
        thumbnailUrl: true,
        accentColor: true,
        defaultDurationDays: true,
        minDurationDays: true,
        maxDurationDays: true,
        proteinPct: true,
        carbsPct: true,
        fatPct: true,
        evidenceLevel: true,
        recommendedFor: true,
        notRecommendedFor: true,
        popularityScore: true,
        isPremium: true,
      },
    })

    return NextResponse.json({ presets })
  } catch (err) {
    console.error('[diet/presets GET]', err)
    return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 })
  }
})
