import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

/**
 * DELETE /api/nutrition/recipes/[id]
 */
export const DELETE = withAuth(async (_req, { user, params }) => {
  try {
    const p = await Promise.resolve(params)
    const id = p?.id as string
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const recipe = await db.recipe.findFirst({ where: { id, userId: user.id } })
    if (!recipe) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.recipe.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[recipes DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 })
  }
})
