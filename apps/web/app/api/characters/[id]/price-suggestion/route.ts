/**
 * V4.8 Faz E — Karakter için akıllı fiyat önerisi
 *
 * GET /api/characters/:id/price-suggestion
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { suggestPrice } from '@/lib/marketplace/price-suggestion'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params!
  const character = await db.character.findFirst({
    where: { id, creatorId: user.id },
    select: { id: true, category: true, dnaScore: true },
  })
  if (!character) return NextResponse.json({ error: 'Karakter bulunamadı' }, { status: 404 })

  const suggestion = await suggestPrice({
    category: character.category,
    dnaScore: character.dnaScore,
  })
  return NextResponse.json(suggestion)
})
