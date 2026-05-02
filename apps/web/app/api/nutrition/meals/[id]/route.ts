import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

const MICRO_KEYS = [
  'vitA',
  'vitC',
  'vitD',
  'vitE',
  'vitK',
  'b1',
  'b2',
  'b3',
  'b6',
  'b9',
  'b12',
  'Ca',
  'Fe',
  'Mg',
  'P',
  'K',
  'Zn',
  'Se',
  'Cu',
  'Mn',
] as const

function sumItems(items: any[]) {
  const totals = {
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
    sugarG: 0,
    addedSugarG: 0,
    satFatG: 0,
    monoFatG: 0,
    polyFatG: 0,
    transFatG: 0,
    cholesterolMg: 0,
    sodiumMg: 0,
    saltMg: 0,
    alcoholG: 0,
    micros: Object.fromEntries(MICRO_KEYS.map((k) => [k, 0])) as Record<string, number>,
  }
  for (const it of items) {
    const q = Number(it.quantity) || 1
    totals.calories += (Number(it.calories) || 0) * q
    totals.proteinG += (Number(it.proteinG) || 0) * q
    totals.carbsG += (Number(it.carbsG) || 0) * q
    totals.fatG += (Number(it.fatG) || 0) * q
    totals.fiberG += (Number(it.fiberG) || 0) * q
    totals.sugarG += (Number(it.sugarG) || 0) * q
    totals.addedSugarG += (Number(it.addedSugarG) || 0) * q
    totals.satFatG += (Number(it.saturatedFatG) || 0) * q
    totals.monoFatG += (Number(it.monounsaturatedFatG) || 0) * q
    totals.polyFatG += (Number(it.polyunsaturatedFatG) || 0) * q
    totals.transFatG += (Number(it.transFatG) || 0) * q
    totals.cholesterolMg += (Number(it.cholesterolMg) || 0) * q
    totals.sodiumMg += (Number(it.sodiumMg) || 0) * q
    totals.saltMg += (Number(it.saltMg) || 0) * q
    totals.alcoholG += (Number(it.alcoholG) || 0) * q
    if (it.micros) {
      for (const k of MICRO_KEYS) {
        totals.micros[k] += (Number(it.micros[k]) || 0) * q
      }
    }
  }
  return totals
}

export const GET = withAuth(async (_req, { user, params }) => {
  const p = await Promise.resolve(params)
  const id = p?.id as string
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const meal = await db.mealLog.findFirst({
    where: { id, userId: user.id },
    include: { analysis: true },
  })
  if (!meal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ meal })
})

export const PATCH = withAuth(async (req, { user, params }) => {
  try {
    const p = await Promise.resolve(params)
    const id = p?.id as string
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const existing = await db.mealLog.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const { mealType, items, loggedAt, notes, photoUrl } = body

    const data: any = {}
    if (mealType) data.mealType = mealType
    if (loggedAt) data.loggedAt = new Date(loggedAt)
    if (notes !== undefined) data.notes = notes
    if (photoUrl !== undefined) data.photoUrl = photoUrl

    if (Array.isArray(items)) {
      const t = sumItems(items)
      data.items = items
      data.totalCalories = t.calories
      data.totalProteinG = t.proteinG
      data.totalCarbsG = t.carbsG
      data.totalFatG = t.fatG
      data.totalFiberG = t.fiberG
      data.totalSugarG = t.sugarG
      data.totalAddedSugarG = t.addedSugarG
      data.totalSatFatG = t.satFatG
      data.totalMonoFatG = t.monoFatG
      data.totalPolyFatG = t.polyFatG
      data.totalTransFatG = t.transFatG
      data.totalCholesterolMg = t.cholesterolMg
      data.totalSodiumMg = t.sodiumMg
      data.totalSaltMg = t.saltMg
      data.totalAlcoholG = t.alcoholG
      data.totalMicros = t.micros
    }

    const meal = await db.mealLog.update({ where: { id }, data })
    return NextResponse.json({ meal })
  } catch (err) {
    console.error('[meals PATCH]', err)
    return NextResponse.json({ error: 'Failed to update meal' }, { status: 500 })
  }
})

export const DELETE = withAuth(async (_req, { user, params }) => {
  try {
    const p = await Promise.resolve(params)
    const id = p?.id as string
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const meal = await db.mealLog.findFirst({ where: { id, userId: user.id } })
    if (!meal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.mealLog.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[meals DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete meal' }, { status: 500 })
  }
})
