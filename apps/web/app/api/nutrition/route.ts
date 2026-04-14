import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { checkAndAwardAchievements } from '@/lib/achievements/checker'

// Öğün kaydet
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()
    const {
      mealType,
      items,
      totalCalories,
      totalProteinG,
      totalCarbsG,
      totalFatG,
      notes,
      photoUrl,
      aiAnalyzed,
    } = body

    const meal = await db.mealLog.create({
      data: {
        userId: user.id,
        mealType: mealType ?? 'snack',
        items: items ?? [],
        totalCalories: totalCalories ?? 0,
        totalProteinG: totalProteinG ?? 0,
        totalCarbsG: totalCarbsG ?? 0,
        totalFatG: totalFatG ?? 0,
        notes,
        photoUrl,
        aiAnalyzed: aiAnalyzed ?? false,
      },
    })

    checkAndAwardAchievements(user.id, 'meal_logged').catch(() => {})

    return NextResponse.json({ success: true, meal })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Bugünkü öğünleri getir
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const meals = await db.mealLog.findMany({
      where: {
        userId: user.id,
        loggedAt: { gte: today, lt: tomorrow },
      },
      orderBy: { loggedAt: 'asc' },
    })

    const nutritionGoal = await db.nutritionGoal.findUnique({
      where: { userId: user.id },
    })

    return NextResponse.json({ meals, nutritionGoal })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
