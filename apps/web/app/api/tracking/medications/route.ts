import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

// GET: aktif ilaçlar + bugün alındı mı?
export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const medications = await db.medication.findMany({
    where: { userId: user.id, isActive: true },
    include: {
      logs: { where: { takenAt: { gte: todayStart } }, take: 1 },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(
    medications.map((m) => ({
      ...m,
      takenToday: m.logs.length > 0 && !m.logs[0].skipped,
      skippedToday: m.logs.length > 0 && m.logs[0].skipped,
    }))
  )
})

// POST: yeni ilaç ekle
export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as {
    name: string
    dosage: string
    frequency?: string
    reminderAt?: string
  }

  const medication = await db.medication.create({
    data: {
      userId: user.id,
      name: body.name,
      dosage: body.dosage,
      frequency: body.frequency ?? 'daily',
      reminderAt: body.reminderAt,
    },
  })

  return NextResponse.json(medication)
})

// PATCH: ilaç al (log) veya atla
export const PATCH = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as { medicationId: string; skipped?: boolean }

  const log = await db.medicationLog.create({
    data: {
      medicationId: body.medicationId,
      userId: user.id,
      skipped: body.skipped ?? false,
    },
  })

  return NextResponse.json(log)
})
