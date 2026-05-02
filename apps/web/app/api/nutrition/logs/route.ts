import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { checkRateLimit } from '@/lib/nutrition/rate-limit'

/**
 * GET /api/nutrition/logs?date=2026-04-29
 * Get meal logs for a specific date with macro summary
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

    const dateParam = req.nextUrl.searchParams.get('date')
    let date = new Date()

    if (dateParam) {
      const parsed = new Date(dateParam)
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
      }
      date = parsed
    }

    // Query for the specific day
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const meals = await db.mealLog.findMany({
      where: {
        userId: user.id,
        loggedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { loggedAt: 'asc' },
      include: {
        analysis: true,
      },
    })

    // Calculate daily summary
    const summary = {
      totalCalories: meals.reduce((sum, m) => sum + m.totalCalories, 0),
      totalProteinG: meals.reduce((sum, m) => sum + m.totalProteinG, 0),
      totalCarbsG: meals.reduce((sum, m) => sum + m.totalCarbsG, 0),
      totalFatG: meals.reduce((sum, m) => sum + m.totalFatG, 0),
      mealCount: meals.length,
    }

    const goal = await db.nutritionGoal.findUnique({
      where: { userId: user.id },
    })

    return NextResponse.json({
      date: date.toISOString().split('T')[0],
      meals,
      summary,
      goal,
    })
  } catch (error) {
    console.error('[nutrition/logs GET]', error)
    return NextResponse.json({ error: 'Failed to fetch meal logs' }, { status: 500 })
  }
}

/**
 * POST /api/nutrition/logs
 * Create a new meal log
 * Body: { mealType, items[], totalCalories, totalProteinG, totalCarbsG, totalFatG, notes?, photoUrl? }
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

    // Rate limiting: 50 meal logs per day per user
    const rateLimitKey = `nutrition_log:${user.id}:${new Date().toDateString()}`
    if (!checkRateLimit(rateLimitKey, 50, 24 * 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many meal logs today. Limit is 50 per day.' },
        { status: 429 }
      )
    }

    const body = await req.json()

    // Validate required fields
    if (!body.mealType) {
      return NextResponse.json({ error: 'mealType is required' }, { status: 400 })
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'items array is required and must not be empty' },
        { status: 400 }
      )
    }

    const totalCalories = Number(body.totalCalories) || 0
    const totalProteinG = Number(body.totalProteinG) || 0
    const totalCarbsG = Number(body.totalCarbsG) || 0
    const totalFatG = Number(body.totalFatG) || 0

    if (totalCalories < 0 || totalProteinG < 0 || totalCarbsG < 0 || totalFatG < 0) {
      return NextResponse.json({ error: 'Nutrition values cannot be negative' }, { status: 400 })
    }

    // Create meal log
    const meal = await db.mealLog.create({
      data: {
        userId: user.id,
        mealType: body.mealType,
        items: body.items,
        totalCalories,
        totalProteinG,
        totalCarbsG,
        totalFatG,
        notes: body.notes || null,
        photoUrl: body.photoUrl || null,
        aiAnalyzed: body.aiAnalyzed || false,
      },
      include: {
        analysis: true,
      },
    })

    // Award achievement for meal logging
    try {
      const { checkAndAwardAchievements } = await import('@/lib/achievements/checker')
      await checkAndAwardAchievements(user.id, 'meal_logged')
    } catch (e) {
      console.error('[nutrition/logs POST] Achievement check failed:', e)
    }

    return NextResponse.json({ success: true, meal }, { status: 201 })
  } catch (error) {
    console.error('[nutrition/logs POST]', error)
    return NextResponse.json(
      {
        error: 'Failed to create meal log',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
