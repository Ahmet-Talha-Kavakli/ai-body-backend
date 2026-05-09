/**
 * V4.7 Faz 4 — Daily Life Generator (sabah cron, günde 1)
 *
 * Her aktif karakter için bugün için:
 *   - todayOutfit (I3): mood + hava + storyline event'e göre kıyafet
 *   - CharacterDailyMeals (J6): kahvaltı + öğle + akşam
 *   - CharacterDailyMusic (J5): 2-3 şarkı (mood-aware) + lyric alıntı
 *   - CharacterDailyDetail (I4/D1): 1-3 hayat dokusu detayı
 *
 * KRİTİK:
 *   - Mekan referanslı detail için CharacterFavoriteVenue'dan seç. Liste boşsa
 *     mekan içermeyen detail üret (evdeki şeyler).
 *   - Lyric uydurma yasak — gpt-4o-mini'ye "lyric biliyorsan ekle, bilmiyorsan null"
 *     dedirtiyoruz; modele güvenmiyoruz çünkü yine de uydurabilir, bu yüzden
 *     prompt block tarafında null kontrol var.
 *
 * Lokal: curl http://localhost:3000/api/cron/daily-life-generator
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

export const maxDuration = 300

type DailyLifePayload = {
  outfit: {
    top: string
    bottom: string
    shoes?: string
    accessories?: string[]
  }
  meals: {
    breakfast: string
    lunch: string
    dinner: string
    snacks?: string[]
    homeMade: boolean
  }
  music: Array<{
    trackName: string
    artist: string
    lyricExcerpt?: string | null
    mood?: string
  }>
  details: Array<{
    category: 'shopping' | 'errand' | 'transit' | 'meeting' | 'home' | 'small'
    description: string
    feeling?: string
    venueHint?: string // venue name; cron sonra venueId'ye map'lar
  }>
}

async function generateForCharacter(args: {
  characterId: string
  name: string
  city: string | null
  job: string | null
  mood: string | null
  venues: Array<{ id: string; name: string; category: string; district: string }>
  obsession: string | null
}): Promise<DailyLifePayload | null> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const venuesText =
    args.venues.length === 0
      ? 'Karakterin tanımlı favori mekanı yok — mekan referansı vermeden ev/yol/genel ifade kullan.'
      : args.venues.map((v) => `- ${v.name} (${v.district}, ${v.category})`).join('\n')

  const sys = `Bir Türk karakter için bugünkü gerçek hayat dokusunu üretiyorsun. ASLA jenerik / yapay olmasın.

Karakter: ${args.name}${args.job ? ` (${args.job})` : ''}${args.city ? ` — ${args.city}` : ''}
Mood: ${args.mood ?? 'normal'}
${args.obsession ? `Şu an takıntılı: ${args.obsession}` : ''}

Mekan listesi (varsa):
${venuesText}

KURALLAR:
- Yemekler Türk damak tadına uygun, gerçekçi (menemen, çiğ köfte, mantı, kahvaltı tabağı, simit, börek vb.).
- Kıyafet mevsim/mood uyumlu; aksesuar opsiyonel.
- 2-3 şarkı seç — gerçek sanatçı + gerçek şarkı adı. Lyric alıntısı SADECE %100 emin olduğun şarkılar için ekle. Emin değilsen lyricExcerpt: null bırak. ASLA uydurma söz yazma.
- Hayat dokusu detayları (1-3 adet): "Z Cafe'de latte", "telefonum %4 şarja takıyorum", "akşama menemen yapacağım" gibi. ASLA tracker / görev listesi tonu. venueHint sadece yukarıdaki listeden seçilebilir.

ZORUNLU JSON ŞEMASI (eksiksiz alan, fazlası yok):
{
  "outfit": {"top": "...", "bottom": "...", "shoes": "...", "accessories": ["..."]},
  "meals": {"breakfast": "...", "lunch": "...", "dinner": "...", "snacks": ["..."], "homeMade": true},
  "music": [
    {"trackName": "...", "artist": "...", "lyricExcerpt": null, "mood": "..."}
  ],
  "details": [
    {"category": "shopping|errand|transit|meeting|home|small", "description": "...", "feeling": "...", "venueHint": "..."}
  ]
}

Sadece bu JSON'u döndür, başka metin yok.`

  try {
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: 'Bugünün hayat dokusunu JSON olarak üret.' },
      ],
      temperature: 0.85,
      max_tokens: 700,
      response_format: { type: 'json_object' },
    })
    const text = r.choices[0]?.message?.content
    if (!text) return null
    return JSON.parse(text) as DailyLifePayload
  } catch (e) {
    console.error('[daily-life-generator] AI fail:', args.characterId, e)
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Aktif karakterler
  const characters = await db.character.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      name: true,
      hometown: true,
      currentMood: true,
    },
  })

  let processed = 0
  let succeeded = 0
  let failed = 0

  for (const char of characters) {
    processed++

    // Bugünün kayıtları zaten varsa skip
    const existingMeals = await db.characterDailyMeals.findFirst({
      where: { characterId: char.id, date: { gte: today, lt: tomorrow } },
      select: { id: true },
    })
    if (existingMeals) continue

    // Venue + obsession context
    const [venues, activeObsession] = await Promise.all([
      db.characterFavoriteVenue.findMany({
        where: { characterId: char.id, active: true },
        select: { id: true, name: true, category: true, district: true },
        take: 8,
      }),
      db.characterObsession.findFirst({
        where: { characterId: char.id, status: 'active', endsAt: { gt: new Date() } },
        select: { topic: true },
      }),
    ])

    const payload = await generateForCharacter({
      characterId: char.id,
      name: char.name,
      city: char.hometown ?? null,
      job: null,
      mood: char.currentMood ?? null,
      venues,
      obsession: activeObsession?.topic ?? null,
    })

    if (!payload) {
      failed++
      continue
    }

    const venueByName = new Map(venues.map((v) => [v.name.toLowerCase(), v.id]))
    const outfit = payload.outfit ?? { top: 'tişört', bottom: 'jean' }
    const meals = payload.meals ?? { breakfast: '', lunch: '', dinner: '', homeMade: true }
    const music = Array.isArray(payload.music) ? payload.music : []
    const details = Array.isArray(payload.details) ? payload.details : []

    try {
      // 1) Outfit
      await db.character.update({
        where: { id: char.id },
        data: {
          todayOutfit: {
            ...outfit,
            updatedAt: new Date().toISOString(),
          },
        },
      })

      // 2) Meals
      const dinnerVenueId = meals.homeMade ? null : venues[0] ? venues[0].id : null
      await db.characterDailyMeals.create({
        data: {
          characterId: char.id,
          date: today,
          breakfast: meals.breakfast || null,
          lunch: meals.lunch || null,
          dinner: meals.dinner || null,
          snacks: (meals.snacks ?? []) as object,
          homeMade: meals.homeMade ?? true,
          venueId: dinnerVenueId,
        },
      })

      // 3) Music — lyric uydurma kontrolü: bilinmeyen sanatçı + lyric varsa null'a çevir
      for (const m of music.slice(0, 3)) {
        await db.characterDailyMusic.create({
          data: {
            characterId: char.id,
            date: today,
            trackName: m.trackName,
            artist: m.artist,
            lyricExcerpt: m.lyricExcerpt ?? null,
            mood: m.mood ?? null,
            shared: false,
          },
        })
      }

      // 4) Details
      for (const d of details.slice(0, 3)) {
        const venueId = d.venueHint ? (venueByName.get(d.venueHint.toLowerCase()) ?? null) : null
        await db.characterDailyDetail.create({
          data: {
            characterId: char.id,
            date: today,
            category: d.category,
            description: d.description,
            venueId,
            feeling: d.feeling ?? null,
            shared: false,
          },
        })
      }

      succeeded++
    } catch (e) {
      console.error('[daily-life-generator] persist fail:', char.id, e)
      failed++
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    succeeded,
    failed,
    timestamp: new Date().toISOString(),
  })
}
