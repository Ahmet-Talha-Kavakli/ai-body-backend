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

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const healthEvents = await db.healthEvent.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { startDate: 'desc' },
      take: 100,
    })
    return NextResponse.json({ healthEvents })
  } catch (error) {
    console.error('[body/health-events GET]', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const body = await req.json()
    const { type, customName, severity, startDate, endDate, triggers, treatments, note } = body

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Geçersiz tip' }, { status: 400 })
    }
    if (type === 'other' && (!customName || typeof customName !== 'string' || !customName.trim())) {
      return NextResponse.json({ error: 'customName zorunlu' }, { status: 400 })
    }
    const sev = Number(severity)
    if (!sev || sev < 1 || sev > 4) {
      return NextResponse.json({ error: 'severity 1-4 arası olmalı' }, { status: 400 })
    }
    if (!startDate) {
      return NextResponse.json({ error: 'startDate gerekli' }, { status: 400 })
    }

    const healthEvent = await db.healthEvent.create({
      data: {
        userId: user.id,
        type,
        customName: type === 'other' ? customName.trim() : null,
        severity: sev,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        triggers: Array.isArray(triggers) ? triggers : [],
        treatments: Array.isArray(treatments) ? treatments : [],
        note: note ?? '',
      },
    })
    return NextResponse.json({ healthEvent })
  } catch (error) {
    console.error('[body/health-events POST]', error)
    return NextResponse.json({ error: 'Kayıt oluşturulamadı' }, { status: 500 })
  }
}
