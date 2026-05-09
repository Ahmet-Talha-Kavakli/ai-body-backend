/**
 * V4.5 Faz 10A — Karakter Mood Döngüsü
 *
 * Karakter sürekli aynı mood'da kalmaz. Her gün (veya her birkaç saatte) içsel
 * bir değişim yaşar — sebebi olan, gerçekçi bir değişim.
 *
 * Tetikleyiciler:
 *   - Sabah uyandı, gün nasıl başladı?
 *   - Trafik, iş, aile, hava (basit heuristic)
 *   - Önceki mood + rastgele life event
 *
 * Mood + sebep birlikte güncellenir. Sebep, sonraki sohbette karakter
 * tarafından kendiliğinden bahsedilir ("ya bugün kötü uyandım", "trafiğe
 * takıldım sabah").
 *
 * Storyline / sticky lifeEvent ile çakışmaz — onlar daha kalıcı, mood günlük.
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const MOOD_CHANGE_INTERVAL_MS = 6 * 60 * 60 * 1000 // 6 saat (gün içinde 4 dilim)

interface MoodResult {
  mood: string
  reason: string // "Sabah trafikte 1 saat geçirdi", "İyi uyandı, dün arkadaşlarıyla görüştü"
}

const MOOD_PROMPT = `Sen bir karakter içsel durum motorusun. Karakterin son ruhsal durumuna ve hayat bağlamına bakıp, GERÇEKÇİ bir mood güncellemesi öner.

KURALLAR:
- Mood seçenekleri: happy, excited, sad, tired, angry, anxious, calm, neutral
- Sebep KISA ve SOMUT olmalı (max 80 karakter): "trafiğe takıldı sabah", "iyi uyumadı", "annesi aradı kötü haber"
- Önceki mood'tan AŞIRI sapma yapma — gradual change
- Sıkıcı/tekrarlı sebep yok ("güzel bir gün", "hayat akıyor"): SOMUT olay/sebep
- "calm/neutral" varsayılan değil — gerçek hayatta sürekli karışık duygu var

Önceki state:
- Mood: {{prevMood}}
- Önceki sebep: {{prevReason}}
- Saat: {{hour}}:00 (yerel)
- Gün: {{day}} ({{dayLabel}})

Sadece JSON dön:
{"mood": "...", "reason": "..."}`

const dayLabels: Record<number, string> = {
  0: 'Pazar (boş gün)',
  1: 'Pazartesi (iş günü, yorucu başlangıç)',
  2: 'Salı (iş)',
  3: 'Çarşamba (orta)',
  4: 'Perşembe (yorgun)',
  5: 'Cuma (hafta sonu yaklaşıyor)',
  6: 'Cumartesi (rahatlık, sosyal)',
}

async function generateMoodUpdate(args: {
  prevMood: string | null
  prevReason: string | null
  hour: number
  dayOfWeek: number
}): Promise<MoodResult | null> {
  const prompt = MOOD_PROMPT.replace('{{prevMood}}', args.prevMood || 'neutral')
    .replace('{{prevReason}}', args.prevReason || 'yok')
    .replace('{{hour}}', String(args.hour))
    .replace('{{day}}', String(args.dayOfWeek))
    .replace('{{dayLabel}}', dayLabels[args.dayOfWeek] ?? '')

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.85,
      response_format: { type: 'json_object' },
      max_tokens: 100,
    })
    const text = res.choices[0]?.message?.content
    if (!text) return null
    const parsed = JSON.parse(text)
    if (typeof parsed.mood !== 'string' || typeof parsed.reason !== 'string') return null
    return {
      mood: parsed.mood.toLowerCase().trim(),
      reason: parsed.reason.slice(0, 100),
    }
  } catch (e) {
    console.warn('[mood-cycle] generation failed', e)
    return null
  }
}

/**
 * Tüm aktif karakterlerin mood'unu güncelle. Cron tarafından çağrılır.
 * Her karakter için son güncellemeden 6+ saat geçtiyse yenile.
 */
export async function runMoodCycleCron(): Promise<{ updated: number; skipped: number }> {
  const stats = { updated: 0, skipped: 0 }

  const sixHoursAgo = new Date(Date.now() - MOOD_CHANGE_INTERVAL_MS)
  const characters = await db.character.findMany({
    where: {
      status: { in: ['active', 'cold', 'recovering'] },
      OR: [{ currentStateUpdatedAt: { lt: sixHoursAgo } }, { currentStateUpdatedAt: null }],
    },
    select: {
      id: true,
      currentMood: true,
      lastMajorEvent: true,
      timezone: true,
    },
    take: 100, // dakika başı çağrılırsa rate limit
  })

  const now = new Date()
  for (const c of characters) {
    const tz = c.timezone || 'Europe/Istanbul'
    let hourLocal = 12
    let dayLocal = now.getUTCDay()
    try {
      const hourStr = now.toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false })
      hourLocal = parseInt(hourStr, 10)
      const dayStr = now.toLocaleString('en-US', { timeZone: tz, weekday: 'short' })
      dayLocal = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(dayStr.slice(0, 3))
      if (dayLocal === -1) dayLocal = 0
    } catch {}

    const update = await generateMoodUpdate({
      prevMood: c.currentMood,
      prevReason: c.lastMajorEvent,
      hour: hourLocal,
      dayOfWeek: dayLocal,
    })
    if (!update) {
      stats.skipped++
      continue
    }

    await db.character.update({
      where: { id: c.id },
      data: {
        currentMood: update.mood,
        lastMajorEvent: update.reason,
        currentStateUpdatedAt: now,
      },
    })
    stats.updated++
  }

  return stats
}
