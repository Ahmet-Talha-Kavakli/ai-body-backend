/**
 * Asistan'ın native sistemlere izinleri.
 *   GET  /api/assistant/permissions — tüm izinler ve durumları
 *   POST /api/assistant/permissions — izni güncelle (mobile native prompt sonrası çağırır)
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

const VALID_CAPABILITIES = [
  'healthkit',
  'calendar_read',
  'calendar_write',
  'reminders_read',
  'reminders_write',
  'contacts',
  'music',
  'location_assistant',
  'photos',
]

const VALID_STATUSES = ['not_asked', 'granted', 'denied', 'revoked']

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const perms = await db.assistantPermission.findMany({
    where: { userId: user.id },
    select: { capability: true, status: true, grantedAt: true },
  })
  // Tüm capability'leri (yoksa not_asked olarak) döndür
  const map = new Map(perms.map((p) => [p.capability, p]))
  const all = VALID_CAPABILITIES.map((cap) => {
    const p = map.get(cap)
    return {
      capability: cap,
      status: p?.status ?? 'not_asked',
      grantedAt: p?.grantedAt ?? null,
    }
  })
  return NextResponse.json({ permissions: all })
})

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as { capability: string; status: string }
  if (!VALID_CAPABILITIES.includes(body.capability)) {
    return NextResponse.json({ error: 'invalid_capability' }, { status: 400 })
  }
  if (!VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'invalid_status' }, { status: 400 })
  }
  const data: Record<string, unknown> = { status: body.status }
  if (body.status === 'granted') data.grantedAt = new Date()
  if (body.status === 'denied' || body.status === 'revoked') data.deniedAt = new Date()

  const updated = await db.assistantPermission.upsert({
    where: { userId_capability: { userId: user.id, capability: body.capability } },
    create: {
      userId: user.id,
      capability: body.capability,
      status: body.status,
      ...(body.status === 'granted' ? { grantedAt: new Date() } : {}),
      ...(body.status === 'denied' || body.status === 'revoked' ? { deniedAt: new Date() } : {}),
    },
    update: data,
  })
  return NextResponse.json({ ok: true, permission: updated })
})
