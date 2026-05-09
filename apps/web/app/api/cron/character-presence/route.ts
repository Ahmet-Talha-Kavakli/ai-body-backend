/**
 * V4.6 M2 — Character Presence Cron
 *
 * Karakterlerin online/offline durumunu kullanıcının davranışından bağımsız
 * günceller. Replika tuzağına düşmemek için: kullanıcı yazınca karakter
 * "online olmaz" — kendi yaşamına göre online olur.
 *
 * Lokal dev'de cron çalışmadığı için manuel tetiklenebilir:
 *   GET /api/cron/character-presence
 *
 * Üretim: her 5-10 dk önerilir (vercel.json schedule eklenmesi gerek).
 *
 * Algoritma:
 *   - Saat dilimine göre uyku saati ise → offline (kesin)
 *   - Activity = 'sleeping' / 'working' / 'commuting' / 'studying' → offline
 *   - Activity = 'eating' / 'relaxing' → %60 online
 *   - Default → %35 online
 *   - Bir önceki state'ten %20 flip momentum (yeniden hesap stabil olsun)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export const maxDuration = 60

interface SleepSchedule {
  weekdayBed?: string // "23:00"
  weekdayWake?: string // "08:00"
  weekendBed?: string
  weekendWake?: string
}

function parseHour(hhmm: string | undefined): number | null {
  if (!hhmm) return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm)
  if (!m) return null
  return parseInt(m[1], 10) + parseInt(m[2], 10) / 60
}

function isSleepingHour(
  now: Date,
  schedule: SleepSchedule | null,
  timezone: string | null
): boolean {
  const tz = timezone ?? 'Europe/Istanbul'
  const localHour = parseInt(
    now.toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false }),
    10
  )
  const isWeekend = (() => {
    const wd = new Date(now.toLocaleString('en-US', { timeZone: tz })).getDay()
    return wd === 0 || wd === 6
  })()

  let bed = parseHour(isWeekend ? schedule?.weekendBed : schedule?.weekdayBed)
  let wake = parseHour(isWeekend ? schedule?.weekendWake : schedule?.weekdayWake)
  if (bed == null) bed = 23
  if (wake == null) wake = 8

  if (bed < wake) {
    return localHour >= bed && localHour < wake
  }
  // bed gecenin geç saatleri (örn 23 -> 08): wrap-around
  return localHour >= bed || localHour < wake
}

function decidePresence(args: {
  currentActivity: string | null
  isCurrentlyOnline: boolean
  isSleeping: boolean
}): boolean {
  const { currentActivity, isCurrentlyOnline, isSleeping } = args

  if (isSleeping || currentActivity === 'sleeping' || currentActivity === 'sleep') return false
  if (
    currentActivity === 'working' ||
    currentActivity === 'commuting' ||
    currentActivity === 'studying' ||
    currentActivity === 'meeting'
  ) {
    // %15 ihtimalle yine de telefonu eline alıp girer
    return Math.random() < 0.15
  }

  // Momentum: önceki online/offline'a %20 flip ihtimali
  // (state çok hızlı değişmesin)
  const flipChance = 0.2
  if (Math.random() > flipChance) {
    // değişme — eski state'i koru
    return isCurrentlyOnline
  }

  // Yeni state hesapla
  if (
    currentActivity === 'eating' ||
    currentActivity === 'relaxing' ||
    currentActivity === 'home'
  ) {
    return Math.random() < 0.6
  }
  return Math.random() < 0.35
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Lokal dev'de secret ayarlı değilse izin ver
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  const now = new Date()
  const stats = { processed: 0, online: 0, offline: 0, flipped: 0, errors: 0 }

  try {
    const characters = await db.character.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        currentActivity: true,
        isCurrentlyOnline: true,
        sleepSchedule: true,
        timezone: true,
      },
      take: 1000,
    })

    for (const c of characters) {
      try {
        const sleeping = isSleepingHour(now, c.sleepSchedule as SleepSchedule | null, c.timezone)
        const newOnline = decidePresence({
          currentActivity: c.currentActivity,
          isCurrentlyOnline: c.isCurrentlyOnline,
          isSleeping: sleeping,
        })
        const flipped = newOnline !== c.isCurrentlyOnline
        if (flipped) {
          await db.character.update({
            where: { id: c.id },
            data: { isCurrentlyOnline: newOnline, onlineStateUpdatedAt: now },
          })
          stats.flipped++
        }
        stats.processed++
        if (newOnline) stats.online++
        else stats.offline++
      } catch (e) {
        console.error('[character-presence] char fail:', c.id, e)
        stats.errors++
      }
    }

    return NextResponse.json({ ok: true, ...stats })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown', ...stats },
      { status: 500 }
    )
  }
}
