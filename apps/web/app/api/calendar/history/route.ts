import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { REGION_TR_MAP, MARK_TYPE_TR, trIllnessName } from '@/lib/health/labels'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/calendar/history?date=YYYY-MM-DD
//
// Belirli bir GÜN için kullanıcının tüm sağlık durumunu döner.
// AI query_history tool'u ve mobile gün-detay sheet'i bunu kullanır.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const dateStr = new URL(req.url).searchParams.get('date')
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json({ error: 'date YYYY-MM-DD formatında olmalı' }, { status: 400 })
    }

    const result = await queryHistoryForDate(user.id, dateStr)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[calendar/history GET]', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// Bu logic body-command/route.ts içindeki query_history tool case'inden de
// çağrılabilsin diye export edilir (latency için DB direct).
export async function queryHistoryForDate(userId: string, dateStr: string) {
  const dayStart = new Date(`${dateStr}T00:00:00.000Z`)
  const dayEnd = new Date(`${dateStr}T23:59:59.999Z`)

  const [illnessesRaw, medicationsRaw, bodyMarksRaw, vaccines, surgeries, blood, checkups] =
    await Promise.all([
      // O gün AKTİF olan hastalıklar (range içinde)
      db.healthEvent.findMany({
        where: {
          userId,
          startDate: { lte: dayEnd },
          OR: [{ endDate: null }, { endDate: { gte: dayStart } }],
        },
        orderBy: { startDate: 'desc' },
      }),
      // O gün aktif olan ilaçlar
      db.medication.findMany({
        where: {
          userId,
          deletedAt: null,
          startDate: { lte: dayEnd },
          OR: [{ endDate: null }, { endDate: { gte: dayStart } }],
        },
      }),
      // O gün aktif vücut işaretleri
      db.bodyMark.findMany({
        where: {
          userId,
          isActive: true,
          startDate: { lte: dayEnd },
          OR: [{ endDate: null }, { endDate: { gte: dayStart } }],
        },
      }),
      // O güne özel: aşı (administered veya nextDose)
      db.vaccination.findMany({
        where: {
          userId,
          OR: [
            { administeredAt: { gte: dayStart, lte: dayEnd } },
            { nextDoseAt: { gte: dayStart, lte: dayEnd } },
          ],
        },
      }),
      db.surgery.findMany({
        where: { userId, performedAt: { gte: dayStart, lte: dayEnd } },
      }),
      // O tarihte VEYA öncesindeki en yakın tahlil
      db.bloodWorkRecord.findFirst({
        where: { userId, uploadedAt: { lte: dayEnd } },
        orderBy: { uploadedAt: 'desc' },
      }),
      // O güne planlanan kontroller
      db.chronicCondition.findMany({
        where: { userId, nextCheckup: { gte: dayStart, lte: dayEnd } },
      }),
    ])

  const illnesses = illnessesRaw.map((e) => ({
    name: trIllnessName(e.type, e.customName),
    severity: e.severity,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate ? e.endDate.toISOString() : null,
    note: e.note ?? '',
  }))

  const medications = medicationsRaw.map((m) => ({
    name: m.name,
    dosage: m.dosage,
    scheduleTimes: m.scheduleTimes ?? [],
  }))

  const bodyMarks = bodyMarksRaw.map((m) => ({
    region: REGION_TR_MAP[m.region] ?? m.region,
    type: MARK_TYPE_TR[m.type] ?? m.type,
    severity: m.severity,
    startDate: m.startDate.toISOString(),
  }))

  const events: Array<{ type: string; title: string; time?: string }> = []
  for (const v of vaccines) {
    const isThatDay = v.administeredAt >= dayStart && v.administeredAt <= dayEnd
    if (isThatDay) {
      events.push({ type: 'vaccine', title: `${v.name} aşısı (Doz ${v.doseNumber})` })
    } else if (v.nextDoseAt && v.nextDoseAt >= dayStart && v.nextDoseAt <= dayEnd) {
      events.push({ type: 'vaccine_due', title: `${v.name} (yaklaşan doz)` })
    }
  }
  for (const s of surgeries) {
    events.push({ type: 'surgery', title: `${s.name} ameliyatı` })
  }
  for (const c of checkups) {
    events.push({ type: 'checkup', title: `${c.name} kontrolü` })
  }

  let bloodWork: { score: number; alerts: string[] } | null = null
  if (blood) {
    const analysis = (blood.analysis as { healthScore?: number; alerts?: string[] }) ?? {}
    bloodWork = {
      score: typeof analysis.healthScore === 'number' ? analysis.healthScore : 0,
      alerts: Array.isArray(analysis.alerts) ? analysis.alerts : [],
    }
  }

  const hasData =
    illnesses.length > 0 ||
    medications.length > 0 ||
    bodyMarks.length > 0 ||
    events.length > 0 ||
    bloodWork !== null

  return {
    date: dateStr,
    hasData,
    illnesses,
    medications,
    bodyMarks,
    events,
    bloodWork,
  }
}
