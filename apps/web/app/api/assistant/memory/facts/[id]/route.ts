/**
 * Manuel hafıza yönetimi:
 *   PATCH /api/assistant/memory/facts/:id — kullanıcı fact'i düzeltir → yeni version
 *   DELETE /api/assistant/memory/facts/:id — kullanıcı fact'i unutturur → tüm belief arşivlenir
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { createBeliefVersion } from '@/lib/assistant/memory'

export const PATCH = withAuth(async (req: NextRequest, { user, params }) => {
  const { id } = (await params) as { id: string }
  const body = (await req.json()) as { content?: string }
  const content = body.content?.trim()
  if (!content || content.length < 2) {
    return NextResponse.json({ error: 'invalid_content' }, { status: 400 })
  }

  const old = await db.assistantMemoryFact.findFirst({
    where: { id, userId: user.id },
  })
  if (!old) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (old.content === content) {
    return NextResponse.json({ ok: true, unchanged: true })
  }

  const newId = await createBeliefVersion({
    userId: user.id,
    category: old.category,
    content,
    confidence: 1.0,
    replaces: old.id,
  })

  return NextResponse.json({ ok: true, newId })
})

export const DELETE = withAuth(async (_req: NextRequest, { user, params }) => {
  const { id } = (await params) as { id: string }
  const fact = await db.assistantMemoryFact.findFirst({
    where: { id, userId: user.id },
  })
  if (!fact) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // Belief'in tüm versiyonlarını arşivle (kullanıcı "bunu unut" dedi)
  if (fact.beliefId) {
    await db.assistantMemoryFact.updateMany({
      where: { userId: user.id, beliefId: fact.beliefId, archived: false },
      data: { archived: true, archivedAt: new Date() },
    })
  } else {
    await db.assistantMemoryFact.update({
      where: { id },
      data: { archived: true, archivedAt: new Date() },
    })
  }

  return NextResponse.json({ ok: true })
})
