import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { ILLNESS_TR, REGION_TR_MAP, MARK_TYPE_TR, trIllnessName } from '@/lib/health/labels'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/calendar/events?from=ISO&to=ISO
//
// Verilen tarih aralığı için kullanıcının TÜM sağlık takvim olaylarını
// (ilaç dozları, hastalıklar, kronik kontroller, aşılar, kan tahlilleri,
// vücut işaretleri, ameliyatlar) tek istekte aggregate eder.
// Mobile takvim sayfası açık olan ay için bunu çağırır.
// ─────────────────────────────────────────────────────────────────────────────

type CalendarEvent = {
  id: string
  type:
    | 'medication_dose'
    | 'illness'
    | 'chronic_checkup'
    | 'vaccine'
    | 'blood_test'
    | 'body_mark'
    | 'surgery'
  title: string
  subtitle?: string
  startDate: string
  endDate?: string | null
  timeOfDay?: string | null
  color: string
  icon: string
  sourceType: string
  sourceId: string
  note?: string
}

const COLOR = {
  medication: '#34C759',
  illness: '#FF453A',
  vaccine: '#5AC8FA',
  blood: '#FF6914',
  checkup: '#AF52DE',
  surgery: '#FF2D55',
  body_mark: '#FF9F0A',
} as const

const ICON = {
  medication: '💊',
  illness: '🌡️',
  vaccine: '💉',
  blood: '🧪',
  checkup: '🩺',
  surgery: '🔪',
  body_mark: '🩹',
} as const

function dayKey(d: Date): string {
  // YYYY-MM-DD (UTC bazlı; takvim genişletme için gün sınırı tutarlı)
  return d.toISOString().slice(0, 10)
}

