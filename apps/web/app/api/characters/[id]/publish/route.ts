import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

const REQUIRED_FIELDS = ['name', 'age', 'gender', 'bio', 'hometown', 'archetype'] as const

type Ctx = { params: Promise<{ id: string }> }

export const POST = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params!
  const character = await db.character.findFirst({ where: { id, creatorId: user.id } })
  if (!character) return NextResponse.json({ error: 'Karakter bulunamadı' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const mode = body.mode as 'private' | 'marketplace'
  if (mode !== 'private' && mode !== 'marketplace') {
    return NextResponse.json({ error: 'mode "private" veya "marketplace" olmalı' }, { status: 400 })
  }
  const missing: string[] = []
  for (const field of REQUIRED_FIELDS) {
    if (!character[field as keyof typeof character]) missing.push(field)
  }
  if (missing.length) {
    return NextResponse.json({ error: 'Zorunlu alanlar eksik', missing }, { status: 422 })
  }
  if (mode === 'marketplace') {
    const meta = (character.bibleMetadata as any) ?? {}
    const driftScore = meta?.validationResults?.driftScore
    if (driftScore == null) {
      return NextResponse.json(
        { error: 'Marketplace için bible validation gerekli' },
        { status: 422 }
      )
    }
    if (driftScore >= 30) {
      return NextResponse.json({ error: `Bible tutarsız (drift ${driftScore}).` }, { status: 422 })
    }
    if ((character.dnaScore ?? 0) < 50) {
      return NextResponse.json(
        { error: `DNA puanı düşük (${character.dnaScore ?? 0}).` },
        { status: 422 }
      )
    }
  }
  const newStatus = mode === 'private' ? 'private' : 'pending_review'
  const updated = await db.character.update({
    where: { id },
    data: { publishStatus: newStatus },
    select: { id: true, publishStatus: true, dnaScore: true },
  })
  return NextResponse.json({ character: updated, mode })
})
