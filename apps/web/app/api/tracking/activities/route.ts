import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

const PostSchema = z.object({
  activityType: z.string().min(1).max(50),
  subType: z.string().max(60).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().max(5).optional(),
  duration: z.number().int().min(1).max(1440),
  distance: z.number().min(0).max(1000).optional(),
  intensity: z.enum(['low', 'medium', 'high']).default('medium'),
  calories: z.number().int().min(0).max(10000).optional(),
  note: z.string().max(200).optional(),
  imageUrls: z.array(z.string().url().max(500)).max(4).optional(),
  comboTag: z.string().max(50).optional(),
  isGoal: z.boolean().default(false),
})

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)

  const logs = await db.activityLog.findMany({
    where: { userId: user.id, date },
    orderBy: { createdAt: 'asc' },
  })

  // Enrich with subType Turkish name
  const subTypeKeys = logs.map((l) => l.subType).filter(Boolean) as string[]
  const subTypes = subTypeKeys.length
    ? await db.activitySubType.findMany({
        where: { key: { in: subTypeKeys } },
        select: { key: true, nametr: true },
      })
    : []
  const subTypeMap = Object.fromEntries(subTypes.map((s) => [s.key, s.nametr]))

  return NextResponse.json(
    logs.map((l) => ({ ...l, subTypeNametr: l.subType ? (subTypeMap[l.subType] ?? null) : null }))
  )
})

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json()
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const data = parsed.data

  // Kalori: subType varsa subType MET'ini, yoksa catalog MET'ini kullan
  let calories = data.calories
  if (!calories) {
    const healthProfile = await db.healthProfile.findUnique({ where: { userId: user.id } })
    if (healthProfile) {
      let metValue: number | null = null
      if (data.subType) {
        const sub = await db.activitySubType.findUnique({ where: { key: data.subType } })
        if (sub) metValue = sub.metValue
      }
      if (!metValue) {
        const catalog = await db.activityCatalog.findUnique({
          where: { activityType: data.activityType },
        })
        if (catalog) metValue = catalog.metValue
      }
      if (metValue) {
        const INTENSITY_MULTIPLIER: Record<string, number> = { low: 0.8, medium: 1.0, high: 1.25 }
        const multiplier = INTENSITY_MULTIPLIER[data.intensity] ?? 1.0
        calories = Math.round(metValue * multiplier * healthProfile.weightKg * (data.duration / 60))
      }
    }
  }

  const log = await db.activityLog.create({
    data: {
      userId: user.id,
      activityType: data.activityType,
      subType: data.subType,
      date: data.date,
      startTime: data.startTime,
      duration: data.duration,
      distance: data.distance,
      intensity: data.intensity,
      calories,
      note: data.note,
      imageUrls: data.imageUrls ?? [],
      comboTag: data.comboTag,
      isGoal: data.isGoal,
    },
  })

  return NextResponse.json(log, { status: 201 })
})
