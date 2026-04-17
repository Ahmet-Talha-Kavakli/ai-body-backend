import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { createNotification } from '@/lib/notifications/create-notification'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const prefs = await db.notificationPreference.findMany({
    where: { waterReminder: true },
    select: { userId: true },
  })

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
  let sent = 0

  for (const { userId } of prefs) {
    try {
      const lastWater = await db.notification.findFirst({
        where: { userId, type: 'water' },
        orderBy: { createdAt: 'desc' },
      })

      if (lastWater && lastWater.createdAt > twoHoursAgo) continue

      await createNotification(userId, {
        type: 'water',
        title: 'Su İçme Vakti! 💧',
        body: 'Günlük su hedefine ulaşmak için bir bardak su iç.',
        link: '/dashboard/health',
      })
      sent++
    } catch (err) {
      console.error(`[cron/water] failed for userId=${userId}`, err)
    }
  }

  return NextResponse.json({ ok: true, sent })
}
