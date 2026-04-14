import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const prefs = await db.notificationPreference.findUnique({ where: { userId: user.id } })
    return NextResponse.json({
      prefs: prefs ?? {
        webPushEnabled: false,
        mobilePushEnabled: false,
        waterReminder: true,
        mealReminder: true,
        smartCalorie: true,
      },
    })
  } catch {
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
    const { waterReminder, mealReminder, smartCalorie } = body

    await db.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, waterReminder, mealReminder, smartCalorie },
      update: { waterReminder, mealReminder, smartCalorie },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
