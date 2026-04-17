import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { createNotification } from '@/lib/notifications/create-notification'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const prefs = await db.notificationPreference.findMany({
    where: { streakWarning: true },
    select: { userId: true },
  })

  let sent = 0

  for (const { userId } of prefs) {
    try {
      const todaySession = await db.workoutSession.findFirst({
        where: { userId, startedAt: { gte: todayStart } },
      })

      if (todaySession) continue

      await createNotification(userId, {
        type: 'streak',
        title: 'Serini Koru! 🔥',
        body: 'Bugün henüz antrenman yapmadın. Serinini kırmamak için harekete geç!',
        link: '/dashboard/workouts',
      })
      sent++
    } catch (err) {
      console.error(`[cron/streak] failed for userId=${userId}`, err)
    }
  }

  return NextResponse.json({ ok: true, sent })
}
