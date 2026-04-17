import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({
      where: { clerkId },
      include: {
        healthProfile: true,
        sessions: { take: 100, orderBy: { startedAt: 'desc' } },
        mealLogs: { take: 100, orderBy: { loggedAt: 'desc' } },
        userAchievements: true,
      },
    })

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        name: user.name,
        email: user.email,
        bio: user.bio,
        country: user.country,
        timezone: user.timezone,
        createdAt: user.createdAt,
      },
      healthProfile: user.healthProfile,
      sessions: user.sessions,
      nutrition: user.mealLogs,
      achievements: user.userAchievements,
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="fitai-data-${Date.now()}.json"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
