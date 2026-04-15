import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const prefs = await db.notificationPreference.findFirst({ where: { userId: user.id } })
  if (!prefs) return NextResponse.json({})
  return NextResponse.json({
    waterReminder: prefs.waterReminder,
    // These fields don't exist in the schema yet — return defaults
    medicationReminder: true,
    sleepReminder: true,
    workoutReminder: true,
    petNotification: true,
    roadmapUpdate: true,
    achievementAlert: true,
    streakWarning: true,
  })
})

export const PUT = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as Record<string, boolean>

  // Only persist fields that exist in the NotificationPreference schema
  await db.notificationPreference.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      waterReminder: body.waterReminder ?? true,
    },
    update: {
      waterReminder: body.waterReminder ?? true,
    },
  })

  return NextResponse.json({ success: true })
})
