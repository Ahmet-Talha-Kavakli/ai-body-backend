/**
 * V4.6 M62 — @ ile Veri Paylaşımı endpoint'i
 *
 * GET    → kullanıcının bu karakterle aktif paylaşımları
 * POST   → yeni grant oluştur veya scope güncelle
 *          body: { category, scope }
 * DELETE → grant'ı kaldır
 *          query: ?category=...
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import {
  grantAccess,
  revokeAccess,
  loadActiveGrants,
  type DataCategory,
  type DataScope,
} from '@/lib/assistant/data-share'

const VALID_CATEGORIES: DataCategory[] = ['nutrition', 'water', 'medication', 'exercise', 'body']
const VALID_SCOPES: DataScope[] = ['today', 'last7', 'all']

function getCharIdFromUrl(url: string): string | null {
  const segments = new URL(url).pathname.split('/').filter(Boolean)
  const idx = segments.indexOf('characters')
  return idx >= 0 ? segments[idx + 1] : null
}

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const characterId = getCharIdFromUrl(req.url)
  if (!characterId) return NextResponse.json({ error: 'character_id_missing' }, { status: 400 })
  const grants = await loadActiveGrants({ userId: user.id, characterId })
  return NextResponse.json({ ok: true, grants })
})

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const characterId = getCharIdFromUrl(req.url)
  if (!characterId) return NextResponse.json({ error: 'character_id_missing' }, { status: 400 })
  let body: { category?: string; scope?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  if (!body.category || !VALID_CATEGORIES.includes(body.category as DataCategory)) {
    return NextResponse.json({ error: 'invalid_category' }, { status: 400 })
  }
  const scope = (body.scope ?? 'last7') as DataScope
  if (!VALID_SCOPES.includes(scope)) {
    return NextResponse.json({ error: 'invalid_scope' }, { status: 400 })
  }
  const r = await grantAccess({
    userId: user.id,
    characterId,
    category: body.category as DataCategory,
    scope,
  })
  return NextResponse.json({ ok: true, ...r })
})

export const DELETE = withAuth(async (req: NextRequest, { user }) => {
  const characterId = getCharIdFromUrl(req.url)
  if (!characterId) return NextResponse.json({ error: 'character_id_missing' }, { status: 400 })
  const url = new URL(req.url)
  const category = url.searchParams.get('category') as DataCategory | null
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'invalid_category' }, { status: 400 })
  }
  await revokeAccess({ userId: user.id, characterId, category })
  return NextResponse.json({ ok: true })
})
