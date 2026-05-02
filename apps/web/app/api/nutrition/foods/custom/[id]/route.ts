import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const PATCH = withAuth(async (req, { user, params }) => {
  try {
    const p = await Promise.resolve(params)
    const id = p?.id as string
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const existing = await db.customFood.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const data: any = {}
    const fields = [
      'name',
      'brand',
      'barcode',
      'photoUrl',
      'servingSize',
      'servingUnit',
      'calories',
      'proteinG',
      'carbsG',
      'fatG',
      'fiberG',
      'sugarG',
      'addedSugarG',
      'saturatedFatG',
      'monounsaturatedFatG',
      'polyunsaturatedFatG',
      'transFatG',
      'cholesterolMg',
      'sodiumMg',
      'saltMg',
      'waterG',
      'alcoholG',
      'micros',
    ]
    for (const f of fields) {
      if (body[f] !== undefined)
        data[f] = typeof body[f] === 'string' || body[f] === null ? body[f] : Number(body[f])
    }
    if (body.micros !== undefined) data.micros = body.micros

    const customFood = await db.customFood.update({ where: { id }, data })
    return NextResponse.json({ customFood })
  } catch (err) {
    console.error('[foods/custom/[id] PATCH]', err)
    return NextResponse.json({ error: 'Güncellenemedi' }, { status: 500 })
  }
})

export const DELETE = withAuth(async (_req, { user, params }) => {
  try {
    const p = await Promise.resolve(params)
    const id = p?.id as string
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const existing = await db.customFood.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.customFood.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[foods/custom/[id] DELETE]', err)
    return NextResponse.json({ error: 'Silinemedi' }, { status: 500 })
  }
})
