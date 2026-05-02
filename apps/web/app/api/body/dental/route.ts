import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const data = await db.dentalHealth.findUnique({ where: { userId: user.id } })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[body/dental GET]', error)
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
      hasImplants: body.hasImplants ?? false,
      hasFillings: body.hasFillings ?? false,
      hasRootCanal: body.hasRootCanal ?? false,
      hasOrthodontics: body.hasOrthodontics ?? false,
      usesNightGuard: body.usesNightGuard ?? false,
      lastCheckup: body.lastCheckup ? new Date(body.lastCheckup) : null,
      notes: body.notes ?? '',
    }

    const data = await db.dentalHealth.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...payload },
      update: payload,
    })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[body/dental POST]', error)
    return NextResponse.json({ error: 'Kaydedilemedi' }, { status: 500 })
  }
}
