import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { cached, redis } from '@/lib/redis/client'

const EDITABLE_FIELDS = [
  'name',
  'age',
  'gender',
  'bio',
  'hometown',
  'timezone',
  'category',
  'avatarUrl',
  'masterAvatarUrl',
  'currentMood',
  'currentActivity',
  'currentLocation',
  'dietaryHabits',
  'addictions',
  'npcCircle',
  'pastRelationships',
  'alcoholTolerance',
  'partyFrequency',
  'financialState',
  'activeHours',
  'todayOutfit',
  'morningRoutine',
  'eveningRoutine',
  'coreValues',
  'birthDate',
  'untoldSecrets',
  'bibleMetadata',
] as const

type Ctx = { params: Promise<{ id: string }> }

export const GET = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params!
  const character = await cached(`char:${user.id}:${id}`, 30, async () => {
    return db.character.findFirst({ where: { id, creatorId: user.id } })
  })
  if (!character) return NextResponse.json({ error: 'Karakter bulunamadı' }, { status: 404 })
  return NextResponse.json({ character })
})

export const PATCH = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params!
  const character = await db.character.findFirst({
    where: { id, creatorId: user.id },
    select: { id: true, publishStatus: true },
  })
  if (!character) return NextResponse.json({ error: 'Karakter bulunamadı' }, { status: 404 })
  if (character.publishStatus !== 'draft' && character.publishStatus !== 'private') {
    return NextResponse.json({ error: 'Yayında olan karakter düzenlenemez' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const data: any = {}
  for (const field of EDITABLE_FIELDS) {
    if (field in body) data[field] = body[field]
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })
  }
  const updated = await db.character.update({ where: { id }, data })
  // Cache invalidate
  try {
    await redis.del(`char:${user.id}:${id}`)
    await redis.del(`chars:mine:${user.id}`)
  } catch {}
  return NextResponse.json({ character: updated })
})

export const DELETE = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params!
  const character = await db.character.findFirst({
    where: { id, creatorId: user.id },
    select: { id: true, publishStatus: true },
  })
  if (!character) return NextResponse.json({ error: 'Karakter bulunamadı' }, { status: 404 })
  if (character.publishStatus !== 'draft') {
    return NextResponse.json({ error: 'Sadece taslak karakter silinebilir.' }, { status: 403 })
  }
  await db.character.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})
