import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { allergies: true } })
  return NextResponse.json({ allergies: dbUser?.allergies ?? [] })
})

export const PATCH = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json()
  const parsed = z.object({ allergies: z.array(z.string()) }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const updated = await db.user.update({
    where: { id: user.id },
    data: { allergies: parsed.data.allergies },
    select: { allergies: true },
  })
  return NextResponse.json({ allergies: updated.allergies })
})
