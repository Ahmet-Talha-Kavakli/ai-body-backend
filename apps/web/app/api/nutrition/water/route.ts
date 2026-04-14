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
    return NextResponse.json({ glasses: log?.glasses ?? 0 })
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
    const { glasses } = await req.json()
    const log = await db.waterLog.upsert({
      where: { userId_date: { userId: user.id, date: todayDate() } },
      create: { userId: user.id, date: todayDate(), glasses },
      update: { glasses },
    })
    return NextResponse.json({ glasses: log.glasses })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
