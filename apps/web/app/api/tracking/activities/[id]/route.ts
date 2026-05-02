import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type RouteContext = { params: Promise<{ id: string }> }

const PatchSchema = z.object({
  duration: z.number().int().min(1).max(1440).optional(),
  distance: z.number().min(0).max(1000).optional(),
  intensity: z.enum(['low', 'medium', 'high']).optional(),
  calories: z.number().int().min(0).max(10000).optional(),
  note: z.string().max(200).nullable().optional(),
  imageUrls: z.array(z.string().url().max(500)).max(4).optional(),
  completed: z.boolean().optional(),
})

export const PATCH = withAuth(
  async (req: NextRequest, { user, params }: { user: { id: string } } & RouteContext) => {
    const { id } = await params
    const body = await req.json()
    const parsed = PatchSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const existing = await db.activityLog.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await db.activityLog.update({ where: { id }, data: parsed.data })
    return NextResponse.json(updated)
  }
)

export const DELETE = withAuth(
  async (req: NextRequest, { user, params }: { user: { id: string } } & RouteContext) => {
    const { id } = await params
    const existing = await db.activityLog.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.activityLog.delete({ where: { id } })
    return NextResponse.json({ success: true })
  }
)
