import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const POST = withAuth(async (req, { user }) => {
  try {
    const body = (await req.json()) as {
      items: Array<{
        name: string
        category?: string | null
        quantity?: number | null
        unit?: string | null
        expiresAt?: string | null
        photoUrl?: string | null
        notes?: string | null
      }>
      source?: string
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'items array required' }, { status: 400 })
    }

    const source = body.source ?? 'photo_scan'
    const data = body.items
      .filter((it) => it.name && typeof it.name === 'string')
      .map((it) => ({
        userId: user.id,
        name: it.name.trim(),
        category: it.category ?? null,
        quantity: it.quantity ?? null,
        unit: it.unit ?? null,
        expiresAt: it.expiresAt ? new Date(it.expiresAt) : null,
        photoUrl: it.photoUrl ?? null,
        notes: it.notes ?? null,
        source,
        isLowStock: false,
      }))

    if (data.length === 0) {
      return NextResponse.json({ items: [], inserted: 0 })
    }

    const result = await db.pantryItem.createMany({ data })
    const items = await db.pantryItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: data.length,
    })

    return NextResponse.json({ items, inserted: result.count })
  } catch (err) {
    console.error('[pantry/items/bulk POST]', err)
    return NextResponse.json({ error: 'Failed to bulk create' }, { status: 500 })
  }
})
