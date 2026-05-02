import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  try {
    const logs = await db.activityLog.findMany({
      where: { userId: user.id },
      select: { activityType: true, duration: true, calories: true, date: true },
      orderBy: { date: 'asc' },
    })

    if (logs.length === 0) return NextResponse.json([])

    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const grouped = logs.reduce<Record<string, typeof logs>>((acc, l) => {
      if (!acc[l.activityType]) acc[l.activityType] = []
      acc[l.activityType]!.push(l)
      return acc
    }, {})

    const result = Object.entries(grouped).map(([activityType, entries]) => {
      // entries is date-asc ordered
      // Find longest duration record and its previous best
      let longestDuration = 0
      let longestDurationDate: string | null = null
      let prevLongestDuration = 0

      for (const e of entries) {
        if (e.duration > longestDuration) {
          prevLongestDuration = longestDuration
          longestDuration = e.duration
          longestDurationDate = e.date
        }
      }

      // Find most calories record and its previous best
      const caloriesList = entries.filter((l) => l.calories != null)
      let mostCalories = 0
      let mostCaloriesDate: string | null = null
      let prevMostCalories = 0

      for (const e of caloriesList) {
        const cal = e.calories as number
        if (cal > mostCalories) {
          prevMostCalories = mostCalories
          mostCalories = cal
          mostCaloriesDate = e.date
        }
      }

      // Days since record was set
      const daysSinceDurationRecord = longestDurationDate
        ? Math.floor(
            (new Date(todayStr).getTime() - new Date(longestDurationDate).getTime()) / 86400000
          )
        : null

      const daysSinceCaloriesRecord = mostCaloriesDate
        ? Math.floor(
            (new Date(todayStr).getTime() - new Date(mostCaloriesDate).getTime()) / 86400000
          )
        : null

      // Last 5 durations for mini trend (date-asc, so last 5)
      const last5Durations = entries.slice(-5).map((e) => e.duration)

      const sortedDesc = [...entries].reverse()

      return {
        activityType,
        totalCount: entries.length,
        thisMonthCount: entries.filter((l) => l.date.startsWith(thisMonthPrefix)).length,
        longestDuration,
        longestDurationDate,
        prevLongestDuration,
        mostCalories,
        mostCaloriesDate,
        prevMostCalories,
        avgDuration: Math.round(entries.reduce((s, l) => s + l.duration, 0) / entries.length),
        lastDone: sortedDesc[0]!.date,
        daysSinceDurationRecord,
        daysSinceCaloriesRecord,
        last5Durations,
      }
    })

    // Sort: most recently set record first
    result.sort((a, b) => {
      const aDate = a.longestDurationDate ?? ''
      const bDate = b.longestDurationDate ?? ''
      return bDate.localeCompare(aDate)
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[personal-records/all GET]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
})
