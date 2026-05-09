import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params!
  const character = await db.character.findFirst({
    where: { id, creatorId: user.id },
    select: { id: true, isRetired: true, publishStatus: true },
  })
  if (!character) return NextResponse.json({ error: 'Karakter bulunamadı' }, { status: 404 })
  if (character.isRetired)
    return NextResponse.json({ error: 'Karakter zaten emekli' }, { status: 400 })
  await db.character.update({ where: { id }, data: { isRetired: true, publishStatus: 'retired' } })
  await db.marketplaceListing.updateMany({
    where: { characterId: id },
    data: { rentEnabled: false, buyEnabled: false },
  })
  return NextResponse.json({ ok: true })
})
