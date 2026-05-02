import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const data = await db.lifeState.findUnique({ where: { userId: user.id } })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[body/life-state GET]', error)
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
      isPregnant: body.isPregnant ?? false,
      pregnancyWeek: body.pregnancyWeek ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      isBreastfeeding: body.isBreastfeeding ?? false,
      hasDisability: body.hasDisability ?? false,
      disabilityType: body.disabilityType ?? null,
      accessibilityModeEnabled: body.accessibilityModeEnabled ?? false,
    }

    const data = await db.lifeState.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...payload },
      update: payload,
    })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[body/life-state POST]', error)
    return NextResponse.json({ error: 'Kaydedilemedi' }, { status: 500 })
  }
}
