import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const goal = await db.nutritionGoal.findUnique({ where: { userId: user.id } })
    return NextResponse.json({ goal })
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

    const body = await req.json()

    const goal = await db.nutritionGoal.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...body },
      update: body,
    })

    return NextResponse.json({ goal })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const body = await req.json()
    const goal = await db.nutritionGoal.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...body },
      update: body,
    })
    return NextResponse.json({ goal })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
