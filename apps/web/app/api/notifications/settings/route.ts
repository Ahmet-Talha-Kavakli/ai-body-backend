import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

const DEFAULTS = {
  waterReminder: true,
  mealReminder: true,
  medicationReminder: true,
  sleepReminder: true,
  workoutReminder: true,
  petNotification: true,
  streakWarning: true,
  achievementAlert: true,
  roadmapUpdate: true,
}

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const prefs = await db.notificationPreference.findFirst({ where: { userId: user.id } })
  if (!prefs) return NextResponse.json(DEFAULTS)
  return NextResponse.json({
    waterReminder: prefs.waterReminder,
    mealReminder: prefs.mealReminder,
    medicationReminder: prefs.medicationReminder,
    sleepReminder: prefs.sleepReminder,
    workoutReminder: prefs.workoutReminder,
    petNotification: prefs.petNotification,
    streakWarning: prefs.streakWarning,
    achievementAlert: prefs.achievementAlert,
    roadmapUpdate: prefs.roadmapUpdate,
  })
})

export const PUT = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as Record<string, boolean>

  const data = {
    waterReminder: body.waterReminder ?? true,
    mealReminder: body.mealReminder ?? true,
    medicationReminder: body.medicationReminder ?? true,
    sleepReminder: body.sleepReminder ?? true,
    workoutReminder: body.workoutReminder ?? true,
    petNotification: body.petNotification ?? true,
    streakWarning: body.streakWarning ?? true,
    achievementAlert: body.achievementAlert ?? true,
    roadmapUpdate: body.roadmapUpdate ?? true,
  }

  await db.notificationPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  })

  return NextResponse.json({ success: true })
})
