import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type RouteContext = { params: Promise<{ id: string }> }

const VALID_SCHEDULE_MODES = ['fixed_times', 'interval_hours', 'as_needed'] as const

// PATCH: ilacı güncelle
export const PATCH = withAuth(
  async (
    req: NextRequest,
    { user, params: paramsPromise }: { user: { id: string }; params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await (paramsPromise as RouteContext['params'])
      const body = (await req.json()) as Record<string, any>

      const medication = await db.medication.findUnique({ where: { id } })
      if (!medication) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      if (medication.userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      if (body.scheduleMode && !VALID_SCHEDULE_MODES.includes(body.scheduleMode)) {
        return NextResponse.json({ error: 'Invalid scheduleMode' }, { status: 400 })
      }

      const data: Record<string, any> = {}
      const fields = [
        'name',
        'dosage',
        'unit',
        'type',
        'color',
        'notes',
        'scheduleMode',
        'scheduleTimes',
        'scheduleDays',
        'intervalHours',
        'stockCount',
        'refillThreshold',
        'remindersOn',
        'isActive',
      ]
      for (const f of fields) {
        if (f in body) data[f] = body[f]
      }
      if ('startDate' in body && body.startDate) data.startDate = new Date(body.startDate)
      if ('endDate' in body) data.endDate = body.endDate ? new Date(body.endDate) : null

      const updated = await db.medication.update({ where: { id }, data })
      return NextResponse.json(updated)
    } catch (err) {
      console.error('[medications PATCH]', err)
      return NextResponse.json({ error: 'Failed to update medication' }, { status: 500 })
    }
  }
)

// DELETE: soft delete (isActive = false)
export const DELETE = withAuth(
  async (
    _req: NextRequest,
    { user, params: paramsPromise }: { user: { id: string }; params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await (paramsPromise as RouteContext['params'])

      const medication = await db.medication.findUnique({ where: { id } })
      if (!medication) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      if (medication.userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Soft delete — deletedAt set, geçmiş tarihler için hâlâ görünür kalır
      await db.medication.update({
        where: { id },
        data: { isActive: false, deletedAt: new Date() },
      })
      return NextResponse.json({ success: true })
    } catch (err) {
      console.error('[medications DELETE]', err)
      return NextResponse.json({ error: 'Failed to delete medication' }, { status: 500 })
    }
  }
)
