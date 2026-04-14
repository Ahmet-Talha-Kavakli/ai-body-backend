import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { computeNewStreak } from '@/lib/nutrition/streak'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const streak = await db.nutritionStreak.findUnique({ where: { userId: user.id } })
    return NextResponse.json({
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      lastLogDate: streak?.lastLogDate ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const existing = await db.nutritionStreak.findUnique({ where: { userId: user.id } })
    const state = {
      currentStreak: existing?.currentStreak ?? 0,
      longestStreak: existing?.longestStreak ?? 0,
      lastLogDate: existing?.lastLogDate?.toISOString() ?? null,
    }
    const newState = computeNewStreak(state, new Date())

    const streak = await db.nutritionStreak.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...newState },
      update: newState,
    })

    return NextResponse.json(streak)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
