import { NextRequest, NextResponse } from 'next/server'
import { auth, verifyToken } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

async function resolveUser(req: NextRequest) {
  let clerkId: string | null = null
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = await verifyToken(authHeader.slice(7).trim(), {
        secretKey: process.env.CLERK_SECRET_KEY!,
      })
      clerkId = payload.sub ?? null
    } catch {
      return null
    }
  } else {
    const { userId } = await auth()
    clerkId = userId
  }
  if (!clerkId) return null
  return db.user.findUnique({ where: { clerkId } })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await resolveUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await db.pantryItem.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = (await req.json()) as {
      name?: string
      category?: string | null
      quantity?: number | null
      unit?: string | null
      expiresAt?: string | null
      photoUrl?: string | null
      notes?: string | null
      isLowStock?: boolean
    }

    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = body.name.trim()
    if (body.category !== undefined) data.category = body.category
    if (body.quantity !== undefined) data.quantity = body.quantity
    if (body.unit !== undefined) data.unit = body.unit
    if (body.expiresAt !== undefined)
      data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null
    if (body.photoUrl !== undefined) data.photoUrl = body.photoUrl
    if (body.notes !== undefined) data.notes = body.notes
    if (body.isLowStock !== undefined) data.isLowStock = body.isLowStock

    const item = await db.pantryItem.update({ where: { id }, data })
    return NextResponse.json({ item })
  } catch (err) {
    console.error('[pantry/items/:id PATCH]', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await resolveUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await db.pantryItem.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await db.pantryItem.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[pantry/items/:id DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
