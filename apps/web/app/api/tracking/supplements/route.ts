import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

// GET: aktif supplementler + bugün alındı mı?
export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const supplements = await db.supplement.findMany({
    where: { userId: user.id, isActive: true },
    include: {
      logs: { where: { takenAt: { gte: todayStart } }, take: 1 },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(supplements.map((s) => ({ ...s, takenToday: s.logs.length > 0 })))
})

// POST: yeni supplement ekle
export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as {
    name: string
    dosage: string
    unit?: string
    timing?: string
  }

  const supplement = await db.supplement.create({
    data: {
      userId: user.id,
      name: body.name,
      dosage: body.dosage,
      unit: body.unit ?? 'mg',
      timing: body.timing ?? 'morning',
    },
  })

  return NextResponse.json(supplement)
})

// PATCH: supplement al (log oluştur)
export const PATCH = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as { supplementId: string }

  const log = await db.supplementLog.create({
    data: { supplementId: body.supplementId, userId: user.id },
  })

  return NextResponse.json(log)
})
