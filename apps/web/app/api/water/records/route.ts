import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  try {
    const [allLogs, waterStreak, settings] = await Promise.all([
      db.drinkLog.findMany({
        where: { userId: user.id },
        select: { date: true, amountMl: true, drinkType: true, catalogId: true },
        orderBy: { date: 'asc' },
      }),
      db.waterStreak.findUnique({ where: { userId: user.id } }),
      db.waterSettings.findUnique({ where: { userId: user.id } }),
    ])

    if (allLogs.length === 0) {
      return NextResponse.json({ empty: true })
    }

    const goalMl = settings?.dailyGoalMl ?? 2500

    // ── Günlük toplam hesapla ──────────────────────────────────────────────────
    const dailyMap = new Map<string, number>() // "2025-04-12" → totalMl
    for (const log of allLogs) {
      const key = log.date.toISOString().slice(0, 10)
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + log.amountMl)
    }

    const dailyEntries = Array.from(dailyMap.entries()).map(([date, ml]) => ({ date, ml }))

    // En iyi gün
    const bestDayEntry = dailyEntries.reduce((a, b) => (a.ml >= b.ml ? a : b))
    const sortedByMl = [...dailyEntries].sort((a, b) => b.ml - a.ml)
    const prevBestMl = sortedByMl[1]?.ml ?? null
    const bestDayDiff = prevBestMl != null ? Math.round(bestDayEntry.ml - prevBestMl) : null

    // ── Streak ────────────────────────────────────────────────────────────────
    const longestStreak = waterStreak?.longestStreak ?? 0
    const currentStreak = waterStreak?.currentStreak ?? 0
    const lastGoalDate = waterStreak?.lastGoalDate

    // ── Toplam hacim + ortalama ────────────────────────────────────────────────
    const totalMl = allLogs.reduce((s, l) => s + l.amountMl, 0)
    const avgDailyMl = Math.round(totalMl / dailyEntries.length)

    // ── Hedef başarı oranı ─────────────────────────────────────────────────────
    const goalHitDays = dailyEntries.filter((d) => d.ml >= goalMl).length
    const goalHitRate = Math.round((goalHitDays / dailyEntries.length) * 100)

    // ── En iyi hafta (Pzt–Paz) ─────────────────────────────────────────────────
    const weekMap = new Map<string, number>() // "2025-W14" → totalMl
    const weekLabelMap = new Map<string, string>() // "2025-W14" → "7–13 Nisan"
    const TR_MONTHS = [
      'Ocak',
      'Şubat',
      'Mart',
      'Nisan',
      'Mayıs',
      'Haziran',
      'Temmuz',
      'Ağustos',
      'Eylül',
      'Ekim',
      'Kasım',
      'Aralık',
    ]

    for (const { date, ml } of dailyEntries) {
      const d = new Date(date)
      const dow = d.getDay() === 0 ? 6 : d.getDay() - 1 // 0=Pzt
      const monday = new Date(d)
      monday.setDate(d.getDate() - dow)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      const wk = `${monday.getFullYear()}-W${String(monday.getMonth() * 5 + monday.getDate()).padStart(3, '0')}`
      weekMap.set(wk, (weekMap.get(wk) ?? 0) + ml)
      weekLabelMap.set(
        wk,
        `${monday.getDate()}–${sunday.getDate()} ${TR_MONTHS[sunday.getMonth()]}`
      )
    }
    const bestWeekEntry = Array.from(weekMap.entries()).reduce((a, b) => (a[1] >= b[1] ? a : b))

    // ── En iyi ay ─────────────────────────────────────────────────────────────
    const monthMap = new Map<string, number>() // "2025-04" → totalMl
    for (const { date, ml } of dailyEntries) {
      const key = date.slice(0, 7)
      monthMap.set(key, (monthMap.get(key) ?? 0) + ml)
    }
    const bestMonthEntry = Array.from(monthMap.entries()).reduce((a, b) => (a[1] >= b[1] ? a : b))
    const [bmy, bmm] = bestMonthEntry[0].split('-')
    const bestMonthLabel = `${TR_MONTHS[parseInt(bmm!) - 1]} ${bmy}`

    // ── En erken hedef saati ──────────────────────────────────────────────────
    // DrinkLog'taki createdAt'ı kullanmak gerekir ama date alanı sadece gün.
    // Şimdilik null döndür — ilerleyen sprint'te DrinkLog'a time bilgisi eklenince aktif edilir.
    const earliestGoalTime: string | null = null

    // ── İçecek sıralaması ─────────────────────────────────────────────────────
    const drinkMlMap = new Map<string, number>() // catalogId → totalMl
    const drinkCountMap = new Map<string, number>() // catalogId → count
    const drinkBestDayMap = new Map<string, number>() // catalogId → bestDayMl

    // Önce günlük bazda içecek toplamı
    const drinkDailyMap = new Map<string, Map<string, number>>() // catalogId → date → ml
    for (const log of allLogs) {
      const key = log.catalogId ?? log.drinkType
      const dateKey = log.date.toISOString().slice(0, 10)
      drinkMlMap.set(key, (drinkMlMap.get(key) ?? 0) + log.amountMl)
      drinkCountMap.set(key, (drinkCountMap.get(key) ?? 0) + 1)
      if (!drinkDailyMap.has(key)) drinkDailyMap.set(key, new Map())
      const dm = drinkDailyMap.get(key)!
      dm.set(dateKey, (dm.get(dateKey) ?? 0) + log.amountMl)
    }
    for (const [key, dm] of drinkDailyMap.entries()) {
      const best = Math.max(...dm.values())
      drinkBestDayMap.set(key, best)
    }

    // Catalog bilgileri çek
    const catalogIds = Array.from(drinkMlMap.keys()).filter((k) => k.length > 10) // cuid length
    const catalogItems =
      catalogIds.length > 0
        ? await db.drinkCatalog.findMany({
            where: { id: { in: catalogIds } },
            select: { id: true, nametr: true, iconName: true, color: true, category: true },
          })
        : []
    const catMap = new Map(catalogItems.map((c) => [c.id, c]))

    // Custom drink'ler
    const customIds = Array.from(drinkMlMap.keys()).filter((k) => !catMap.has(k) && k.length > 10)
    const customDrinks =
      customIds.length > 0
        ? await db.userCustomDrink.findMany({
            where: { id: { in: customIds } },
            select: { id: true, nametr: true, iconName: true, color: true, category: true },
          })
        : []
    const customMap = new Map(customDrinks.map((c) => [c.id, c]))

    const drinkRecords = Array.from(drinkMlMap.entries())
      .map(([key, totalMl]) => {
        const cat = catMap.get(key)
        const custom = customMap.get(key)
        const info = cat ?? custom
        if (!info) {
          // drinkType kategori fallback (eski kayıtlar — catalogId yok)
          return {
            drinkId: key,
            drinkName: key,
            iconName: '',
            category: key, // drinkType zaten kategori
            color: '#8E8E93',
            totalMl: Math.round(totalMl),
            bestDayMl: Math.round(drinkBestDayMap.get(key) ?? 0),
            totalCount: drinkCountMap.get(key) ?? 0,
          }
        }
        return {
          drinkId: key,
          drinkName: info.nametr,
          iconName: info.iconName,
          category: info.category,
          color: info.color,
          totalMl: Math.round(totalMl),
          bestDayMl: Math.round(drinkBestDayMap.get(key) ?? 0),
          totalCount: drinkCountMap.get(key) ?? 0,
        }
      })
      // En az 2 kayıt olanları göster — tek seferlik içecekler ranking'e girmez
      .filter((d) => d.totalCount >= 2)
      .sort((a, b) => b.totalMl - a.totalMl)
      .slice(0, 10)

    return NextResponse.json({
      empty: false,
      bestDayMl: Math.round(bestDayEntry.ml),
      bestDayDate: new Date(bestDayEntry.date).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      bestDayDiff,
      longestStreak,
      currentStreak,
      lastGoalDate: lastGoalDate?.toISOString() ?? null,
      totalLiters: Math.round(totalMl / 100) / 10,
      avgDailyMl,
      goalHitRate,
      bestWeekMl: Math.round(bestWeekEntry[1]),
      bestWeekLabel: weekLabelMap.get(bestWeekEntry[0]) ?? '',
      bestMonthMl: Math.round(bestMonthEntry[1]),
      bestMonthLabel,
      earliestGoalTime,
      drinkRecords,
    })
  } catch (err) {
    console.error('[water/records GET]', err)
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
  }
})
