import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const conditions = await db.chronicCondition.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ conditions })
  } catch (error) {
    console.error('[body/chronic-conditions GET]', error)
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
    const {
      name,
      category,
      severity,
      status,
      region,
      diagnosedAt,
      doctorNote,
      nextCheckup,
      photos,
    } = body

    if (!name || !category || !severity || !status) {
      return NextResponse.json(
        { error: 'Eksik alan: name, category, severity, status gerekli' },
        { status: 400 }
      )
    }

    const condition = await db.chronicCondition.create({
      data: {
        userId: user.id,
        name,
        category,
        severity,
        status,
        region: region ?? null,
        diagnosedAt: diagnosedAt ? new Date(diagnosedAt) : new Date(),
        doctorNote: doctorNote ?? '',
        nextCheckup: nextCheckup ? new Date(nextCheckup) : null,
        photos: photos ?? [],
      },
    })
    return NextResponse.json({ condition })
  } catch (error) {
    console.error('[body/chronic-conditions POST]', error)
    return NextResponse.json({ error: 'Kayıt oluşturulamadı' }, { status: 500 })
  }
}
