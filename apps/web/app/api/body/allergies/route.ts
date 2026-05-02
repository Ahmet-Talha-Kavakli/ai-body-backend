import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const allergies = await db.allergy.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ allergies })
  } catch (error) {
    console.error('[body/allergies GET]', error)
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
    const { name, category, severity, reactionType, diagnosedAt, hasEpiPen, note } = body

    if (!name || !category || !severity) {
      return NextResponse.json(
        { error: 'Eksik alan: name, category, severity gerekli' },
        { status: 400 }
      )
    }

    const allergy = await db.allergy.create({
      data: {
        userId: user.id,
        name,
        category,
        severity,
        reactionType: reactionType ?? null,
        diagnosedAt: diagnosedAt ? new Date(diagnosedAt) : null,
        hasEpiPen: hasEpiPen ?? false,
        note: note ?? '',
      },
    })
    return NextResponse.json({ allergy })
  } catch (error) {
    console.error('[body/allergies POST]', error)
    return NextResponse.json({ error: 'Kayıt oluşturulamadı' }, { status: 500 })
  }
}
