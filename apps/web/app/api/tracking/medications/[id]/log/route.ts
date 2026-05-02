import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type RouteContext = { params: Promise<{ id: string }> }

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

// POST: ilaç al / atla
export const POST = withAuth(
  async (
    req: NextRequest,
    { user, params: paramsPromise }: { user: { id: string }; params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await (paramsPromise as RouteContext['params'])
      const body = (await req.json()) as {
        taken: boolean
        date?: string
        scheduledTime?: string | null
        takenAt?: string
      }

      if (typeof body.taken !== 'boolean') {
        return NextResponse.json({ error: 'taken (boolean) required' }, { status: 400 })
      }

      const medication = await db.medication.findUnique({ where: { id } })
      if (!medication) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      if (medication.userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const date = body.date ?? todayStr()
      const scheduledTime = body.scheduledTime ?? null
      const skipped = !body.taken
      const takenAt = body.takenAt ? new Date(body.takenAt) : new Date()

      // Var olan log'u bul (medicationId + date + scheduledTime null-match dahil)
      const existing = await db.medicationLog.findFirst({
        where: {
          medicationId: id,
          userId: user.id,
          date,
          scheduledTime: scheduledTime,
        },
      })

      let log
      if (existing) {
        log = await db.medicationLog.update({
          where: { id: existing.id },
          data: { takenAt, skipped },
        })
      } else {
        log = await db.medicationLog.create({
          data: {
            medicationId: id,
            userId: user.id,
            date,
            scheduledTime,
            takenAt,
            skipped,
          },
        })
      }

      // Stok takibi: yalnızca taken=true & skipped=false & stockCount tanımlı & yeni alındıysa
      let stockCount = medication.stockCount
      const wasTaken = existing && !existing.skipped
      const nowTaken = body.taken && !skipped
      if (nowTaken && !wasTaken && medication.stockCount != null) {
        const updated = await db.medication.update({
          where: { id },
          data: { stockCount: Math.max(0, medication.stockCount - 1) },
        })
        stockCount = updated.stockCount
      }

      return NextResponse.json({
        success: true,
        log,
        medication: { stockCount },
      })
    } catch (err) {
      console.error('[medications log POST]', err)
      return NextResponse.json({ error: 'Failed to log medication' }, { status: 500 })
    }
  }
)

// DELETE: log'u geri al
export const DELETE = withAuth(
  async (
    req: NextRequest,
    { user, params: paramsPromise }: { user: { id: string }; params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await (paramsPromise as RouteContext['params'])
      const { searchParams } = new URL(req.url)
      const date = searchParams.get('date') ?? todayStr()
      const scheduledTimeParam = searchParams.get('scheduledTime')
      const scheduledTime =
        scheduledTimeParam && scheduledTimeParam.length > 0 ? scheduledTimeParam : null

      const medication = await db.medication.findUnique({ where: { id } })
      if (!medication) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      if (medication.userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const existing = await db.medicationLog.findFirst({
        where: {
          medicationId: id,
          userId: user.id,
          date,
          scheduledTime,
        },
      })

      if (existing) {
        await db.medicationLog.delete({ where: { id: existing.id } })

        // Stok geri ekle (sadece alınmıştı ise)
        if (!existing.skipped && medication.stockCount != null) {
          await db.medication.update({
            where: { id },
            data: { stockCount: medication.stockCount + 1 },
          })
        }
      }

      return NextResponse.json({ success: true })
    } catch (err) {
      console.error('[medications log DELETE]', err)
      return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 })
    }
  }
)
