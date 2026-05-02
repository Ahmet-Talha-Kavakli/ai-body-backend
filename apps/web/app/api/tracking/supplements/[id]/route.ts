import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type RouteContext = { params: Promise<{ id: string }> }

const PatchSchema = z.object({
  taken: z.boolean(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  scheduledTime: z.string().max(5).optional(), // "08:30" — hangi saat için
})

const PutSchema = z.object({
  scheduleTimes: z.array(z.string().max(5)).optional(),
  scheduleDays: z.array(z.number().int().min(0).max(6)).optional(),
  reminderAt: z.string().max(5).nullable().optional(),
  dosage: z.string().max(50).optional(),
  unit: z.string().max(20).optional(),
})

// PATCH: tek saat için taken toggle
export const PATCH = withAuth(
  async (
    req: NextRequest,
    { user, params: paramsPromise }: { user: { id: string }; params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await (paramsPromise as RouteContext['params'])
      const body = await req.json()
      const parsed = PatchSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
      }

      const { taken, date, scheduledTime } = parsed.data
      const dateStr = date ?? new Date().toISOString().slice(0, 10)
      const dayStart = new Date(`${dateStr}T00:00:00.000Z`)
      const dayEnd = new Date(`${dateStr}T23:59:59.999Z`)

      const supplement = await db.supplement.findFirst({
        where: { id, userId: user.id, isActive: true },
      })
      if (!supplement) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      if (taken) {
        const existing = await db.supplementLog.findFirst({
          where: {
            supplementId: id,
            userId: user.id,
            takenAt: { gte: dayStart, lte: dayEnd },
            ...(scheduledTime ? { scheduledTime } : {}),
          },
        })
        if (!existing) {
          await db.supplementLog.create({
            data: {
              supplementId: id,
              userId: user.id,
              date: dateStr,
              takenAt: new Date(`${dateStr}T12:00:00.000Z`),
              scheduledTime: scheduledTime ?? null,
            },
          })
        }
      } else {
        await db.supplementLog.deleteMany({
          where: {
            supplementId: id,
            userId: user.id,
            takenAt: { gte: dayStart, lte: dayEnd },
            ...(scheduledTime ? { scheduledTime } : {}),
          },
        })
      }

      return NextResponse.json({ ok: true, taken })
    } catch (error) {
      console.error('[supplement PATCH]', error)
      return NextResponse.json({ error: 'Failed to update supplement' }, { status: 500 })
    }
  }
)

// PUT: supplement ayarlarını güncelle (scheduleTimes, reminderAt, doz)
export const PUT = withAuth(
  async (
    req: NextRequest,
    { user, params: paramsPromise }: { user: { id: string }; params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await (paramsPromise as RouteContext['params'])
      const body = await req.json()
      const parsed = PutSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
      }

      const supplement = await db.supplement.findFirst({ where: { id, userId: user.id } })
      if (!supplement) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      const updated = await db.supplement.update({
        where: { id },
        data: {
          ...(parsed.data.scheduleTimes !== undefined && {
            scheduleTimes: parsed.data.scheduleTimes,
          }),
          ...(parsed.data.scheduleDays !== undefined && { scheduleDays: parsed.data.scheduleDays }),
          ...(parsed.data.reminderAt !== undefined && { reminderAt: parsed.data.reminderAt }),
          ...(parsed.data.dosage !== undefined && { dosage: parsed.data.dosage }),
          ...(parsed.data.unit !== undefined && { unit: parsed.data.unit }),
        },
      })

      return NextResponse.json(updated)
    } catch (error) {
      console.error('[supplement PUT]', error)
      return NextResponse.json({ error: 'Failed to update supplement' }, { status: 500 })
    }
  }
)

// DELETE: soft delete
export const DELETE = withAuth(
  async (
    req: NextRequest,
    { user, params: paramsPromise }: { user: { id: string }; params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await (paramsPromise as RouteContext['params'])

      const supplement = await db.supplement.findFirst({ where: { id, userId: user.id } })
      if (!supplement) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      await db.supplement.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({ ok: true })
    } catch (error) {
      console.error('[supplement DELETE]', error)
      return NextResponse.json({ error: 'Failed to delete supplement' }, { status: 500 })
    }
  }
)
