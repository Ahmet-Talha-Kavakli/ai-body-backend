import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { createNotification } from '@/lib/notifications/create-notification'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const prefs = await db.notificationPreference.findMany({
    where: {
      OR: [{ medicationReminder: true }, { sleepReminder: true }, { workoutReminder: true }],
    },
    select: {
      userId: true,
      medicationReminder: true,
      sleepReminder: true,
      workoutReminder: true,
    },
  })

  let sent = 0

  for (const pref of prefs) {
    try {
      if (pref.medicationReminder) {
        await createNotification(pref.userId, {
          type: 'medication',
          title: 'İlaç Vakti 💊',
          body: 'Günlük ilaçlarını almayı unutma.',
          link: '/dashboard/supplements',
        })
        sent++
      }
      if (pref.sleepReminder) {
        await createNotification(pref.userId, {
          type: 'sleep',
          title: 'Uyku Kaliteni Takip Et 🌙',
          body: 'Dün gece kaç saat uyudun? Verilerini kaydet.',
          link: '/dashboard/health',
        })
        sent++
      }
      if (pref.workoutReminder) {
        await createNotification(pref.userId, {
          type: 'workout',
          title: 'Antrenman Günü! 💪',
          body: 'Bugün antrenman planında var. Hazır mısın?',
          link: '/dashboard/workouts',
        })
        sent++
      }
    } catch (err) {
      console.error(`[cron/daily] failed for userId=${pref.userId}`, err)
    }
  }

  return NextResponse.json({ ok: true, sent })
}
