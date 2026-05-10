/**
 * V4.8 Faz D — Yaratıcı Dashboard (cached 30s)
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { cached } from '@/lib/redis/client'
import { tierProgress } from '@/lib/marketplace/creator-tier'

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const data = await cached(`creator:dashboard:${user.id}`, 30, async () => {
    const [characters, listings, totalEarning, recentRentals] = await Promise.all([
      db.character.count({ where: { creatorId: user.id, isRetired: false } }),
      db.marketplaceListing.findMany({
        where: { ownerId: user.id },
        include: {
          character: {
            select: { id: true, name: true, avatarUrl: true, publishStatus: true, dnaScore: true },
          },
        },
        orderBy: { publishedAt: 'desc' },
      }),
      db.rentalAgreement.aggregate({
        where: { ownerId: user.id },
        _sum: { ownerCredits: true },
      }),
      db.rentalAgreement.findMany({
        where: { ownerId: user.id },
        orderBy: { startedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          startedAt: true,
          endsAt: true,
          endedAt: true,
          ownerCredits: true,
          ratingByRenter: true,
          status: true,
          character: { select: { name: true } },
        },
      }),
    ])

    const activeRentals = await db.rentalAgreement.count({
      where: { ownerId: user.id, status: 'active' },
    })

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const characterIds = listings.map((l) => l.characterId)
    const [todayDemos, todayRentals, todayViews] = await Promise.all([
      db.characterDemoSession.count({
        where: { characterId: { in: characterIds }, startedAt: { gte: startOfToday } },
      }),
      db.rentalAgreement.count({
        where: { ownerId: user.id, startedAt: { gte: startOfToday } },
      }),
      db.listingView.count({
        where: { listing: { ownerId: user.id }, createdAt: { gte: startOfToday } },
      }),
    ])

    const totalViews = listings.reduce((sum, l) => sum + l.totalViews, 0)
    const totalEarningAmount = totalEarning._sum.ownerCredits ?? 0
    const tier = tierProgress(totalEarningAmount)

    const since = new Date()
    since.setHours(0, 0, 0, 0)
    since.setDate(since.getDate() - 29)

    const [rentalRows, viewRows] = await Promise.all([
      db.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT date_trunc('day', "startedAt") AS day, COUNT(*)::bigint AS count
        FROM "RentalAgreement"
        WHERE "ownerId" = ${user.id} AND "startedAt" >= ${since}
        GROUP BY 1 ORDER BY 1
      `,
      characterIds.length
        ? db.$queryRaw<Array<{ day: Date; count: bigint }>>`
            SELECT date_trunc('day', lv."createdAt") AS day, COUNT(*)::bigint AS count
            FROM "ListingView" lv
            JOIN "MarketplaceListing" ml ON ml.id = lv."listingId"
            WHERE ml."ownerId" = ${user.id} AND lv."createdAt" >= ${since}
            GROUP BY 1 ORDER BY 1
          `
        : Promise.resolve([] as Array<{ day: Date; count: bigint }>),
    ])

    const rentalMap = new Map<string, number>(
      rentalRows.map((r) => [r.day.toISOString().slice(0, 10), Number(r.count)])
    )
    const viewMap = new Map<string, number>(
      viewRows.map((r) => [r.day.toISOString().slice(0, 10), Number(r.count)])
    )
    const series: Array<{ date: string; rentals: number; views: number }> = []
    for (let i = 0; i < 30; i++) {
      const d = new Date(since)
      d.setDate(since.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      series.push({ date: key, rentals: rentalMap.get(key) ?? 0, views: viewMap.get(key) ?? 0 })
    }
    const last7Rentals = series.slice(-7).reduce((s, p) => s + p.rentals, 0)
    const prev7Rentals = series.slice(-14, -7).reduce((s, p) => s + p.rentals, 0)
    const last7Views = series.slice(-7).reduce((s, p) => s + p.views, 0)
    const prev7Views = series.slice(-14, -7).reduce((s, p) => s + p.views, 0)
    const pct = (a: number, b: number) =>
      b === 0 ? (a > 0 ? 100 : 0) : Math.round(((a - b) / b) * 100)
    const demand = {
      series,
      last7: { rentals: last7Rentals, views: last7Views },
      delta: { rentals: pct(last7Rentals, prev7Rentals), views: pct(last7Views, prev7Views) },
    }

    return {
      summary: {
        totalCharacters: characters,
        totalListings: listings.length,
        activeListings: listings.filter((l) => l.rentEnabled || l.buyEnabled).length,
        totalViews,
        tier: {
          current: tier.current,
          next: tier.next,
          progress: tier.progress,
          remainingEarnings: tier.remainingEarnings,
        },
        today: { demos: todayDemos, rentals: todayRentals, views: todayViews },
        totalEarnings: totalEarningAmount,
        activeRentals,
      },
      demand,
      listings: listings.map((l) => ({
        id: l.id,
        character: l.character,
        rentEnabled: l.rentEnabled,
        buyEnabled: l.buyEnabled,
        totalRentals: l.totalRentals,
        totalEarnings: l.totalEarnings,
        totalViews: l.totalViews,
        averageRating: l.averageRating,
        isBoosted: l.boostUntil ? l.boostUntil > new Date() : false,
        vipUntil: l.vipUntil ? l.vipUntil.toISOString() : null,
      })),
      recentRentals: recentRentals.map((r) => ({
        id: r.id,
        characterName: r.character.name,
        type: r.type,
        startedAt: r.startedAt,
        endsAt: r.endsAt,
        endedAt: r.endedAt,
        earning: r.ownerCredits,
        rating: r.ratingByRenter,
        status: r.status,
      })),
    }
  })

  return NextResponse.json(data)
})
