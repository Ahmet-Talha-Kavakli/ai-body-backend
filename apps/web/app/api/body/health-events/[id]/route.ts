import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

const VALID_TYPES = [
  'diarrhea',
  'constipation',
  'migraine',
  'headache',
  'nausea',
  'fever',
  'cough',
  'dizziness',
  'flu',
  'stomachache',
  'back_pain_episode',
  'allergic_reaction',
  'fatigue',
  'other',
]

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const { id } = await ctx.params
    const existing = await db.healthEvent.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 })
    }

    const body = await req.json()
    const data: any = {}

    if (body.type !== undefined) {
      if (!VALID_TYPES.includes(body.type)) {
        return NextResponse.json({ error: 'Geçersiz tip' }, { status: 400 })
      }
      data.type = body.type
    }
    if (body.customName !== undefined) data.customName = body.customName
    if (body.severity !== undefined) {
      const sev = Number(body.severity)
      if (!sev || sev < 1 || sev > 4) {
        return NextResponse.json({ error: 'severity 1-4 arası olmalı' }, { status: 400 })
      }
      data.severity = sev
    }
    if (body.startDate !== undefined) data.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null
    if (Array.isArray(body.triggers)) data.triggers = body.triggers
    if (Array.isArray(body.treatments)) data.treatments = body.treatments
    if (body.note !== undefined) data.note = body.note
    if (body.isActive !== undefined) data.isActive = body.isActive

    const healthEvent = await db.healthEvent.update({ where: { id }, data })
    return NextResponse.json({ healthEvent })
  } catch (error) {
    console.error('[body/health-events PATCH]', error)
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
    const existing = await db.healthEvent.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 })
    }
    await db.healthEvent.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[body/health-events DELETE]', error)
    return NextResponse.json({ error: 'Silinemedi' }, { status: 500 })
  }
}
