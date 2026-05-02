import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const data = await db.visionHearing.findUnique({ where: { userId: user.id } })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[body/vision-hearing GET]', error)
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
      leftEyePower: body.leftEyePower ?? null,
      rightEyePower: body.rightEyePower ?? null,
      hasAstigmatism: body.hasAstigmatism ?? false,
      usesContactLenses: body.usesContactLenses ?? false,
      lastEyeExam: body.lastEyeExam ? new Date(body.lastEyeExam) : null,
      hearingLossLeft: body.hearingLossLeft ?? false,
      hearingLossRight: body.hearingLossRight ?? false,
      usesHearingAid: body.usesHearingAid ?? false,
      lastHearingExam: body.lastHearingExam ? new Date(body.lastHearingExam) : null,
    }

    const data = await db.visionHearing.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...payload },
      update: payload,
    })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[body/vision-hearing POST]', error)
    return NextResponse.json({ error: 'Kaydedilemedi' }, { status: 500 })
  }
}
