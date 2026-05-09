/**
 * V4.7 I2 — Obsession Manager (günde 1)
 *
 * - Aktif obsession'ları kontrol et: endsAt geçmişse status='ended'
 * - Her aktif karakter için %20 ihtimalle (mevcut aktif yoksa) yeni obsession üret
 * - Süre 1-3 gün, intensity 0.5-0.9
 * - Kategoriler: tv | music | book | event | person | food
 *
 * Lokal: curl http://localhost:3000/api/cron/obsession-manager
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

export const maxDuration = 180

type ObsessionPayload = {
  topic: string
  category: 'tv' | 'music' | 'book' | 'event' | 'person' | 'food'
  prompt: string // 1-2 cümle özet
  intensity: number // 0.5-0.9
  durationDays: 1 | 2 | 3
}

async function generateObsession(args: {
  name: string
  mood: string | null
}): Promise<ObsessionPayload | null> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const sys = `Bir Türk karakter için 1-3 günlük gerçekçi bir takıntı konusu üret. ASLA jenerik / Replika tarzı.

Karakter: ${args.name}
Mood: ${args.mood ?? 'normal'}

Örnekler:
- TV: "yeni dizi: Severance, 2. sezon"
- Müzik: "Tarkan'ın yeni şarkısı, sürekli dinliyor"
- Kitap: "Sapiens'in son bölümü"
- Olay: "Mahallede yeni açılan kafe"
- Kişi: "İş yerinde yeni gelen Ahmet"
- Yemek: "Bu hafta menemen takıntısı"

JSON dön:
{"topic":"...","category":"tv|music|book|event|person|food","prompt":"1-2 cümle takıntı özeti","intensity":0.5-0.9 arası float,"durationDays":1|2|3}`

  try {
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: 'Yeni takıntı üret.' },
      ],
      temperature: 0.95,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    })
    const text = r.choices[0]?.message?.content
    if (!text) return null
    return JSON.parse(text) as ObsessionPayload
  } catch (e) {
    console.error('[obsession-manager] AI fail:', e)
    return null
  }
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

  const now = new Date()

  // 1) Süresi dolmuş obsession'ları kapat
  const closed = await db.characterObsession.updateMany({
    where: { status: 'active', endsAt: { lt: now } },
    data: { status: 'ended' },
  })

  // 2) Aktif karakterleri tara
  const characters = await db.character.findMany({
    where: { status: 'active' },
    select: { id: true, name: true, currentMood: true },
  })

  let scanned = 0
  let created = 0
  let skipped = 0

  for (const char of characters) {
    scanned++

    // Aktif obsession var mı? (max 1)
    const active = await db.characterObsession.findFirst({
      where: { characterId: char.id, status: 'active', endsAt: { gt: now } },
      select: { id: true },
    })
    if (active) {
      skipped++
      continue
    }

    // %20 ihtimal yeni obsession
    if (Math.random() > 0.2) continue

    const payload = await generateObsession({ name: char.name, mood: char.currentMood ?? null })
    if (!payload) continue

    const days = Math.min(3, Math.max(1, payload.durationDays))
    const endsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    const intensity = Math.min(0.9, Math.max(0.5, payload.intensity))

    await db.characterObsession.create({
      data: {
        characterId: char.id,
        topic: payload.topic,
        category: payload.category,
        startedAt: now,
        endsAt,
        intensity,
        status: 'active',
        prompt: payload.prompt,
      },
    })
    created++
  }

  return NextResponse.json({
    ok: true,
    closed: closed.count,
    scanned,
    created,
    skipped,
    timestamp: now.toISOString(),
  })
}
