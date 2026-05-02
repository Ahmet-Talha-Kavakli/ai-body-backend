import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const { id } = await ctx.params
    const existing = await db.chronicCondition.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 })
    }

    const body = await req.json()
    const data: any = {}
    for (const key of [
      'name',
      'category',
      'severity',
      'status',
      'region',
      'doctorNote',
      'photos',
      'isActive',
    ]) {
      if (body[key] !== undefined) data[key] = body[key]
    }
    if (body.diagnosedAt !== undefined)
      data.diagnosedAt = body.diagnosedAt ? new Date(body.diagnosedAt) : null
    if (body.nextCheckup !== undefined)
      data.nextCheckup = body.nextCheckup ? new Date(body.nextCheckup) : null

    const condition = await db.chronicCondition.update({ where: { id }, data })
    return NextResponse.json({ condition })
  } catch (error) {
    console.error('[body/chronic-conditions PATCH]', error)
    return NextResponse.json({ error: 'Güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const { id } = await ctx.params
    const existing = await db.chronicCondition.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 })
    }
    await db.chronicCondition.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[body/chronic-conditions DELETE]', error)
    return NextResponse.json({ error: 'Silinemedi' }, { status: 500 })
  }
}
