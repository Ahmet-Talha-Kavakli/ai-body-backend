import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const surgeries = await db.surgery.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { performedAt: 'desc' },
    })
    return NextResponse.json({ surgeries })
  } catch (error) {
    console.error('[body/surgeries GET]', error)
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
    const { name, performedAt, region, hospital, surgeon, recoveryNotes, photos } = body

    if (!name || !performedAt) {
      return NextResponse.json({ error: 'Eksik alan: name, performedAt gerekli' }, { status: 400 })
    }

    const surgery = await db.surgery.create({
      data: {
        userId: user.id,
        name,
        performedAt: new Date(performedAt),
        region: region ?? null,
        hospital: hospital ?? null,
        surgeon: surgeon ?? null,
        recoveryNotes: recoveryNotes ?? '',
        photos: photos ?? [],
      },
    })
    return NextResponse.json({ surgery })
  } catch (error) {
    console.error('[body/surgeries POST]', error)
    return NextResponse.json({ error: 'Kayıt oluşturulamadı' }, { status: 500 })
  }
}