function startOfUtcDay(d: Date): Date {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const url = new URL(req.url)
    const fromStr = url.searchParams.get('from')
    const toStr = url.searchParams.get('to')
    if (!fromStr || !toStr) {
      return NextResponse.json({ error: 'from ve to query param gerekli (ISO)' }, { status: 400 })
    }

    const from = new Date(fromStr)
    const to = new Date(toStr)
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json({ error: 'Geçersiz tarih formatı' }, { status: 400 })
    }
    if (from > to) {
      return NextResponse.json({ error: 'from > to' }, { status: 400 })
    }

    const userId = user.id

    // Tüm sorgular paralel — backend latency'yi minimize ediyoruz.
    const [
      medications,
      illnesses,
      checkups,
      vaccinesAdministered,
      vaccinesUpcoming,
      bloodWork,
      bodyMarks,
      surgeries,
    ] = await Promise.all([
      // Aktif ilaçlar — endDate null veya range sonrası bitenler dahil
      db.medication.findMany({
        where: {
          userId,
          isActive: true,
          deletedAt: null,
          startDate: { lte: to },
          OR: [{ endDate: null }, { endDate: { gte: from } }],
        },
      }),
      // Hastalıklar — overlap: start<=to AND (end>=from OR end null)
      db.healthEvent.findMany({
        where: {
          userId,
          startDate: { lte: to },
          OR: [{ endDate: null }, { endDate: { gte: from } }],
        },
      }),
      db.chronicCondition.findMany({
        where: { userId, nextCheckup: { gte: from, lte: to } },
      }),
      db.vaccination.findMany({
        where: { userId, administeredAt: { gte: from, lte: to } },
      }),
      db.vaccination.findMany({
        where: { userId, nextDoseAt: { gte: from, lte: to } },
      }),
      db.bloodWorkRecord.findMany({
        where: { userId, uploadedAt: { gte: from, lte: to } },
      }),
      db.bodyMark.findMany({
        where: {
          userId,
          isActive: true,
          startDate: { lte: to },
        },
      }),
      db.surgery.findMany({
        where: { userId, performedAt: { gte: from, lte: to } },
      }),
    ])

    const events: CalendarEvent[] = []

    // ─── medication_dose: scheduleTimes × her gün genişletme ───
    // intervalHours / as_needed modlarını burada ATLA — kompleks ve takvimde
    // anlamlı görünmez. Sadece fixed_times.
    const fromDay = startOfUtcDay(from)
    const toDay = startOfUtcDay(to)
    for (const med of medications) {
      if (med.scheduleMode !== 'fixed_times') continue
      if (!med.scheduleTimes || med.scheduleTimes.length === 0) continue

      const medStart = startOfUtcDay(med.startDate)
      const medEnd = med.endDate ? startOfUtcDay(med.endDate) : null
      const allowedDays =
        med.scheduleDays && med.scheduleDays.length > 0 ? new Set(med.scheduleDays) : null // null = her gün

      // Aralıkta her gün için doz üret
      let cursor = new Date(Math.max(fromDay.getTime(), medStart.getTime()))
      const last = medEnd ? new Date(Math.min(toDay.getTime(), medEnd.getTime())) : new Date(toDay)

      while (cursor.getTime() <= last.getTime()) {
        // 1=Pzt ... 7=Pzr (Prisma int[] convention)
        const jsDow = cursor.getUTCDay() // 0=Sun..6=Sat
        const isoDow = jsDow === 0 ? 7 : jsDow
        if (!allowedDays || allowedDays.has(isoDow)) {
          const dKey = dayKey(cursor)
          for (const time of med.scheduleTimes) {
            const startIso = `${dKey}T${time.length === 5 ? `${time}:00` : time}.000Z`
            events.push({
              id: `med-${med.id}-${dKey}-${time}`,
              type: 'medication_dose',
              title: `${med.name} ${med.dosage}`.trim(),
              subtitle: time,
              startDate: startIso,
              timeOfDay: time,
              color: med.color || COLOR.medication,
              icon: ICON.medication,
              sourceType: 'medication',
              sourceId: med.id,
              note: med.notes ?? undefined,
            })
          }
        }
        cursor = new Date(cursor.getTime() + 24 * 3600 * 1000)
      }
    }

    // ─── illness ───
    for (const e of illnesses) {
      const name = trIllnessName(e.type, e.customName)
      events.push({
        id: `ill-${e.id}`,
        type: 'illness',
        title: name.charAt(0).toUpperCase() + name.slice(1),
        subtitle: `Şiddet ${e.severity}/4`,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate ? e.endDate.toISOString() : null,
        color: COLOR.illness,
        icon: ICON.illness,
        sourceType: 'health_event',
        sourceId: e.id,
        note: e.note || undefined,
      })
    }

    // ─── chronic_checkup ───
    for (const c of checkups) {
      if (!c.nextCheckup) continue
      events.push({
        id: `chk-${c.id}`,
        type: 'chronic_checkup',
        title: `${c.name} kontrolü`,
        startDate: c.nextCheckup.toISOString(),
        color: COLOR.checkup,
        icon: ICON.checkup,
        sourceType: 'chronic_condition',
        sourceId: c.id,
        note: c.doctorNote || undefined,
      })
    }

    // ─── vaccine: geçmiş ───
    for (const v of vaccinesAdministered) {
      events.push({
        id: `vac-${v.id}`,
        type: 'vaccine',
        title: `${v.name} (Doz ${v.doseNumber})`,
        startDate: v.administeredAt.toISOString(),
        color: COLOR.vaccine,
        icon: ICON.vaccine,
        sourceType: 'vaccination',
        sourceId: v.id,
        note: v.notes || undefined,
      })
    }

    // ─── vaccine: yaklaşan dozlar ───
    for (const v of vaccinesUpcoming) {
      if (!v.nextDoseAt) continue
      events.push({
        id: `vac-next-${v.id}`,
        type: 'vaccine',
        title: `${v.name} (yaklaşan doz)`,
        subtitle: 'Hatırlatma',
        startDate: v.nextDoseAt.toISOString(),
        color: COLOR.vaccine,
        icon: ICON.vaccine,
        sourceType: 'vaccination',
        sourceId: v.id,
      })
    }

    // ─── blood_test ───
    for (const b of bloodWork) {
      const analysis = (b.analysis as { healthScore?: number }) ?? {}
      const score = analysis.healthScore
      events.push({
        id: `blood-${b.id}`,
        type: 'blood_test',
        title: 'Kan tahlili',
        subtitle: typeof score === 'number' ? `Skor: ${score}/100` : undefined,
        startDate: b.uploadedAt.toISOString(),
        color: COLOR.blood,
        icon: ICON.blood,
        sourceType: 'blood_work',
        sourceId: b.id,
      })
    }

    // ─── body_mark ───
    for (const m of bodyMarks) {
      const region = REGION_TR_MAP[m.region] ?? m.region
      const type = MARK_TYPE_TR[m.type] ?? m.type
      events.push({
        id: `mark-${m.id}`,
        type: 'body_mark',
        title: `${region}: ${type}`,
        subtitle: `Şiddet ${m.severity}/4`,
        startDate: m.startDate.toISOString(),
        endDate: m.endDate ? m.endDate.toISOString() : null,
        color: COLOR.body_mark,
        icon: ICON.body_mark,
        sourceType: 'body_mark',
        sourceId: m.id,
        note: m.note || undefined,
      })
    }

    // ─── surgery ───
    for (const s of surgeries) {
      events.push({
        id: `surg-${s.id}`,
        type: 'surgery',
        title: `${s.name} ameliyatı`,
        subtitle: s.hospital || undefined,
        startDate: s.performedAt.toISOString(),
        color: COLOR.surgery,
        icon: ICON.surgery,
        sourceType: 'surgery',
        sourceId: s.id,
        note: s.recoveryNotes || undefined,
      })
    }

    // Tarih sırasına diz
    events.sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0))

    return NextResponse.json({ events })
  } catch (error) {
    console.error('[calendar/events GET]', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
