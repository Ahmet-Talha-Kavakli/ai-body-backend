import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

function todayDate() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const log = await db.waterLog.findUnique({
      where: { userId_date: { userId: user.id, date: todayDate() } },
    })
    const settings = await db.waterSettings.findUnique({ where: { userId: user.id } })

    return NextResponse.json({
      glasses: log?.glasses ?? 0,
      amountMl: log?.amountMl ?? 0,
      dailyGoalMl: settings?.dailyGoalMl ?? 2500,
      cupSizeMl: settings?.cupSizeMl ?? 200,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()
    const settings = await db.waterSettings.findUnique({ where: { userId: user.id } })
    const cupSizeMl = settings?.cupSizeMl ?? 200
    const dailyGoalMl = settings?.dailyGoalMl ?? 2500

    let addMl: number
    if (body.ml !== undefined) {
      addMl = body.ml
    } else {
      addMl = (body.glasses ?? 1) * cupSizeMl
    }

    const today = todayDate()
    const existing = await db.waterLog.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    })

    const newAmountMl = Math.max(0, (existing?.amountMl ?? 0) + addMl)
    const newGlasses = Math.round(newAmountMl / cupSizeMl)

    const log = await db.waterLog.upsert({
      where: { userId_date: { userId: user.id, date: today } },
      create: { userId: user.id, date: today, glasses: newGlasses, amountMl: newAmountMl },
      update: { glasses: newGlasses, amountMl: newAmountMl },
    })

    // Streak güncelle
    if (newAmountMl >= dailyGoalMl) {
      const streak = await db.waterStreak.findUnique({ where: { userId: user.id } })
      const lastGoal = streak?.lastGoalDate
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const isConsecutive = lastGoal && lastGoal.toDateString() === yesterday.toDateString()
      const newCurrent = isConsecutive ? (streak?.currentStreak ?? 0) + 1 : 1
      const newLongest = Math.max(newCurrent, streak?.longestStreak ?? 0)
      const alreadyCountedToday = lastGoal?.toDateString() === today.toDateString()
      const newTotal = (streak?.totalDaysGoal ?? 0) + (alreadyCountedToday ? 0 : 1)

      await db.waterStreak.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          currentStreak: newCurrent,
          longestStreak: newLongest,
          lastGoalDate: today,
          totalDaysGoal: 1,
        },
        update: {
          currentStreak: newCurrent,
          longestStreak: newLongest,
          lastGoalDate: today,
          totalDaysGoal: newTotal,
        },
      })
    }

    return NextResponse.json({ success: true, glasses: log.glasses, amountMl: log.amountMl })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()
    const settings = await db.waterSettings.findUnique({ where: { userId: user.id } })
    const cupSizeMl = settings?.cupSizeMl ?? 200
    const removeMl = body.ml ?? cupSizeMl

    const today = todayDate()
    const existing = await db.waterLog.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    })

    const newAmountMl = Math.max(0, (existing?.amountMl ?? 0) - removeMl)
    const newGlasses = Math.round(newAmountMl / cupSizeMl)

    const log = await db.waterLog.upsert({
      where: { userId_date: { userId: user.id, date: today } },
      create: { userId: user.id, date: today, glasses: newGlasses, amountMl: newAmountMl },
      update: { glasses: newGlasses, amountMl: newAmountMl },
    })

    return NextResponse.json({ success: true, glasses: log.glasses, amountMl: log.amountMl })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
