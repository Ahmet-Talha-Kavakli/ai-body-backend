import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

const VALID_SCHEDULE_MODES = ['fixed_times', 'interval_hours', 'as_needed'] as const
type ScheduleMode = (typeof VALID_SCHEDULE_MODES)[number]

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

// 1=Pzt..7=Paz (ISO weekday)
function isoWeekday(dateStr: string): number {
  const d = new Date(`${dateStr}T00:00:00.000Z`)
  const js = d.getUTCDay() // 0=Sun..6=Sat
  return js === 0 ? 7 : js
}

// GET: aktif ilaçlar + tarihe ait log'lar
export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') ?? todayStr()
    const weekday = isoWeekday(date)

    // Tarih bazlı aktiflik kontrolü:
    // - startDate <= seçilen gün (henüz başlamamış olanlar gözükmesin)
    // - endDate null veya endDate >= seçilen gün
    // - deletedAt null veya deletedAt > seçilen gün (silinmeden önce gözüksün)
    const dayStart = new Date(`${date}T00:00:00.000Z`)
    const dayEnd = new Date(`${date}T23:59:59.999Z`)

    const medications = await db.medication.findMany({
      where: {
        userId: user.id,
        startDate: { lte: dayEnd },
        OR: [{ endDate: null }, { endDate: { gte: dayStart } }],
        AND: [
          {
            OR: [{ deletedAt: null }, { deletedAt: { gt: dayEnd } }],
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
    })

    const ids = medications.map((m) => m.id)
    const logs = ids.length
      ? await db.medicationLog.findMany({
          where: { medicationId: { in: ids }, userId: user.id, date },
        })
      : []

    const logsByMed = new Map<string, typeof logs>()
    for (const log of logs) {
      const list = logsByMed.get(log.medicationId) ?? []
      list.push(log)
      logsByMed.set(log.medicationId, list)
    }

    const result = medications.map((m) => {
      const medLogs = logsByMed.get(m.id) ?? []
      const scheduledForToday =
        !m.scheduleDays || m.scheduleDays.length === 0 ? true : m.scheduleDays.includes(weekday)

      return {
        id: m.id,
        userId: m.userId,
        name: m.name,
        dosage: m.dosage,
        unit: m.unit,
        type: m.type,
        color: m.color,
        notes: m.notes,
        scheduleMode: m.scheduleMode,
        scheduleTimes: m.scheduleTimes,
        scheduleDays: m.scheduleDays,
        intervalHours: m.intervalHours,
        startDate: m.startDate ?? null,
        endDate: m.endDate ?? null,
        stockCount: m.stockCount,
        refillThreshold: m.refillThreshold,
        remindersOn: m.remindersOn,
        isActive: m.isActive,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        scheduledForToday,
        takenLogs: medLogs.map((l) => ({
          id: l.id,
          scheduledTime: l.scheduledTime,
          takenAt: l.takenAt,
          skipped: l.skipped,
        })),
      }
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[medications GET]', err)
    return NextResponse.json({ error: 'Failed to fetch medications' }, { status: 500 })
  }
})

// POST: yeni ilaç
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = (await req.json()) as {
      name?: string
      dosage?: string
      unit?: string
      type?: string
      color?: string
      notes?: string | null
      scheduleMode?: ScheduleMode
      scheduleTimes?: string[]
      scheduleDays?: number[]
      intervalHours?: number | null
      startDate?: string | null
      endDate?: string | null
      stockCount?: number | null
      refillThreshold?: number | null
      remindersOn?: boolean
    }

    if (!body.name || !body.dosage) {
      return NextResponse.json({ error: 'name and dosage are required' }, { status: 400 })
    }

    const scheduleMode: ScheduleMode = body.scheduleMode ?? 'fixed_times'
    if (!VALID_SCHEDULE_MODES.includes(scheduleMode)) {
      return NextResponse.json({ error: 'Invalid scheduleMode' }, { status: 400 })
    }

    const medication = await db.medication.create({
      data: {
        userId: user.id,
        name: body.name,
        dosage: body.dosage,
        unit: body.unit ?? 'tablet',
        type: body.type ?? 'tablet',
        color: body.color ?? '#5E5CE6',
        notes: body.notes ?? null,
        scheduleMode,
        scheduleTimes: body.scheduleTimes ?? [],
        scheduleDays: body.scheduleDays ?? [],
        intervalHours: body.intervalHours ?? null,
        ...(body.startDate ? { startDate: new Date(body.startDate) } : {}),
        endDate: body.endDate ? new Date(body.endDate) : null,
        stockCount: body.stockCount ?? null,
        refillThreshold: body.refillThreshold ?? null,
        remindersOn: body.remindersOn ?? true,
      },
    })

    return NextResponse.json(medication)
  } catch (err) {
    console.error('[medications POST]', err)
    return NextResponse.json({ error: 'Failed to create medication' }, { status: 500 })
  }
})
