import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type OrderItem = {
  id: string
  type: 'catalog' | 'custom'
  sortOrder: number
}

type ReorderBody = {
  orders?: OrderItem[]
}

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = (await req.json().catch(() => ({}))) as ReorderBody
    const orders = body.orders

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ error: 'orders array is required' }, { status: 400 })
    }

    for (const o of orders) {
      if (!o || typeof o.id !== 'string' || typeof o.sortOrder !== 'number') {
        return NextResponse.json({ error: 'Invalid order item' }, { status: 400 })
      }
      if (o.type !== 'catalog' && o.type !== 'custom') {
        return NextResponse.json({ error: 'Invalid order type' }, { status: 400 })
      }
    }

    const ops = orders.map((o) => {
      if (o.type === 'catalog') {
        return db.userDrinkPreference.upsert({
          where: { userId_catalogId: { userId: user.id, catalogId: o.id } },
          create: {
            userId: user.id,
            catalogId: o.id,
            sortOrder: o.sortOrder,
          },
          update: { sortOrder: o.sortOrder },
        })
      }
      return db.userCustomDrink.updateMany({
        where: { id: o.id, userId: user.id },
        data: { sortOrder: o.sortOrder },
      })
    })

    await db.$transaction(ops)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[water/drinks/reorder POST]', err)
    return NextResponse.json({ error: 'Failed to reorder drinks' }, { status: 500 })
  }
})
