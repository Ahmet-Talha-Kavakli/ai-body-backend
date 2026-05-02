import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { checkRateLimit } from '@/lib/nutrition/rate-limit'

/**
 * GET /api/nutrition/goal
 * Get user's daily nutrition goal
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const goal = await db.nutritionGoal.findUnique({
      where: { userId: user.id },
    })

    if (!goal) {
      return NextResponse.json({
        goal: null,
        message: 'No nutrition goal set. Please create one.',
      })
    }

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('[nutrition/goal GET]', error)
    return NextResponse.json({ error: 'Failed to fetch nutrition goal' }, { status: 500 })
  }
}

/**
 * POST /api/nutrition/goal
 * Create or update nutrition goal
 *
 * Body: {
 *   dailyCalories: number,
 *   proteinG: number,
 *   carbsG: number,
 *   fatG: number,
 *   waterMl?: number (default 2500),
 *   fiberG?: number (default 25)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Rate limiting: 10 goal updates per day
    const rateLimitKey = `nutrition_goal:${user.id}:${new Date().toDateString()}`
    if (!checkRateLimit(rateLimitKey, 10, 24 * 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many goal updates today. Try again tomorrow.' },
        { status: 429 }
      )
    }

    const body = await req.json()

    // Validate required fields
    const dailyCalories = Number(body.dailyCalories)
    const proteinG = Number(body.proteinG)
    const carbsG = Number(body.carbsG)
    const fatG = Number(body.fatG)

    if (isNaN(dailyCalories) || isNaN(proteinG) || isNaN(carbsG) || isNaN(fatG)) {
      return NextResponse.json(
        {
          error: 'Missing or invalid fields',
          required: ['dailyCalories', 'proteinG', 'carbsG', 'fatG'],
        },
        { status: 400 }
      )
    }

    // Validate ranges
    if (dailyCalories < 0 || dailyCalories > 10000) {
      return NextResponse.json(
        { error: 'dailyCalories must be between 0 and 10000' },
        { status: 400 }
      )
    }
    if (proteinG < 0 || proteinG > 500) {
      return NextResponse.json({ error: 'proteinG must be between 0 and 500' }, { status: 400 })
    }
    if (carbsG < 0 || carbsG > 1000) {
      return NextResponse.json({ error: 'carbsG must be between 0 and 1000' }, { status: 400 })
    }
    if (fatG < 0 || fatG > 500) {
      return NextResponse.json({ error: 'fatG must be between 0 and 500' }, { status: 400 })
    }

    const goal = await db.nutritionGoal.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        dailyCalories,
        proteinG,
        carbsG,
        fatG,
        waterMl: Number(body.waterMl) || 2500,
        fiberG: Number(body.fiberG) || 25,
        waterGoalMl: Number(body.waterMl) || 2500,
      },
      update: {
        dailyCalories,
        proteinG,
        carbsG,
        fatG,
        waterMl: Number(body.waterMl) || 2500,
        fiberG: Number(body.fiberG) || 25,
        waterGoalMl: Number(body.waterMl) || 2500,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    console.error('[nutrition/goal POST]', error)
    return NextResponse.json(
      {
        error: 'Failed to create nutrition goal',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/nutrition/goal
 * Update existing nutrition goal (same as POST, but awards achievement)
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Rate limiting: 10 goal updates per day
    const rateLimitKey = `nutrition_goal:${user.id}:${new Date().toDateString()}`
    if (!checkRateLimit(rateLimitKey, 10, 24 * 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many goal updates today. Try again tomorrow.' },
        { status: 429 }
      )
    }

    const body = await req.json()

    // Validate required fields
    const dailyCalories = Number(body.dailyCalories)
    const proteinG = Number(body.proteinG)
    const carbsG = Number(body.carbsG)
    const fatG = Number(body.fatG)

    if (isNaN(dailyCalories) || isNaN(proteinG) || isNaN(carbsG) || isNaN(fatG)) {
      return NextResponse.json(
        {
          error: 'Missing or invalid fields',
          required: ['dailyCalories', 'proteinG', 'carbsG', 'fatG'],
        },
        { status: 400 }
      )
    }

    const goal = await db.nutritionGoal.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        dailyCalories,
        proteinG,
        carbsG,
        fatG,
        waterMl: Number(body.waterMl) || 2500,
        fiberG: Number(body.fiberG) || 25,
        waterGoalMl: Number(body.waterMl) || 2500,
      },
      update: {
        dailyCalories,
        proteinG,
        carbsG,
        fatG,
        waterMl: Number(body.waterMl) || 2500,
        fiberG: Number(body.fiberG) || 25,
        waterGoalMl: Number(body.waterMl) || 2500,
        updatedAt: new Date(),
      },
    })

    // Award achievement for setting goal
    try {
      const { checkAndAwardAchievements } = await import('@/lib/achievements/checker')
      await checkAndAwardAchievements(user.id, 'goal_set')
    } catch (e) {
      console.error('[nutrition/goal PUT] Achievement check failed:', e)
    }

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('[nutrition/goal PUT]', error)
    return NextResponse.json(
      {
        error: 'Failed to update nutrition goal',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
