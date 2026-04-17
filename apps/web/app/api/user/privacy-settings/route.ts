import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const settings = await db.userPrivacySettings.findUnique({
      where: { userId: user.id },
    })

    return NextResponse.json({
      settings: settings ?? {
        collectWorkout: true,
        collectNutrition: true,
        analytics: true,
        marketingEmails: false,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const { collectWorkout, collectNutrition, analytics, marketingEmails } = body

    const data: Record<string, boolean> = {}
    if (collectWorkout !== undefined) data.collectWorkout = collectWorkout
    if (collectNutrition !== undefined) data.collectNutrition = collectNutrition
    if (analytics !== undefined) data.analytics = analytics
    if (marketingEmails !== undefined) data.marketingEmails = marketingEmails

    const updated = await db.userPrivacySettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    })

    return NextResponse.json({ success: true, settings: updated })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
