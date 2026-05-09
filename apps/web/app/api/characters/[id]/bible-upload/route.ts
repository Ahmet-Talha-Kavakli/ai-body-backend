import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { scrubBible } from '@/lib/marketplace/bible-scrub'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params!
  const character = await db.character.findFirst({
    where: { id, creatorId: user.id },
    select: { id: true, publishStatus: true },
  })
  if (!character) return NextResponse.json({ error: 'Karakter bulunamadı' }, { status: 404 })
  if (character.publishStatus !== 'draft' && character.publishStatus !== 'private') {
    return NextResponse.json({ error: 'Yayında olan karaktere bible eklenemez' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const rawText = body.rawText
  if (!rawText || typeof rawText !== 'string' || rawText.length < 50) {
    return NextResponse.json({ error: 'Bible metni en az 50 karakter olmalı' }, { status: 400 })
  }
  const result = await scrubBible(rawText)
  if (result.decision === 'hard_block') {
    return NextResponse.json(
      { decision: 'hard_block', reason: result.reason, flags: result.flags },
      { status: 422 }
    )
  }
  const asset = await db.characterAsset.create({
    data: {
      characterId: id,
      type: 'bible_upload',
      url: '',
      metadata: {
        cleanedText: result.cleanedText,
        flags: result.flags,
        removedPII: result.removedPII,
        decision: result.decision,
        scrubbedAt: new Date().toISOString(),
      },
    },
    select: { id: true, type: true },
  })
  return NextResponse.json({
    asset,
    decision: result.decision,
    cleanedText: result.cleanedText,
    flags: result.flags,
    removedPII: result.removedPII,
    reason: result.reason,
  })
})
