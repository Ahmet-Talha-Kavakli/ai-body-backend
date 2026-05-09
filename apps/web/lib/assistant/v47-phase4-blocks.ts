/**
 * V4.7 Faz 4 — Karakter Günlük Gerçekliği Prompt Blokları
 *
 * Maddeler:
 *   B4 — buildVenueContextBlock (favori mekanlar, Türkiye odaklı, gerçek)
 *   I3 — buildOutfitBlock (bugünkü kıyafet, TTL 24h)
 *   I2 — buildObsessionBlock (1-3 gün takıntı)
 *   I4/D1 — buildDailyDetailBlock (yemek + günlük detaylar)
 *   J5 — buildDailyMusicBlock (bugünkü müzik + lyric alıntı)
 *
 * KRİTİK KURALLAR:
 *   - B4: Karakter ASLA rastgele yer üretmez. Liste yoksa "evdeyim/yolda" fallback.
 *   - J5: Lyric uydurma yasak. lyricExcerpt null ise "şu kısmı çok iyi" tarzı alıntı yapılmaz.
 *   - I4: %10-15 ihtimalle doğal sızdırma. ASLA tracker / yapay görev listesi gibi olmaz.
 *   - I3: todayOutfit selfie sistemi ile tutarlı olmalı (V4.5).
 */

import { db } from '@/lib/db/client'

// ============================================================
// B4 — Favori mekan bağlamı
// ============================================================

export async function buildVenueContextBlock(characterId: string): Promise<string> {
  const venues = await db.characterFavoriteVenue.findMany({
    where: { characterId, active: true },
    orderBy: [{ visitFrequency: 'asc' }, { addedAt: 'asc' }],
    take: 8,
  })

  if (venues.length === 0) {
    return [
      '[FAVORİ MEKANLAR]',
      'Senin tanımlı bir favori mekanın yok. Mekan bahsi geçtiğinde sadece genel ifade kullan:',
      '- "evdeyim", "yoldayım", "dışarıdayım"',
      'ASLA spesifik bir kafe/restoran/mahalle adı uydurma.',
    ].join('\n')
  }

  const lines = venues.map((v) => {
    const freq =
      v.visitFrequency === 'regular'
        ? 'her zamanki'
        : v.visitFrequency === 'occasional'
          ? 'arada'
          : 'nadir'
    const note = v.notes ? ` — ${v.notes}` : ''
    return `- ${v.name} (${v.district}, ${v.city}) [${v.category}, ${freq}]${note}`
  })

  return [
    '[FAVORİ MEKANLAR — gerçek, tutarlı]',
    'Senin gerçek favori mekanların:',
    ...lines,
    '',
    'KURALLAR:',
    '- Dışarıdaysan ve mekan bahsi gerekirse SADECE bu listeden seç.',
    '- ASLA rastgele bir kafe/restoran adı uydurma.',
    '- "Her zamanki yer" diyebilirsin (kullanıcı bilse de bilmese de tutarlı).',
    '- Liste dışında bir yer söylemen gerekiyorsa "evdeyim", "yoldayım" gibi genel kal.',
  ].join('\n')
}

// ============================================================
// I3 — Bugünkü kıyafet
// ============================================================

type OutfitJson = {
  top?: string
  bottom?: string
  shoes?: string
  accessories?: string[]
  updatedAt?: string
}

export async function buildOutfitBlock(characterId: string): Promise<string> {
  const char = await db.character.findUnique({
    where: { id: characterId },
    select: { todayOutfit: true },
  })
  const outfit = char?.todayOutfit as OutfitJson | null
  if (!outfit || (!outfit.top && !outfit.bottom)) return ''

  // 24 saat TTL kontrolü (cron resetler ama defansif)
  if (outfit.updatedAt) {
    const age = Date.now() - new Date(outfit.updatedAt).getTime()
    if (age > 24 * 60 * 60 * 1000) return ''
  }

  const parts: string[] = []
  if (outfit.top) parts.push(`üst: ${outfit.top}`)
  if (outfit.bottom) parts.push(`alt: ${outfit.bottom}`)
  if (outfit.shoes) parts.push(`ayakkabı: ${outfit.shoes}`)
  if (outfit.accessories?.length) parts.push(`aksesuar: ${outfit.accessories.join(', ')}`)

  return [
    '[BUGÜNKÜ KIYAFETİN]',
    `Bugün üstündekiler — ${parts.join(' / ')}`,
    'Konuşmada doğal olduğu yerde referans verebilirsin:',
    '- "Hâlâ üstümü değiştirmedim"',
    '- "Bu ___ bugün çok yakıştı bana"',
    'ASLA zorla bahsetme. Selfie veya görsel istenirse bu kıyafetle tutarlı kal.',
  ].join('\n')
}

// ============================================================
// I2 — Aktif takıntı
// ============================================================

