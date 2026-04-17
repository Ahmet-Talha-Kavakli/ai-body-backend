import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({
      where: { clerkId },
      include: { healthProfile: true, subscription: true },
    })

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, bio, country, timezone, locale, profilePublic, healthProfile } = body

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const userUpdateData: Record<string, unknown> = {}
    if (name !== undefined) userUpdateData.name = name
    if (bio !== undefined) userUpdateData.bio = bio
    if (country !== undefined) userUpdateData.country = country
    if (timezone !== undefined) userUpdateData.timezone = timezone
    if (locale !== undefined) userUpdateData.locale = locale
    if (profilePublic !== undefined) userUpdateData.profilePublic = profilePublic

    const updated = await db.user.update({
      where: { clerkId },
      data: userUpdateData,
    })

    if (healthProfile) {
      await db.healthProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          age: healthProfile.age ?? 25,
          gender: healthProfile.gender ?? 'prefer_not_to_say',
          heightCm: healthProfile.heightCm ?? 175,
          weightKg: healthProfile.weightKg ?? 70,
          fitnessLevel: healthProfile.fitnessLevel ?? 'beginner',
          goals: healthProfile.goals ?? [],
          availableDaysPerWeek: healthProfile.availableDaysPerWeek ?? 4,
          sessionDurationMinutes: healthProfile.sessionDurationMinutes ?? 45,
          availableEquipment: healthProfile.availableEquipment ?? [],
        },
        update: {
          ...(healthProfile.age !== undefined && { age: healthProfile.age }),
          ...(healthProfile.gender !== undefined && { gender: healthProfile.gender }),
          ...(healthProfile.heightCm !== undefined && { heightCm: healthProfile.heightCm }),
          ...(healthProfile.weightKg !== undefined && { weightKg: healthProfile.weightKg }),
          ...(healthProfile.fitnessLevel !== undefined && { fitnessLevel: healthProfile.fitnessLevel }),
          ...(healthProfile.goals !== undefined && { goals: healthProfile.goals }),
        },
      })
    }

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
