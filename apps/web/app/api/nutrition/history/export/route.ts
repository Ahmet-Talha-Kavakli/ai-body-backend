import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const meals = await db.mealLog.findMany({
      where: { userId: user.id, loggedAt: { gte: thirtyDaysAgo } },
      select: {
        loggedAt: true,
        mealType: true,
        totalCalories: true,
        totalProteinG: true,
        totalCarbsG: true,
        totalFatG: true,
      },
      orderBy: { loggedAt: 'asc' },
    })

    const header = 'Date,MealType,Calories,ProteinG,CarbsG,FatG'
    const rows = meals.map(
      (m) =>
        `${m.loggedAt.toISOString().slice(0, 10)},${m.mealType},${m.totalCalories},${m.totalProteinG},${m.totalCarbsG},${m.totalFatG}`
    )
    const csv = [header, ...rows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="nutrition-history.csv"',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
