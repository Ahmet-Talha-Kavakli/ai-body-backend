import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

// ─── GET: günün tüm içecek logları (otomat alt rafı için) ──────────────────────
export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const dateParam = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().slice(0, 10)
    const dayStart = new Date(dateParam + 'T00:00:00.000Z')
    const dayEnd = new Date(dateParam + 'T23:59:59.999Z')

    const logs = await db.drinkLog.findMany({
      where: {
        userId: user.id,
        date: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        drinkType: true,
        amountMl: true,
        catalogId: true,
        createdAt: true,
      },
    })

    // Catalog enrich — hidrasyon, kafein, şeker, isim
    const catalogIds = Array.from(new Set(logs.map((l) => l.catalogId).filter(Boolean) as string[]))
    const catalogItems =
      catalogIds.length > 0
        ? await db.drinkCatalog.findMany({
            where: { id: { in: catalogIds } },
            select: {
              id: true,
              nametr: true,
              hydrationValue: true,
              caffeinePerServing: true,
              sugarPerServing: true,
            },
          })
        : []
    const catMap = new Map(catalogItems.map((c) => [c.id, c]))

    // AI skorları
    const userScores =
      catalogIds.length > 0
        ? await db.userDrinkScore.findMany({
            where: { userId: user.id, catalogId: { in: catalogIds } },
            select: { catalogId: true, score: true, aiNote: true },
          })
        : []
    const scoreMap = new Map(userScores.map((s) => [s.catalogId, s]))

    const enrichedLogs = logs.map((l) => {
      const cat = l.catalogId ? catMap.get(l.catalogId) : null
      const score = l.catalogId ? scoreMap.get(l.catalogId) : null
      return {
        ...l,
        nametr: cat?.nametr ?? null,
        hydrationValue: cat?.hydrationValue ?? null,
        caffeinePerServing: cat?.caffeinePerServing ?? null,
        sugarPerServing: cat?.sugarPerServing ?? null,
        aiScore: score?.score ?? null,
        aiNote: score?.aiNote ?? null,
      }
    })

    // Su toplamı
    const dateOnly = new Date(dateParam + 'T00:00:00.000Z')
    const waterLog = await db.waterLog.findUnique({
      where: { userId_date: { userId: user.id, date: dateOnly } },
    })

    return NextResponse.json({
      logs: enrichedLogs,
      totalMl: waterLog?.amountMl ?? 0,
    })
  } catch (error) {
    console.error('[water/logs GET]', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
})

// ─── POST: yeni içecek logu ────────────────────────────────────────────────────
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = (await req.json()) as {
      amountMl: number
      date?: string
      catalogId?: string
      category?: string // "water" | "tea" | "coffee" | ...
    }
    const { amountMl, date, catalogId, category } = body

    if (!amountMl || amountMl <= 0 || amountMl > 5000) {
      return NextResponse.json({ error: 'Invalid amountMl' }, { status: 400 })
    }

    const dateStr = date ?? new Date().toISOString().slice(0, 10)
    const dateStart = new Date(dateStr + 'T00:00:00.000Z')

    // Eğer catalogId varsa, kategoriyi otomatik bul
    let drinkType = category ?? 'water'
    if (catalogId && !category) {
      const catalogItem = await db.drinkCatalog.findUnique({
        where: { id: catalogId },
        select: { category: true },
      })
      if (catalogItem) drinkType = catalogItem.category
    }

    // 1. Her zaman DrinkLog'a kategoriyle yaz
    const drinkLog = await db.drinkLog.create({
      data: {
        userId: user.id,
        date: dateStart,
        drinkType,
        amountMl,
        catalogId: catalogId ?? null,
      },
    })

    // 2. Sadece su ise WaterLog toplamını arttır (hedef takibi için)
    let totalMl = 0
    if (drinkType === 'water') {
      const log = await db.waterLog.upsert({
        where: { userId_date: { userId: user.id, date: dateStart } },
        create: { userId: user.id, date: dateStart, amountMl, glasses: 1 },
        update: {
          amountMl: { increment: amountMl },
          glasses: { increment: 1 },
        },
      })
      totalMl = log.amountMl
    } else {
      const existing = await db.waterLog.findUnique({
        where: { userId_date: { userId: user.id, date: dateStart } },
      })
      totalMl = existing?.amountMl ?? 0
    }

    return NextResponse.json({
      success: true,
      log: {
        id: drinkLog.id,
        drinkType: drinkLog.drinkType,
        amountMl: drinkLog.amountMl,
        catalogId: drinkLog.catalogId,
        createdAt: drinkLog.createdAt,
      },
      totalMl,
    })
  } catch (error) {
    console.error('[water/logs POST]', error)
    return NextResponse.json({ error: 'Failed to log drink' }, { status: 500 })
  }
})

// ─── PATCH: log miktarı güncelle ───────────────────────────────────────────────
export const PATCH = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = (await req.json()) as { id: string; amountMl: number }
    const { id, amountMl } = body

    if (!id || !amountMl || amountMl <= 0 || amountMl > 5000) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const log = await db.drinkLog.findUnique({ where: { id } })
    if (!log || log.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const diff = amountMl - log.amountMl

    // Eğer su ise WaterLog toplamını da güncelle
    if (log.drinkType === 'water' && diff !== 0) {
      const dateStart = new Date(log.date)
      dateStart.setUTCHours(0, 0, 0, 0)
      await db.waterLog.update({
        where: { userId_date: { userId: user.id, date: dateStart } },
        data: { amountMl: { increment: diff } },
      })
    }

    const updated = await db.drinkLog.update({
      where: { id },
      data: { amountMl },
    })

    return NextResponse.json({ success: true, log: updated })
  } catch (error) {
    console.error('[water/logs PATCH]', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
})

// ─── DELETE: log sil (id ile) ──────────────────────────────────────────────────
export const DELETE = withAuth(async (req: NextRequest, { user }) => {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const log = await db.drinkLog.findUnique({ where: { id } })
    if (!log || log.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Eğer su ise WaterLog'tan da düş
    if (log.drinkType === 'water') {
      const dateStart = new Date(log.date)
      dateStart.setUTCHours(0, 0, 0, 0)
      await db.waterLog.update({
        where: { userId_date: { userId: user.id, date: dateStart } },
        data: {
          amountMl: { decrement: log.amountMl },
          glasses: { decrement: 1 },
        },
      })
    }

    await db.drinkLog.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[water/logs DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
})
