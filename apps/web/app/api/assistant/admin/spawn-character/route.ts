/**
 * V4 Test — Manuel karakter spawn (sadece admin)
 *
 * POST { templateKey: 'mia' | 'kerem' | 'selin' | 'ayse' | 'mehmet' }
 *
 * Trigger sistemini bypass eder, karakteri direkt yaratır + ilk mesajı atar.
 * Sadece test için.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { withAuth } from '@/lib/api/with-auth'
import { spawnCharacter } from '@/lib/assistant/character-spawn'
import { getCharacterTemplate } from '@/lib/assistant/character-templates'

const ADMIN_EMAIL = 'ahmettalhakavakli32@gmail.com'

export const POST = withAuth(async (req: NextRequest, { user }) => {
  if (user.email !== ADMIN_EMAIL) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const templateKey = body.templateKey as string

  const template = getCharacterTemplate(templateKey)
  if (!template) {
    return new NextResponse('Invalid templateKey', { status: 400 })
  }

  // Zaten var mı?
  const existing = await db.character.findFirst({
    where: { userId: user.id, name: template.name },
  })
  if (existing) {
    return NextResponse.json({
      ok: true,
      alreadyExists: true,
      characterId: existing.id,
    })
  }

  const characterId = await spawnCharacter(user.id, template)

  // İlk sohbet + ilk mesaj
  const conversation = await db.assistantConversation.create({
    data: {
      userId: user.id,
      characterId,
      title: template.name,
    },
  })

  await db.assistantMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'assistant',
      content: template.arrivalIntroLine,
    },
  })

  return NextResponse.json({
    ok: true,
    characterId,
    conversationId: conversation.id,
    introLine: template.arrivalIntroLine,
  })
})
