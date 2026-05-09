/**
 * V4.7 B2 — Routine Learner (günde 1)
 *
 * Her aktif karakter için, son 14 gün user mesajlarındaki saat dağılımını analiz eder
 * ve Character.learnedRoutine'i günceller.
 *
 * Heuristic:
 *   - sleep: en son user mesajının saati ortalaması (gece yarısı civarı)
 *   - wake: günün ilk user mesajının saati ortalaması
 *   - peakHours: en yoğun mesaj atılan 3 saatlik pencere
 *
 * 14 gün altı veri varsa update etmez (ham veri).
 *
 * Lokal: curl http://localhost:3000/api/cron/routine-learner
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export const maxDuration = 120

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function avgHour(hours: number[]): { hh: number; mm: number } {
  if (hours.length === 0) return { hh: 0, mm: 0 }
  // Hour ranges 0-23. Doğrudan ortalama yeter (gece yarısı edge case'i sleep için kabul ettik).
  const sum = hours.reduce((a, b) => a + b, 0)
  const avg = sum / hours.length
  const hh = Math.floor(avg) % 24
  const mm = Math.round((avg - Math.floor(avg)) * 60)
  return { hh, mm }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (
    cronSecret &&
    authHeader !== `Bearer ${cronSecret}` &&
    process.env.NODE_ENV === 'production'
  ) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const characters = await db.character.findMany({
    where: { status: 'active' },
    select: { id: true, userId: true },
  })

  let processed = 0
  let updated = 0
  let skippedNoData = 0

  for (const char of characters) {
    processed++

    const messages = await db.assistantMessage.findMany({
      where: {
        role: 'user',
        createdAt: { gte: fourteenDaysAgo },
        conversation: { characterId: char.id, userId: char.userId, archived: false },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    if (messages.length < 14) {
      skippedNoData++
      continue
    }

    // Günlük gruplar: ilk mesaj (wake) ve son mesaj (sleep) saatleri
    const dayMap = new Map<string, Date[]>()
    for (const m of messages) {
      const day = m.createdAt.toISOString().slice(0, 10)
      if (!dayMap.has(day)) dayMap.set(day, [])
      dayMap.get(day)!.push(m.createdAt)
    }

    const wakeHours: number[] = []
    const sleepHours: number[] = []
    const allHours: number[] = []
    for (const [, list] of dayMap) {
      list.sort((a, b) => a.getTime() - b.getTime())
      const first = list[0]
      const last = list[list.length - 1]
      wakeHours.push(first.getHours() + first.getMinutes() / 60)
      sleepHours.push(last.getHours() + last.getMinutes() / 60)
      for (const m of list) allHours.push(m.getHours())
    }

    const wake = avgHour(wakeHours)
    const sleep = avgHour(sleepHours)

    // Peak hours: en yoğun 3 saat
    const hourCounts = new Array(24).fill(0)
    for (const h of allHours) hourCounts[h]++
    const indexed = hourCounts.map((c, i) => ({ h: i, c }))
    indexed.sort((a, b) => b.c - a.c)
    const peak = indexed
      .slice(0, 3)
      .map((x) => x.h)
      .sort((a, b) => a - b)

    await db.character.update({
      where: { id: char.id },
      data: {
        learnedRoutine: {
          wake: `${pad(wake.hh)}:${pad(wake.mm)}`,
          sleep: `${pad(sleep.hh)}:${pad(sleep.mm)}`,
          peakHours: peak.map((h) => `${pad(h)}:00`),
          updatedAt: new Date().toISOString(),
        },
      },
    })
    updated++
  }

  return NextResponse.json({
    ok: true,
    processed,
    updated,
    skippedNoData,
    timestamp: new Date().toISOString(),
  })
}
