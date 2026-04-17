import { db } from '@/lib/db/client'
import type { NotificationType } from '@prisma/client'
import webPush from 'web-push'

const PREFERENCE_FIELD: Partial<Record<NotificationType, string>> = {
  water: 'waterReminder',
  meal: 'mealReminder',
  medication: 'medicationReminder',
  sleep: 'sleepReminder',
  workout: 'workoutReminder',
  pet: 'petNotification',
  streak: 'streakWarning',
  achievement: 'achievementAlert',
  roadmap: 'roadmapUpdate',
}

interface NotificationPayload {
  type: NotificationType
  title: string
  body: string
  link?: string
}

export async function createNotification(
  userId: string,
  payload: NotificationPayload
): Promise<void> {
  await db.notification.create({
    data: {
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      link: payload.link,
      read: false,
    },
  })

  const prefs = await db.notificationPreference.findUnique({ where: { userId } })
  if (!prefs) return

  const prefField = PREFERENCE_FIELD[payload.type]
  const toggleOn = payload.type === 'system' || (prefField && (prefs as any)[prefField] === true)
  if (!toggleOn) return

  if (!prefs.webPushEnabled || !prefs.webPushEndpoint || !prefs.webPushAuth || !prefs.webPushP256dh)
    return

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  if (!vapidPublic || !vapidPrivate) return

  webPush.setVapidDetails(
    process.env.VAPID_EMAIL ?? 'mailto:admin@example.com',
    vapidPublic,
    vapidPrivate
  )

  try {
    await webPush.sendNotification(
      {
        endpoint: prefs.webPushEndpoint,
        keys: { auth: prefs.webPushAuth, p256dh: prefs.webPushP256dh },
      },
      JSON.stringify({ title: payload.title, body: payload.body, link: payload.link })
    )
  } catch (err) {
    console.error('[createNotification] push failed', err)
  }
}
