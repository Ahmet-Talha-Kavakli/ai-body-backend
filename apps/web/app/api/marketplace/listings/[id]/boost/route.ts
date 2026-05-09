/**
 * V4.8 Faz F — Listing Boost satın alma
 *
 * GET /api/marketplace/listings/[id]/boost  → mevcut boost durumu + paketler
 * POST /api/marketplace/listings/[id]/boost  → boost satın al
 *   Body: { tier: '24h' | '7d' | 'sponsored' }
 *
 * Sadece listing sahibi boost satın alabilir.
 * Aktif boost varsa yenisi sıraya eklenir (boostUntil uzar).
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { spendCredits, getUserBalance } from '@/lib/marketplace/credit-ledger'
import { invalidateCachePrefix } from '@/lib/redis/client'

type Ctx = { params: Promise<{ id: string }> }

export const BOOST_PACKAGES = {
  '24h': { label: '24 Saat', price: 50, durationMs: 24 * 60 * 60 * 1000 },
  '7d': { label: '1 Hafta', price: 250, durationMs: 7 * 24 * 60 * 60 * 1000 },
  sponsored: { label: '30 Gün — Sponsorlu', price: 800, durationMs: 30 * 24 * 60 * 60 * 1000 },
} as const

type BoostTier = keyof typeof BOOST_PACKAGES

export const GET = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params!
  const listing = await db.marketplaceListing.findUnique({
    where: { id },
    select: { id: true, ownerId: true, boostUntil: true, boostTier: true },
  })
  if (!listing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  if (listing.ownerId !== user.id) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  const balance = await getUserBalance(user.id)
  const now = new Date()
  const isActive = !!listing.boostUntil && listing.boostUntil > now

  return NextResponse.json({
    balance,
    isActive,
    boostUntil: listing.boostUntil,
    boostTier: listing.boostTier,
    packages: Object.entries(BOOST_PACKAGES).map(([key, p]) => ({
      tier: key,
      label: p.label,
      price: p.price,
      durationMs: p.durationMs,
    })),
  })
})

export const POST = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params!
  const body = await req.json().catch(() => ({}))
  const tier = body.tier as BoostTier | undefined
  if (!tier || !(tier in BOOST_PACKAGES)) {
    return NextResponse.json({ error: 'Geçersiz tier' }, { status: 400 })
  }

  const listing = await db.marketplaceListing.findUnique({
    where: { id },
    select: { id: true, ownerId: true, boostUntil: true },
  })
  if (!listing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  if (listing.ownerId !== user.id) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  const pkg = BOOST_PACKAGES[tier]
  const spend = await spendCredits(user.id, pkg.price, `boost:${tier}`, { listingId: id })
  if (!spend.ok) {
    return NextResponse.json({ error: spend.reason, balance: spend.balance }, { status: 402 })
  }

  const now = new Date()
  // Aktif boost varsa üstüne ekle, yoksa şimdiden başlat
  const baseTime =
    listing.boostUntil && listing.boostUntil > now ? listing.boostUntil.getTime() : now.getTime()
  const newBoostUntil = new Date(baseTime + pkg.durationMs)

  await db.marketplaceListing.update({
    where: { id },
    data: { boostUntil: newBoostUntil, boostTier: tier },
  })

  // Listings cache + bu listing'in detay cache'ini temizle, sıralama anında değişsin
  await Promise.all([invalidateCachePrefix('mp:list:'), invalidateCachePrefix(`mp:listing:${id}`)])

  return NextResponse.json({
    ok: true,
    boostUntil: newBoostUntil,
    boostTier: tier,
    balance: spend.balance,
  })
})
