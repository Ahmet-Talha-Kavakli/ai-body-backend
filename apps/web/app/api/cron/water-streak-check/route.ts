import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { isValidCronRequest } from '@/lib/env/validate'
import { calcNewStreak } from '@/lib/water/streak-freeze'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!isValidCronRequest(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const streaks = await prisma.waterStreak.findMany({
      where: { currentStreak: { gt: 0 } },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let processed = 0

    for (const streak of streaks) {
      const result = calcNewStreak({
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastGoalDate: streak.lastGoalDate,
        freezeCharges: streak.freezeCharges,
        freezeUsedDates: streak.freezeUsedDates,
        today,
      })

      await prisma.waterStreak.update({
        where: { id: streak.id },
        data: {
          currentStreak: result.currentStreak,
          longestStreak: result.longestStreak,
          freezeCharges: result.freezeCharges,
          freezeUsedDates: result.freezeUsedDates,
        },
      })
      processed++
    }

    return NextResponse.json({ success: true, processed })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
