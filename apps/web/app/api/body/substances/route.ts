import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const substances = await db.substance.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ substances })
  } catch (error) {
    console.error('[body/substances GET]', error)
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
    const { type, status, frequency, amountPerDay, unit, startedAt, quitDate, note } = body

    if (!type) {
      return NextResponse.json({ error: 'type gerekli' }, { status: 400 })
    }

    const substance = await db.substance.create({
      data: {
        userId: user.id,
        type,
        status: status ?? 'active',
        frequency: frequency ?? null,
        amountPerDay: amountPerDay ?? null,
        unit: unit ?? null,
        startedAt: startedAt ? new Date(startedAt) : null,
        quitDate: quitDate ? new Date(quitDate) : null,
        note: note ?? '',
      },
    })
    return NextResponse.json({ substance })
  } catch (error) {
    console.error('[body/substances POST]', error)
    return NextResponse.json({ error: 'Kayıt oluşturulamadı' }, { status: 500 })
  }
}
