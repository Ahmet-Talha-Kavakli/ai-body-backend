import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const data = await db.physicalProfile.findUnique({ where: { userId: user.id } })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[body/physical-profile GET]', error)
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
    const payload: any = {
      somatotype: body.somatotype ?? null,
      dominantHand: body.dominantHand ?? null,
      hasHypoglycemia: body.hasHypoglycemia ?? false,
      hypoglycemiaNotes: body.hypoglycemiaNotes ?? '',
      hasFaintingHistory: body.hasFaintingHistory ?? false,
      faintingNotes: body.faintingNotes ?? '',
      peakFlowMlMin: body.peakFlowMlMin ?? null,
      medicationSensitivities: body.medicationSensitivities ?? [],
      notes: body.notes ?? '',
    }

    const data = await db.physicalProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...payload },
      update: payload,
    })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[body/physical-profile POST]', error)
    return NextResponse.json({ error: 'Kaydedilemedi' }, { status: 500 })
  }
}
