import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({
      where: { clerkId },
      include: { healthProfile: true },
    })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Son 6 aydaki seans sayısı (aylık)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1); sixMonthsAgo.setHours(0, 0, 0, 0)

    const sessions = await db.workoutSession.findMany({
      where: { userId: user.id, startedAt: { gte: sixMonthsAgo }, endedAt: { not: null } },
      select: { startedAt: true, durationSeconds: true, caloriesBurned: true, overallFormScore: true },
      orderBy: { startedAt: 'asc' },
    })

    // Aylık grupla
    const monthlyMap: Record<string, { sessions: number; calories: number; minutes: number }> = {}
    sessions.forEach(s => {
      const key = s.startedAt.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
      if (!monthlyMap[key]) monthlyMap[key] = { sessions: 0, calories: 0, minutes: 0 }
      monthlyMap[key]!.sessions++
      monthlyMap[key]!.calories += s.caloriesBurned ?? 0
      monthlyMap[key]!.minutes += Math.round((s.durationSeconds ?? 0) / 60)
    })

    // Güç gelişimi — tamamlanan setlerden
    const completedSets = await db.completedSet.findMany({
      where: { session: { userId: user.id } },
      include: { exercise: { select: { name: true, slug: true } } },
      orderBy: { session: { startedAt: 'asc' } },
    })

    // Egzersiz bazında max ağırlık/tekrar
    const strengthMap: Record<string, { name: string; records: { date: Date; value: number }[] }> = {}
    completedSets.forEach(set => {
      const key = set.exercise.slug
      if (!strengthMap[key]) strengthMap[key] = { name: set.exercise.name, records: [] }
      const val = set.weightKg ?? set.reps ?? 0
      if (val > 0) {
        strengthMap[key]!.records.push({ date: new Date(), value: val })
      }
    })

    // Toplam istatistikler
    const totalSessions = sessions.length
    const totalCalories = Math.round(sessions.reduce((s, sess) => s + (sess.caloriesBurned ?? 0), 0))
    const totalMinutes = Math.round(sessions.reduce((s, sess) => s + (sess.durationSeconds ?? 0), 0) / 60)
    const avgFormScore = sessions.length
      ? Math.round(sessions.reduce((s, sess) => s + (sess.overallFormScore ?? 85), 0) / sessions.length)
      : 0

    return NextResponse.json({
      monthlyActivity: Object.entries(monthlyMap).map(([month, data]) => ({ month, ...data })),
      strengthProgress: Object.values(strengthMap).slice(0, 5),
      summary: { totalSessions, totalCalories, totalMinutes, avgFormScore },
      profile: user.healthProfile,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
