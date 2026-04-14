import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const templates = await db.mealTemplate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ templates })
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
    const { name, mealType, items, totalCalories, totalProteinG, totalCarbsG, totalFatG } = body

    const template = await db.mealTemplate.create({
      data: {
        userId: user.id,
        name,
        mealType,
        items: items ?? [],
        totalCalories,
        totalProteinG,
        totalCarbsG,
        totalFatG,
      },
    })

    return NextResponse.json({ template })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
