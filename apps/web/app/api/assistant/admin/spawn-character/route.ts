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

const ADMIN_EMAILS = ['ahmettalhakavakli32@gmail.com', 'atalhakavakli@gmail.com']

export const POST = withAuth(async (req: NextRequest, { user }) => {
  if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const templateKey = body.templateKey as string

  // 'all' → Mia + Kerem + Selin + Ayşe (Mehmet hariç — gizli arc karakteri)
  if (templateKey === 'all') {
    const keys = ['mia', 'kerem', 'selin', 'ayse']
    const results: Array<{ key: string; characterId: string; alreadyExists: boolean }> = []
    for (const key of keys) {
      const template = getCharacterTemplate(key)
      if (!template) continue
      const existing = await db.character.findFirst({
        where: { userId: user.id, name: template.name },
      })
      if (existing) {
        results.push({ key, characterId: existing.id, alreadyExists: true })
        continue
      }
      const characterId = await spawnCharacter(user.id, template)
      const conversation = await db.assistantConversation.create({
        data: { userId: user.id, characterId, title: template.name },
      })
      await db.assistantMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: template.arrivalIntroLine,
        },
      })
      results.push({ key, characterId, alreadyExists: false })
    }
    return NextResponse.json({ ok: true, spawned: results })
  }

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
