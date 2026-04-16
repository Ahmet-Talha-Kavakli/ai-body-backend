import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import webPush from 'web-push'

export async function GET(req: NextRequest) {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  if (vapidPublic && vapidPrivate) {
    webPush.setVapidDetails(
      process.env.VAPID_EMAIL ?? 'mailto:admin@example.com',
      vapidPublic,
      vapidPrivate
    )
  }
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const prefs = await db.notificationPreference.findMany({
    where: { smartCalorie: true, webPushEnabled: true, webPushEndpoint: { not: null } },
    include: {
      user: {
        select: {
          mealLogs: {
            where: { loggedAt: { gte: today } },
            select: { totalCalories: true },
          },
          nutritionGoal: { select: { dailyCalories: true } },
        },
      },
    },
  })

  let sent = 0
  for (const pref of prefs) {
    const total = pref.user.mealLogs.reduce((s, m) => s + m.totalCalories, 0)
    const goal = pref.user.nutritionGoal?.dailyCalories ?? 2000
    const remaining = goal - total
    if (remaining <= 0) continue

    const payload = JSON.stringify({
      title: 'Günlük Hedefin',
      body: `Hedefe ulaşmak için ${remaining} kcal kaldı. Sağlıklı bir öğün planla!`,
    })

    try {
      await webPush.sendNotification(
        {
          endpoint: pref.webPushEndpoint!,
          keys: { auth: pref.webPushAuth!, p256dh: pref.webPushP256dh! },
        },
        payload
      )
      sent++
    } catch {
      // Geçersiz token — sessizce geç
    }
  }

  return NextResponse.json({ sent })
}
