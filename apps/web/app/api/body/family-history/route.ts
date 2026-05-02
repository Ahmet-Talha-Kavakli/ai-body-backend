import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const items = await db.familyHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ items })
  } catch (error) {
    console.error('[body/family-history GET]', error)
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
    const { relation, conditionName, ageAtDiagnosis, notes } = body

    if (!relation || !conditionName) {
      return NextResponse.json(
        { error: 'Eksik alan: relation, conditionName gerekli' },
        { status: 400 }
      )
    }

    const item = await db.familyHistory.create({
      data: {
        userId: user.id,
        relation,
        conditionName,
        ageAtDiagnosis: ageAtDiagnosis ?? null,
        notes: notes ?? '',
      },
    })
    return NextResponse.json({ item })
  } catch (error) {
    console.error('[body/family-history POST]', error)
    return NextResponse.json({ error: 'Kayıt oluşturulamadı' }, { status: 500 })
  }
}
