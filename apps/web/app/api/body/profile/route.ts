import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const userId = user.id

    const [
      marks,
      allergies,
      chronicConditions,
      vaccinations,
      surgeries,
      familyHistory,
      childhoodIllnesses,
      visionHearing,
      dental,
      lifeState,
      physicalProfile,
      emergencyInfo,
      substances,
      healthEvents,
    ] = await Promise.all([
      db.bodyMark.findMany({ where: { userId, isActive: true }, orderBy: { createdAt: 'desc' } }),
      db.allergy.findMany({ where: { userId, isActive: true }, orderBy: { createdAt: 'desc' } }),
      db.chronicCondition.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.vaccination.findMany({ where: { userId }, orderBy: { administeredAt: 'desc' } }),
      db.surgery.findMany({ where: { userId, isActive: true }, orderBy: { performedAt: 'desc' } }),
      db.familyHistory.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      db.childhoodIllness.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      db.visionHearing.findUnique({ where: { userId } }),
      db.dentalHealth.findUnique({ where: { userId } }),
      db.lifeState.findUnique({ where: { userId } }),
      db.physicalProfile.findUnique({ where: { userId } }),
      db.emergencyInfo.findUnique({ where: { userId } }),
      db.substance.findMany({ where: { userId, isActive: true }, orderBy: { createdAt: 'desc' } }),
      db.healthEvent.findMany({
        where: { userId, isActive: true },
        orderBy: { startDate: 'desc' },
        take: 50,
      }),
    ])

    return NextResponse.json({
      marks,
      allergies,
      chronicConditions,
      vaccinations,
      surgeries,
      familyHistory,
      childhoodIllnesses,
      visionHearing,
      dental,
      lifeState,
      physicalProfile,
      emergencyInfo,
      substances,
      healthEvents,
    })
  } catch (error) {
    console.error('[body/profile GET]', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
