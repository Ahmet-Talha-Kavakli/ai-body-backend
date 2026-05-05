/**
 * V4 Faz F — Grup Cevap Dispatcher
 *
 * ScheduledGroupMessage tablosundaki `pending` mesajlardan zamanı geçenleri
 * süzer, her biri için karakter cevabını üretir, GroupMessage'a yazar,
 * sonrasında 1-hop reaktivite tetikler.
 *
 * Hobby plan: günde 1 cron izni. Bu cron 30sn-1dk frekansında çalışmalı (Pro).
 * Şimdilik:
 *   - Lokal test: manuel curl `/api/cron/group-reply-dispatcher`
 *   - Production: Pro upgrade sonrası vercel.json'a ekle
 *
 * Race koruma: status='pending' WHERE updateMany ile claim, count=0 ise atla.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { generateGroupReply } from '@/lib/assistant/group-reply'
import { triggerReactivity } from '@/lib/assistant/group-reactivity'
import { invalidateCache } from '@/lib/redis/client'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Vercel cron auth (CRON_SECRET varsa zorunlu, lokal test için boş bırakılabilir)
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const now = new Date()
  // Fairness + timeout koruma — her cron'da max 20
  const pending = await db.scheduledGroupMessage.findMany({
    where: { status: 'pending', scheduledFor: { lte: now } },
    orderBy: { scheduledFor: 'asc' },
    take: 20,
  })

  let sent = 0
  let failed = 0
  let cancelled = 0
  let reactivityScheduled = 0

  for (const sched of pending) {
    try {
      // Race claim — sadece pending olanı yakala (paralel cron koşusu güvenli)
      const claimed = await db.scheduledGroupMessage.updateMany({
        where: { id: sched.id, status: 'pending' },
        data: { status: 'sent', sentAt: new Date() },
      })
      if (claimed.count === 0) continue

      const reply = await generateGroupReply({
        characterId: sched.characterId,
        groupId: sched.groupId,
        triggerMessageId: sched.triggerMessageId,
      })

      if (!reply) {
        await db.scheduledGroupMessage.update({
          where: { id: sched.id },
          data: { status: 'cancelled' },
        })
        cancelled++
        continue
      }

      const created = await db.groupMessage.create({
        data: {
          groupId: sched.groupId,
          senderType: 'character',
          senderCharacterId: sched.characterId,
          content: reply.content,
          repliedToMessageId: sched.triggerMessageId,
        },
      })
      const groupOwner = await db.groupConversation.update({
        where: { id: sched.groupId },
        data: { updatedAt: new Date() },
        select: { userId: true },
      })
      // V4.5 Perf: liste cache invalidate
      invalidateCache(`groups:list:${groupOwner.userId}`).catch(() => {})

      // 1-hop reaktivite — diğer üyeler bu mesaja tepki verir mi?
      const r = await triggerReactivity({
        groupId: sched.groupId,
        newMessageId: created.id,
        newMessageContent: reply.content,
        speakerCharacterId: sched.characterId,
      })
      if ('scheduled' in r) reactivityScheduled += r.scheduled

      sent++
    } catch (e) {
      console.error('[cron group-reply-dispatcher]', e)
      failed++
    }
  }

  return NextResponse.json({
    checked: pending.length,
    sent,
    failed,
    cancelled,
    reactivityScheduled,
  })
}
