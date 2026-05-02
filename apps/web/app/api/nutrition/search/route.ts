import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { searchFatSecretFoods, normalizeFatSecretFood } from '@/lib/nutrition/fatsecret'
import { checkRateLimit, getRateLimitRemaining } from '@/lib/nutrition/rate-limit'

/**
 * GET /api/nutrition/search?q=chicken
 * Search foods by name in FatSecret API
 * Results cached in DB for future use
 */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Rate limiting: 100 searches per minute per user
    const rateLimitKey = `nutrition_search:${user.id}`
    if (!checkRateLimit(rateLimitKey, 100, 60 * 1000)) {
      const remaining = getRateLimitRemaining(rateLimitKey, 100, 60 * 1000)
      return NextResponse.json(
        { error: 'Rate limit exceeded. Too many searches.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': remaining.toString() } }
      )
    }

    // Get search query
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      )
    }

    if (query.length > 100) {
      return NextResponse.json(
        { error: 'Search query must be less than 100 characters' },
        { status: 400 }
      )
    }

    // Search FatSecret API
    const foods = await searchFatSecretFoods(query)

    if (!foods || foods.length === 0) {
      return NextResponse.json({
        query,
        results: [],
        count: 0,
      })
    }

    // Normalize results and cache top 5 in DB
    const normalized = foods
      .slice(0, 10)
      .map((food) => {
        try {
          return normalizeFatSecretFood(food)
        } catch (e) {
          console.error('[nutrition/search] Normalization failed:', e)
          return null
        }
      })
      .filter(Boolean) as any[]

    // Cache top results in DB (upsert)
    for (const item of normalized.slice(0, 5)) {
      await db.foodItem
        .upsert({
          where: { fatSecretId: item.fatSecretId },
          update: {
            updatedAt: new Date(),
          },
          create: item,
        })
        .catch((e) => {
          console.error('[nutrition/search] Cache upsert failed:', e)
        })
    }

    return NextResponse.json({
      query,
      results: normalized.slice(0, 10), // Return top 10
      count: normalized.length,
      cached: true,
    })
  } catch (error) {
    console.error('[nutrition/search]', error)
    return NextResponse.json(
      {
        error: 'Failed to search foods',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
