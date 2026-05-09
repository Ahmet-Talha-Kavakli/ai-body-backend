/**
 * V4.8 Faz C — Şikayet Sistemi
 *
 * POST /api/marketplace/report
 * Body: { characterId, reason, detail? }
 *
 * 3+ rapor gelirse karakter otomatik askıya alınır.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

const VALID_REASONS = ['real_person', 'nsfw', 'harassment', 'low_quality', 'copy_claim', 'other']
const SUSPEND_THRESHOLD = 3

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json().catch(() => ({}))
  const { characterId, reason, detail } = body

  if (!characterId || typeof characterId !== 'string') {
    return NextResponse.json({ error: 'characterId gerekli' }, { status: 400 })
  }
  if (!reason || !VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: `reason: ${VALID_REASONS.join(', ')}` }, { status: 400 })
  }

  const character = await db.character.findUnique({
    where: { id: characterId },
    select: { id: true, creatorId: true, publishStatus: true },
  })
  if (!character) return NextResponse.json({ error: 'Karakter bulunamadı' }, { status: 404 })
  if (character.creatorId === user.id) {
    return NextResponse.json({ error: 'Kendi karakterini şikayet edemezsin' }, { status: 400 })
  }

  // Aynı kullanıcı aynı karakter için 1 kez şikayet
  const existing = await db.creatorReport.findFirst({
    where: { reporterId: user.id, characterId, resolved: false },
  })
  if (existing) {
    return NextResponse.json({ error: 'Zaten şikayet ettin', report: existing }, { status: 409 })
  }

  const report = await db.creatorReport.create({
    data: { reporterId: user.id, characterId, reason, detail: detail ?? null },
  })

  // Açık şikayet sayısı kontrol
  const openCount = await db.creatorReport.count({
    where: { characterId, resolved: false },
  })

  let suspended = false
  if (openCount >= SUSPEND_THRESHOLD && character.publishStatus === 'published') {
    await db.character.update({
      where: { id: characterId },
      data: { publishStatus: 'suspended' },
    })
    await db.moderationCase.create({
      data: {
        targetType: 'character',
        targetId: characterId,
        reason: `Auto-suspended (${openCount} reports)`,
        status: 'open',
      },
    })
    suspended = true
  }

  return NextResponse.json({ report: { id: report.id }, suspended })
})
