import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

// GET — kullanıcının notification ayarları
export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const u = await db.user.findUnique({
    where: { id: user.id },
    select: {
      notificationsEnabled: true,
      quietHoursStart: true,
      quietHoursEnd: true,
      expoPushToken: true,
    },
  })
  return NextResponse.json({
    enabled: u?.notificationsEnabled ?? true,
    quietHoursStart: u?.quietHoursStart ?? null,
    quietHoursEnd: u?.quietHoursEnd ?? null,
    hasToken: !!u?.expoPushToken,
  })
})

// PATCH — ayarları güncelle
export const PATCH = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as {
    enabled?: boolean
    quietHoursStart?: number | null
    quietHoursEnd?: number | null
  }
  const data: Record<string, unknown> = {}
  if (typeof body.enabled === 'boolean') data.notificationsEnabled = body.enabled
  if (
    body.quietHoursStart === null ||
    (typeof body.quietHoursStart === 'number' &&
      body.quietHoursStart >= 0 &&
      body.quietHoursStart < 24)
  ) {
    data.quietHoursStart = body.quietHoursStart
  }
  if (
    body.quietHoursEnd === null ||
    (typeof body.quietHoursEnd === 'number' && body.quietHoursEnd >= 0 && body.quietHoursEnd < 24)
  ) {
    data.quietHoursEnd = body.quietHoursEnd
  }

  const u = await db.user.update({
    where: { id: user.id },
    data,
    select: {
      notificationsEnabled: true,
      quietHoursStart: true,
      quietHoursEnd: true,
    },
  })
  return NextResponse.json(u)
})
