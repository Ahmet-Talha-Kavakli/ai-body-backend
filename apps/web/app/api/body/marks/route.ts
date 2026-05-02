import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const marks = await db.bodyMark.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ marks })
  } catch (error) {
    console.error('[body/marks GET]', error)
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
    const { region, side, type, severity, startDate, endDate, note, photos } = body

    if (!region || !type || severity == null) {
      return NextResponse.json(
        { error: 'Eksik alan: region, type, severity gerekli' },
        { status: 400 }
      )
    }

    const mark = await db.bodyMark.create({
      data: {
        userId: user.id,
        region,
        side: side ?? null,
        type,
        severity: Number(severity),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        note: note ?? '',
        photos: photos ?? [],
      },
    })
    return NextResponse.json({ mark }, { status: 200 })
  } catch (error) {
    console.error('[body/marks POST]', error)
    return NextResponse.json({ error: 'Kayıt oluşturulamadı' }, { status: 500 })
  }
}
