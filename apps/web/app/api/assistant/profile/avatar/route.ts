/**
 * AI Avatar Generator — V3 Faz B (yaşlanma entegre, V3 Faz C)
 *
 * POST /api/assistant/profile/avatar
 *   Body: { regenerate?: boolean }
 *   - Avatar yoksa veya regenerate=true ise yeni avatar üretir (Blob'a kaydeder)
 *   - Mevcut avatar varsa onu döner
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { regenerateAvatar } from '@/lib/assistant/avatar-generator'

export const POST = withAuth(async (req, { user }) => {
  try {
    const body = (await req.json().catch(() => ({}))) as { regenerate?: boolean }

    const profile = await db.assistantProfile.findUnique({
      where: { userId: user.id },
      select: { avatarUrl: true },
    })

    if (!profile) {
      return NextResponse.json({ error: 'profile_not_found' }, { status: 404 })
    }

    if (profile.avatarUrl && !body.regenerate) {
      return NextResponse.json({ avatarUrl: profile.avatarUrl })
    }

    const result = await regenerateAvatar({
      userId: user.id,
      reason: profile.avatarUrl ? 'manual' : 'initial',
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.reason ?? 'failed' }, { status: 500 })
    }

    return NextResponse.json({ avatarUrl: result.url })
  } catch (e) {
    console.error('[avatar]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown' }, { status: 500 })
  }
})
