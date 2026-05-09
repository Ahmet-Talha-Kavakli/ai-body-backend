/**
 * V4.6 M75 — Status Generator Cron
 *
 * Günde 1 kez tetiklenir. Her aktif karakter için 0-3 status karar verir.
 * Karar girdileri:
 *   - currentMood (yüksek/düşük → daha fazla status)
 *   - storyline (özel olay → status)
 *   - characterThought (M12, "status'e dök" route'u olanlar)
 *
 * Şu an basit MVP:
 *   - %50 ihtimal: 1 status
 *   - %20 ihtimal: 2 status
 *   - %10 ihtimal: 0 status (sessiz gün)
 *   - kalan %20: 1 status
 *
 * İçerik: gpt-4o-mini ile mood/activity/storyline'a uygun kısa metin
 * (foto için Flux krediye bekleniyor — şimdilik text status).
 *
 * Drama (M31): %15 ihtimalle başka bir aktif karakteri hiddenFrom'a (kullanıcıya
 * gizleme değil, ileri faz için karakter-karakter perception'a) — şimdilik
 * sadece **kullanıcıya gizleme** drama'sı destekleniyor: kullanıcı kendi status'ünü
 * atarken karakter seçer. Karakter status'leri şimdilik herkese açık.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

export const maxDuration = 300

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const STATUS_TTL_MS = 24 * 60 * 60 * 1000

const TEXT_BG_COLORS = [
  '#1F2937',
  '#7C3AED',
  '#0EA5E9',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#EF4444',
  '#6366F1',
  '#14B8A6',
]

function pickStatusCount(): number {
  const r = Math.random()
  if (r < 0.1) return 0
  if (r < 0.8) return 1
  if (r < 0.95) return 2
  return 3
}

async function generateStatusText(character: {
  name: string
  archetype: string | null
  currentMood: string | null
  currentActivity: string | null
  currentLocation: string | null
}): Promise<string | null> {
  const sys = `Sen bir karakterin WhatsApp/Instagram story'sine yazacağı kısa bir metin üreticisisin.
Kurallar:
- ÇOK kısa (max 60 karakter, 1-2 cümle)
- 1. tekil şahıs, doğal Türkçe
- Argo doğal ("ya", "valla", "abi" karakter uyuyorsa)
- "asistan" tonu yasak — gerçek insan
- Bazen tek emoji bitirebilir
- Mood + aktivite + lokasyon ipucu olabilir ama zorlama yok
- Liste/explanation yasak
- Hashtag yasak
Sadece status metnini döndür, başka bir şey yazma.`

  const ctx = `Karakter: ${character.name}${character.archetype ? ` (${character.archetype})` : ''}
Mood: ${character.currentMood || 'normal'}
Aktivite: ${character.currentActivity || 'belirsiz'}
Lokasyon: ${character.currentLocation || 'belirsiz'}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: ctx },
      ],
      max_tokens: 60,
      temperature: 0.95,
    })
    const text = completion.choices[0]?.message?.content?.trim()
    if (!text) return null
    // Quote temizliği
    return text.replace(/^["'`]+|["'`]+$/g, '').slice(0, 200)
  } catch (e) {
    console.error('[status-generator] openai error', e)
    return null
  }
}

export async function GET(_req: NextRequest) {
  const now = new Date()
  const dayAgo = new Date(now.getTime() - STATUS_TTL_MS)

  // Aktif karakterleri çek (son 7 gün'de bir mesaj olan veya aktif statüde)
  const characters = await db.character.findMany({
    where: { status: { not: 'departed' } },
    select: {
      id: true,
      userId: true,
      name: true,
      archetype: true,
      currentMood: true,
      currentActivity: true,
      currentLocation: true,
    },
    take: 200,
  })

  let created = 0
  let skipped = 0
  let errors = 0

  // Kullanıcı bazında diğer karakterleri grupla (cross-character gizleme için)
  const charsByUser = new Map<string, typeof characters>()
  for (const c of characters) {
    const arr = charsByUser.get(c.userId) || []
    arr.push(c)
    charsByUser.set(c.userId, arr)
  }

  for (const c of characters) {
    // Bugün zaten yazılmış status sayısı (overproduce engelle)
    const todayCount = await db.status.count({
      where: {
        authorType: 'character',
        authorCharId: c.id,
        createdAt: { gte: dayAgo },
      },
    })
    const planned = pickStatusCount()
    const remaining = Math.max(0, planned - todayCount)
    if (remaining === 0) {
      skipped++
      continue
    }

    for (let i = 0; i < remaining; i++) {
      const text = await generateStatusText(c)
      if (!text) {
        errors++
        continue
      }
      // Gün içi rastgele dağıtım: şimdi - random(0-22h)
      const offsetMs = Math.floor(Math.random() * 22 * 60 * 60 * 1000)
      const createdAt = new Date(now.getTime() - offsetMs)
      const expiresAt = new Date(createdAt.getTime() + STATUS_TTL_MS)
      const bg = TEXT_BG_COLORS[Math.floor(Math.random() * TEXT_BG_COLORS.length)]

      // V4.6 M31 — Karakter-karakter drama gizleme (%15 ihtimal)
      // Aynı kullanıcının başka karakterlerinden 1 tanesini rastgele gizle
      const hiddenFrom: string[] = []
      const peers = (charsByUser.get(c.userId) || []).filter((p) => p.id !== c.id)
      if (peers.length > 0 && Math.random() < 0.15) {
        const target = peers[Math.floor(Math.random() * peers.length)]
        if (target) hiddenFrom.push(target.id)
      }

      await db.status.create({
        data: {
          authorType: 'character',
          authorCharId: c.id,
          contentType: 'text',
          caption: text,
          bgColor: bg,
          hiddenFrom,
          createdAt,
          expiresAt,
        },
      })
      created++
    }
  }

  // Süresi dolmuş status'leri temizle
  const expired = await db.status.deleteMany({
    where: { expiresAt: { lte: now } },
  })

  return NextResponse.json({
    ok: true,
    created,
    skipped,
    errors,
    expired: expired.count,
    charactersScanned: characters.length,
  })
}
