import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const entries = await db.weightEntry.findMany({
      where: { userId: user.id },
      orderBy: { recordedAt: 'desc' },
      take: 90,
    })
    return NextResponse.json(entries)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { weightKg, note } = await req.json()
    if (!weightKg || weightKg < 20 || weightKg > 300) {
      return NextResponse.json({ error: 'Invalid weight' }, { status: 400 })
    }

    const entry = await db.weightEntry.create({
      data: { userId: user.id, weightKg, note },
    })
    return NextResponse.json(entry)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
