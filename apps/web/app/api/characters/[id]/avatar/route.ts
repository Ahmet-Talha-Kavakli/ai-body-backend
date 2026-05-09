/**
 * V4.8 Faz E — Karakter Avatar Üret
 *
 * POST /api/characters/:id/avatar
 * Body: { userPrompt: string }
 *
 * DALL-E 3 portrait üretir, Blob'a kaydeder, Character.masterAvatarUrl set eder.
 * Sadece draft + private. Yayında olan karakter avatar değiştiremez.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { generateCharacterAvatar } from '@/lib/marketplace/avatar-generator'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params!
  const character = await db.character.findFirst({
    where: { id, creatorId: user.id },
    select: {
      id: true,
      name: true,
      age: true,
      gender: true,
      bio: true,
      hometown: true,
      category: true,
      publishStatus: true,
    },
  })
  if (!character) return NextResponse.json({ error: 'Karakter bulunamadı' }, { status: 404 })
  if (character.publishStatus !== 'draft' && character.publishStatus !== 'private') {
    return NextResponse.json(
      { error: 'Yayında olan karakter avatar değiştiremez' },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const userPrompt = body.userPrompt
  if (!userPrompt || typeof userPrompt !== 'string') {
    return NextResponse.json({ error: 'userPrompt gerekli' }, { status: 400 })
  }

  const result = await generateCharacterAvatar({
    characterId: id,
    userPrompt,
    characterContext: {
      name: character.name,
      age: character.age,
      gender: character.gender,
      category: character.category,
      bio: character.bio,
      hometown: character.hometown,
    },
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 422 })
  }
  return NextResponse.json({ url: result.url, refinedPrompt: result.refinedPrompt })
})
