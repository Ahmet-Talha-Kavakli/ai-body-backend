import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Geçersiz JSON formatı' }, { status: 400 })
    }
    const {
      fitnessLevel,
      goals,
      sessionDuration,
      injuries,
      equipment,
      age,
      weightKg,
      heightCm,
      gender,
    } = body

    // Kullanıcıyı bul
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // HealthProfile oluştur veya güncelle
    await db.healthProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        fitnessLevel: fitnessLevel ?? 'beginner',
        goals: goals ?? [],
        sessionDurationMinutes: parseInt(sessionDuration ?? '45'),
        availableEquipment: equipment ?? [],
        availableDaysPerWeek: 4,
        age: age ?? 25,
        weightKg: weightKg ?? 70,
        heightCm: heightCm ?? 175,
        gender: gender ?? 'prefer_not_to_say',
      },
      update: {
        fitnessLevel: fitnessLevel ?? 'beginner',
        goals: goals ?? [],
        sessionDurationMinutes: parseInt(sessionDuration ?? '45'),
        availableEquipment: equipment ?? [],
        age: age ?? 25,
        weightKg: weightKg ?? 70,
        heightCm: heightCm ?? 175,
        gender: gender ?? 'prefer_not_to_say',
      },
    })

    // Sakatlıkları kaydet
    if (injuries && injuries.length > 0 && !injuries.includes('none')) {
      // Önce aktif sakatlıkları pasifleştir
      await db.injury.updateMany({
        where: { userId: user.id, isActive: true },
        data: { isActive: false },
      })

      // Yenilerini ekle
      await db.injury.createMany({
        data: injuries.map((bodyPart: string) => ({
          userId: user.id,
          bodyPart,
          severity: 'mild',
          description: `${bodyPart} - onboarding sırasında belirtildi`,
          isActive: true,
        })),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({
      where: { clerkId },
      include: { healthProfile: true },
    })

    return NextResponse.json({
      completed: !!user?.healthProfile,
      profile: user?.healthProfile ?? null,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
