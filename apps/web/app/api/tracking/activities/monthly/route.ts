import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))

  const pad = (n: number) => String(n).padStart(2, '0')
  const prefix = `${year}-${pad(month)}`

  const logs = await db.activityLog.findMany({
    where: { userId: user.id, date: { startsWith: prefix } },
    select: { date: true, duration: true, activityType: true, imageUrls: true },
    orderBy: { createdAt: 'asc' },
  })

  // Gün bazında grupla: { "2026-04-21": { count: 2, totalMinutes: 75, imageUrl: "...", imageCount: 1 } }
  const days: Record<
    string,
    { count: number; totalMinutes: number; imageUrl: string | null; imageCount: number }
  > = {}
  for (const log of logs) {
    if (!days[log.date])
      days[log.date] = { count: 0, totalMinutes: 0, imageUrl: null, imageCount: 0 }
    days[log.date]!.count += 1
    days[log.date]!.totalMinutes += log.duration
    for (const url of log.imageUrls) {
      days[log.date]!.imageUrl = url // en yenisi kazanır (asc sıralı, son üzerine yazar)
      days[log.date]!.imageCount += 1
    }
  }

  return NextResponse.json({ days, userCreatedAt: user.createdAt })
})
