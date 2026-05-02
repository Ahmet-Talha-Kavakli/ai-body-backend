import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (_req, { user }) => {
  try {
    const items = await db.pantryItem.findMany({
      where: { userId: user.id },
      orderBy: [{ expiresAt: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ items })
  } catch (err) {
    console.error('[pantry/items GET]', err)
    return NextResponse.json({ error: 'Failed to fetch pantry items' }, { status: 500 })
  }
})

export const POST = withAuth(async (req, { user }) => {
  try {
    const body = (await req.json()) as {
      name: string
      category?: string | null
      quantity?: number | null
      unit?: string | null
      expiresAt?: string | null
      photoUrl?: string | null
      source?: string
      notes?: string | null
      isLowStock?: boolean
    }

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const item = await db.pantryItem.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        category: body.category ?? null,
        quantity: body.quantity ?? null,
        unit: body.unit ?? null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        photoUrl: body.photoUrl ?? null,
        source: body.source ?? 'manual',
        notes: body.notes ?? null,
        isLowStock: body.isLowStock ?? false,
      },
    })

    return NextResponse.json({ item })
  } catch (err) {
    console.error('[pantry/items POST]', err)
    return NextResponse.json({ error: 'Failed to create pantry item' }, { status: 500 })
  }
})
