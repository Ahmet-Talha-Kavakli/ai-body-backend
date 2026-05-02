import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

const PostSchema = z.object({
  name: z.string().min(1).max(100),
  brand: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
  type: z.string().max(30).default('genel'),
  barcode: z.string().max(50).optional(),
  country: z.string().max(50).optional(),
  dosage: z.string().min(1).max(50),
  unit: z.string().max(20).default('mg'),
  scheduleTimes: z.array(z.string().max(5)).default([]),
  scheduleDays: z.array(z.number().int().min(0).max(6)).default([]),
  aiScore: z.string().optional(),
  aiNote: z.string().max(500).optional(),
  reminderAt: z.string().max(5).optional(),
})

export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date')
    const date = dateParam ?? new Date().toISOString().slice(0, 10)

    const dayStart = new Date(`${date}T00:00:00.000Z`)
    const dayEnd = new Date(`${date}T23:59:59.999Z`)

    const supplements = await db.supplement.findMany({
      where: {
        userId: user.id,
        createdAt: { lte: dayEnd },
        OR: [{ isActive: true }, { updatedAt: { gt: dayEnd } }],
      },
      include: {
        logs: {
          where: { takenAt: { gte: dayStart, lte: dayEnd } },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(
      supplements.map((s) => ({
        id: s.id,
        name: s.name,
        brand: s.brand,
        category: s.category,
        type: s.type,
        dosage: s.dosage,
        unit: s.unit,
        scheduleTimes: s.scheduleTimes,
        scheduleDays: s.scheduleDays,
        aiScore: s.aiScore,
        aiNote: s.aiNote,
        reminderAt: s.reminderAt,
        takenTimes: s.logs.map((l) => l.scheduledTime).filter(Boolean) as string[],
        takenLogs: s.logs.map((l) => ({
          scheduledTime: l.scheduledTime ?? null,
          takenAt: l.takenAt.toISOString(),
        })),
        taken: s.logs.length > 0,
        logId: s.logs[0]?.id ?? null,
        createdAt: s.createdAt,
      }))
    )
  } catch (error) {
    console.error('[supplements GET]', error)
    return NextResponse.json({ error: 'Failed to fetch supplements' }, { status: 500 })
  }
})

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json()
    const parsed = PostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      name,
      brand,
      category,
      type,
      barcode,
      country,
      dosage,
      unit,
      scheduleTimes,
      scheduleDays,
      aiScore,
      aiNote,
      reminderAt,
    } = parsed.data

    const supplement = await db.supplement.create({
      data: {
        userId: user.id,
        name,
        brand,
        category,
        type,
        barcode,
        country,
        dosage,
        unit,
        scheduleTimes,
        scheduleDays,
        aiScore,
        aiNote,
        reminderAt,
      },
    })

    return NextResponse.json(supplement, { status: 201 })
  } catch (error) {
    console.error('[supplements POST]', error)
    return NextResponse.json({ error: 'Failed to create supplement' }, { status: 500 })
  }
})