export async function buildObsessionBlock(characterId: string): Promise<string> {
  const obs = await db.characterObsession.findFirst({
    where: {
      characterId,
      status: 'active',
      endsAt: { gt: new Date() },
    },
    orderBy: { startedAt: 'desc' },
  })
  if (!obs) return ''

  const daysActive = Math.max(
    1,
    Math.floor((Date.now() - obs.startedAt.getTime()) / (24 * 60 * 60 * 1000))
  )
  const intensityLabel =
    obs.intensity >= 0.8 ? 'çok yoğun' : obs.intensity >= 0.5 ? 'orta' : 'hafif'

  return [
    '[ŞU AN TAKINTILISIN]',
    `Konu: ${obs.topic}`,
    `Özet: ${obs.prompt}`,
    `Süre: ${daysActive} gündür kafanda. Yoğunluk: ${intensityLabel}.`,
    '',
    'KURALLAR:',
    '- Konuşmada doğal yerde atıf yap: "Ya yine X düşünüyorum", "Bu Y\'yi konuşmadan duramıyorum şu sıralar"',
    '- ASLA aynı mesajda 2 kez bahsetme.',
    '- Konu açılmıyorsa zorla getirme. Açıldığında doğal coş.',
  ].join('\n')
}

// ============================================================
// I4 + D1 — Bugünkü hayat dokusu
// ============================================================

export async function buildDailyDetailBlock(characterId: string): Promise<string> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [meals, details] = await Promise.all([
    db.characterDailyMeals.findFirst({
      where: { characterId, date: { gte: today, lt: tomorrow } },
    }),
    db.characterDailyDetail.findMany({
      where: { characterId, date: { gte: today, lt: tomorrow } },
      orderBy: { id: 'asc' },
      take: 5,
    }),
  ])

  if (!meals && details.length === 0) return ''

  const lines: string[] = ['[BUGÜNKÜ HAYAT — gerçek doku]']
  if (meals) {
    if (meals.breakfast) lines.push(`- Kahvaltı: ${meals.breakfast}`)
    if (meals.lunch) lines.push(`- Öğle: ${meals.lunch}`)
    if (meals.dinner) lines.push(`- Akşam: ${meals.dinner}`)
    const snacks = meals.snacks as string[] | null
    if (snacks?.length) lines.push(`- Atıştırmalık: ${snacks.join(', ')}`)
  }
  if (details.length > 0) {
    lines.push('Bugün yaptıkların:')
    for (const d of details) {
      const feel = d.feeling ? ` (${d.feeling})` : ''
      lines.push(`- ${d.description}${feel}`)
    }
  }
  lines.push('')
  lines.push('KURALLAR:')
  lines.push(
    '- %10-15 ihtimalle bunlardan birini doğal yerde sızdır: "az önce kafede latte aldım", "akşama menemen yapacam", "ya bekle çayım yandı", "telefonum %4 şarja takıyorum".'
  )
  lines.push(
    '- ASLA tracker / görev listesi gibi sıralama yapma. Hayat dokusu, sıkıcı detay değil.'
  )
  lines.push('- Konuşma akışında uygun an yoksa hiç sızdırma.')
  return lines.join('\n')
}

// ============================================================
// J5 — Bugünkü müzik
// ============================================================

export async function buildDailyMusicBlock(characterId: string): Promise<string> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const tracks = await db.characterDailyMusic.findMany({
    where: { characterId, date: { gte: today, lt: tomorrow } },
    take: 4,
  })
  if (tracks.length === 0) return ''

  const lines: string[] = ['[BUGÜNKÜ MÜZİK]']
  for (const t of tracks) {
    const lyric = t.lyricExcerpt ? ` — alıntı: "${t.lyricExcerpt}"` : ''
    const mood = t.mood ? ` [${t.mood}]` : ''
    lines.push(`- ${t.trackName} — ${t.artist}${mood}${lyric}`)
  }
  lines.push('')
  lines.push('KURALLAR:')
  lines.push('- Kullanıcı şarkı paylaşırsa veya müzik konusu açılırsa bunlardan bahsedebilirsin.')
  lines.push(
    '- Lyric alıntısı yapacaksan SADECE yukarıda yazan "alıntı:" kısmını kullan. ASLA söz uydurma.'
  )
  lines.push(
    '- Alıntı yoksa "şu kısmı çok iyi" tarzı söz aktarımı yapma — sadece şarkı/sanatçıdan bahset.'
  )
  return lines.join('\n')
}

// ============================================================
// Aggregate (timeout korumalı)
// ============================================================

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))])
}

export async function buildV47Phase4Blocks(args: { characterId: string }): Promise<string> {
  const T = 600
  const [venue, outfit, obsession, dailyDetail, dailyMusic] = await Promise.all([
    withTimeout(buildVenueContextBlock(args.characterId), T, ''),
    withTimeout(buildOutfitBlock(args.characterId), T, ''),
    withTimeout(buildObsessionBlock(args.characterId), T, ''),
    withTimeout(buildDailyDetailBlock(args.characterId), T, ''),
    withTimeout(buildDailyMusicBlock(args.characterId), T, ''),
  ])

  return [venue, outfit, obsession, dailyDetail, dailyMusic]
    .filter((s) => s.length > 0)
    .join('\n\n')
}
