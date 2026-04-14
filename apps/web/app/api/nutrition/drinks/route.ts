import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

const VALID_DRINK_TYPES = ['coffee', 'tea', 'juice', 'milk', 'energy'] as const
type DrinkType = (typeof VALID_DRINK_TYPES)[number]

function todayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { start, end } = todayRange()
    const logs = await db.drinkLog.findMany({
      where: { userId: user.id, date: { gte: start, lte: end } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ logs })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { drinkType, amountMl } = await req.json()

    if (!VALID_DRINK_TYPES.includes(drinkType as DrinkType)) {
      return NextResponse.json({ error: 'Invalid drinkType' }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const log = await db.drinkLog.create({
      data: { userId: user.id, date: today, drinkType, amountMl },
    })

    return NextResponse.json({ success: true, log })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { id } = await req.json()
    const log = await db.drinkLog.findUnique({ where: { id } })

    if (!log || log.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await db.drinkLog.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
