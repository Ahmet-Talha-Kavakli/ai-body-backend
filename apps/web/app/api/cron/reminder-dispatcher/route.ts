/**
 * V4.7 B3 — Reminder Dispatcher (saatte 1, dev'de poller tetikler)
 *
 * Yapı:
 *   - CharacterReminder where status='pending' AND scheduledFor <= now()
 *   - Her biri için: ScheduledCharacterMessage oluştur (push notif kanalı zaten Expo'dan tetikleniyor)
 *   - status='sent', pushSentAt=now()
 *
 * Mesaj tonu karaktere özgü, "yatağından çık dostum 🌞" / "saat oldu, kalksana".
 *
 * Lokal: curl http://localhost:3000/api/cron/reminder-dispatcher
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export const maxDuration = 120

const WAKE_VARIANTS = [
  'kalksana hadi 🌞',
  'günaydın, vakit geldi',
  'yataktan çık bakalım, saat oldu',
  'hadi uyandım dedin, kalk',
]

const REMIND_VARIANTS = ['unutma — {topic}', 'hatırlatıyorum: {topic}', '{topic} — şimdi vakti']

function pickMessage(topic: string): string {
  // Heuristic: "uyandır" / "kalk" geçiyorsa wake variant
  if (/uyandır|kalk|sabah|günaydın/i.test(topic)) {
    return WAKE_VARIANTS[Math.floor(Math.random() * WAKE_VARIANTS.length)]
  }
  const t = REMIND_VARIANTS[Math.floor(Math.random() * REMIND_VARIANTS.length)]
  return t.replace('{topic}', topic)
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (
    cronSecret &&
    authHeader !== `Bearer ${cronSecret}` &&
    process.env.NODE_ENV === 'production'
  ) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const now = new Date()

  const due = await db.characterReminder.findMany({
    where: { status: 'pending', scheduledFor: { lte: now } },
    take: 100,
  })

  let dispatched = 0
  let skipped = 0

  for (const r of due) {
    const conv = await db.assistantConversation.findFirst({
      where: { userId: r.userId, characterId: r.characterId, archived: false },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    })
    if (!conv) {
      await db.characterReminder.update({
        where: { id: r.id },
        data: { status: 'cancelled' },
      })
      skipped++
      continue
    }

    await db.scheduledCharacterMessage.create({
      data: {
        userId: r.userId,
        characterId: r.characterId,
        conversationId: conv.id,
        content: pickMessage(r.topic),
        scheduledFor: now,
        status: 'pending',
      },
    })

    await db.characterReminder.update({
      where: { id: r.id },
      data: { status: 'sent', pushSentAt: now },
    })
    dispatched++
  }

  return NextResponse.json({
    ok: true,
    due: due.length,
    dispatched,
    skipped,
    timestamp: now.toISOString(),
  })
}
