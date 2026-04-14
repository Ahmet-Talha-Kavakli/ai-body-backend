import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const meals = await db.mealLog.findMany({
      where: { userId: user.id },
      select: { items: true },
      orderBy: { loggedAt: 'desc' },
      take: 50,
    })

    const seen = new Set<string>()
    const recentFoods: unknown[] = []
    for (const meal of meals) {
      const items = meal.items as Array<{ name: string; calories: number }>
      for (const item of items) {
        if (!seen.has(item.name) && recentFoods.length < 10) {
          seen.add(item.name)
          recentFoods.push(item)
        }
      }
    }

    return NextResponse.json({ recentFoods })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
