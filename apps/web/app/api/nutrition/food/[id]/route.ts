import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { getFatSecretFood, normalizeFatSecretFood } from '@/lib/nutrition/fatsecret'
import { checkRateLimit } from '@/lib/nutrition/rate-limit'

/**
 * GET /api/nutrition/food/[id]
 * Get detailed food information with 18 nutrition values
 * Caches result in DB for future requests
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const resolvedParams = await params
    const foodId = resolvedParams.id?.trim()
    if (!foodId) {
      return NextResponse.json({ error: 'Food ID is required' }, { status: 400 })
    }

    // Rate limiting: 200 detailed lookups per minute per user
    const rateLimitKey = `nutrition_food:${user.id}`
    if (!checkRateLimit(rateLimitKey, 200, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Too many requests.' },
        { status: 429 }
      )
    }

    // Check cache first
    let cached = await db.foodItem
      .findUnique({
        where: { fatSecretId: foodId },
      })
      .catch(() => null)

    if (cached) {
      return NextResponse.json({
        food: cached,
        source: 'cache',
        cached: true,
      })
    }

    // Fetch from FatSecret API
    const food = await getFatSecretFood(foodId)

    if (!food) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 })
    }

    // Normalize
    const normalized = normalizeFatSecretFood(food)

    // Save to cache
    const saved = await db.foodItem
      .upsert({
        where: { fatSecretId: normalized.fatSecretId },
        update: {
          updatedAt: new Date(),
        },
        create: normalized,
      })
      .catch((e) => {
        console.error('[nutrition/food] Cache save failed:', e)
        return null
      })

    return NextResponse.json({
      food: saved || normalized,
      source: 'api',
      cached: false,
    })
  } catch (error) {
    console.error('[nutrition/food/[id]]', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch food details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
