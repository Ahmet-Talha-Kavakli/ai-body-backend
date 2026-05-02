import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const vaccinations = await db.vaccination.findMany({
      where: { userId: user.id },
      orderBy: { administeredAt: 'desc' },
    })
    return NextResponse.json({ vaccinations })
  } catch (error) {
    console.error('[body/vaccinations GET]', error)
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
    const { name, doseNumber, administeredAt, nextDoseAt, notes, batchNumber } = body

    if (!name || !administeredAt) {
      return NextResponse.json(
        { error: 'Eksik alan: name, administeredAt gerekli' },
        { status: 400 }
      )
    }

    const vaccination = await db.vaccination.create({
      data: {
        userId: user.id,
        name,
        doseNumber: doseNumber ?? 1,
        administeredAt: new Date(administeredAt),
        nextDoseAt: nextDoseAt ? new Date(nextDoseAt) : null,
        notes: notes ?? '',
        batchNumber: batchNumber ?? null,
      },
    })
    return NextResponse.json({ vaccination })
  } catch (error) {
    console.error('[body/vaccinations POST]', error)
    return NextResponse.json({ error: 'Kayıt oluşturulamadı' }, { status: 500 })
  }
}
