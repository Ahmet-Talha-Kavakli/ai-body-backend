import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const data = await db.emergencyInfo.findUnique({ where: { userId: user.id } })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[body/emergency-info GET]', error)
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
      bloodType: body.bloodType ?? null,
      isOrganDonor: body.isOrganDonor ?? false,
      lastBloodDonation: body.lastBloodDonation ? new Date(body.lastBloodDonation) : null,
      emergencyContactName: body.emergencyContactName ?? null,
      emergencyContactRelation: body.emergencyContactRelation ?? null,
      emergencyContactPhone: body.emergencyContactPhone ?? null,
      insuranceProvider: body.insuranceProvider ?? null,
      familyDoctor: body.familyDoctor ?? null,
      nearestHospital: body.nearestHospital ?? null,
    }

    const data = await db.emergencyInfo.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...payload },
      update: payload,
    })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[body/emergency-info POST]', error)
    return NextResponse.json({ error: 'Kaydedilemedi' }, { status: 500 })
  }
}
