/**
 * V4 Test — Karakter avatar üretim tetikleyici (admin)
 * POST { characterId }
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { withAuth } from '@/lib/api/with-auth'
import { generateMasterAvatar } from '@/lib/assistant/character-avatar'

const ADMIN_EMAIL = 'ahmettalhakavakli32@gmail.com'

export const POST = withAuth(async (req: NextRequest, { user }) => {
  if (user.email !== ADMIN_EMAIL) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const characterId = body.characterId as string

  const character = await db.character.findFirst({
    where: { id: characterId, userId: user.id },
    select: { id: true, name: true, masterAvatarUrl: true },
  })
  if (!character) return new NextResponse('Not found', { status: 404 })

  if (character.masterAvatarUrl) {
    return NextResponse.json({
      ok: true,
      alreadyHasAvatar: true,
      url: character.masterAvatarUrl,
    })
  }

  const result = await generateMasterAvatar({
    templateKey: character.name.toLowerCase(),
    characterId: character.id,
  })

  if (!result) {
    return NextResponse.json({ ok: false, error: 'generation_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, url: result.url })
})
