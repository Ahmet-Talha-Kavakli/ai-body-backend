/**
 * V4.6 M61 — Ana AI Lokasyon + Olay Takibi
 *
 * Günde 1-2 cron:
 *   1. Aktif kullanıcıların IP'sinden ülke/şehir
 *   2. Lokal hava (Open-Meteo, ücretsiz)
 *   3. Lokal olaylar (önemli haberler, deprem vs)
 *   → LocalEvent tablosuna düşer
 *   → Tüm karakterler bu havuzdan çeker
 *   → Kişiliklerine göre filtreleyip prompt'a sızdırır
 *
 * Maliyet kontrolü: ortak havuz, her karakter ayrı API çağrısı yapmaz.
 */

import { db } from '@/lib/db/client'

export async function detectAndStoreUserLocation(userId: string): Promise<void> {
  // NOT: Lokal dev'de IP doğru gelmez (localhost). Manual default: TR/Istanbul.
  // Production'da req.headers'tan IP çekip ipapi.co ile sorgulayacağız.
  const existing = await db.userLocation.findUnique({ where: { userId } })
  if (existing && !existing.manuallySet) {
    // 7 günden eskiyse yenile
    const days = (Date.now() - existing.detectedAt.getTime()) / (86400 * 1000)
    if (days < 7) return
  }
  if (existing?.manuallySet) return

  const previousCity = existing?.city ?? null

  // Default fallback
  await db.userLocation.upsert({
    where: { userId },
    create: {
      userId,
      country: 'Turkey',
      countryCode: 'TR',
      city: 'Istanbul',
      latitude: 41.0082,
      longitude: 28.9784,
    },
    update: { detectedAt: new Date() },
  })

  // V4.7 B8 — Konum delta detection
  const updated = await db.userLocation.findUnique({ where: { userId } })
  if (previousCity && updated?.city && previousCity !== updated.city) {
    await emitUserLocationChangeFacts(userId, previousCity, updated.city)
  }
}

/**
 * V4.7 B8 — Kullanıcının city'si değiştiğinde aktif karakterlerine MemoryFact yaz.
 * Karakter sonra dolaylı olarak ("seyahatten döndün mü", "X nasıldı") soracak —
 * stream'deki memoryFactsBlock zaten bu fact'i içeriksel olarak görecek.
 */
async function emitUserLocationChangeFacts(
  userId: string,
  fromCity: string,
  toCity: string
): Promise<void> {
  const characters = await db.character.findMany({
    where: { userId, status: { in: ['active', 'recovering'] } },
    select: { id: true },
    take: 20,
  })
  if (characters.length === 0) return

  const content = `Kullanıcı ${fromCity}'den ${toCity}'ye geçti (konum değişimi tespit edildi).`
  for (const c of characters) {
    await db.characterMemoryFact.create({
      data: {
        userId,
        characterId: c.id,
        subject: 'user',
        category: 'event',
        content,
        importance: 3,
        emotionTag: null,
      },
    })
  }
}

interface WeatherSnapshot {
  tempC: number
  precipitation: number
  weatherCode: number
}

async function fetchWeather(lat: number, lng: number): Promise<WeatherSnapshot | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,weather_code&timezone=auto`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    return {
      tempC: data.current?.temperature_2m ?? 0,
      precipitation: data.current?.precipitation ?? 0,
      weatherCode: data.current?.weather_code ?? 0,
    }
  } catch {
    return null
  }
}

/**
 * GDELT free API — büyük olayları çek (deprem, sel, siyasi, vs).
 * Key gerektirmez, public.
 * Bir ülke için son 24 saatteki yüksek-tone olaylar.
 */
// ISO ülke kodundan GDELT FIPS kodu
const GDELT_COUNTRY_MAP: Record<string, string> = {
  TR: 'TU',
  US: 'US',
  GB: 'UK',
  DE: 'GM',
  FR: 'FR',
  IT: 'IT',
  ES: 'SP',
}

async function fetchMajorNews(
  countryCode: string
): Promise<Array<{ title: string; description: string; severity: number; occurredAt: Date }>> {
  try {
    const fips = GDELT_COUNTRY_MAP[countryCode] ?? countryCode
    // GDELT 2.0 doc API — basit ülke filtreli + tone filtre (negatif, ciddi)
    const query = encodeURIComponent(`sourcecountry:${fips} tone<-3`)
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&maxrecords=10&format=json&timespan=1d&sort=hybridrel`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    const articles = (data.articles ?? []) as Array<{
      title?: string
      seendate?: string
      url?: string
    }>
    return articles
      .filter((a) => !!a.title)
      .slice(0, 5)
      .map((a) => ({
        title: a.title!.slice(0, 200),
        description: a.url ?? '',
        severity: 2,
        occurredAt: a.seendate
          ? new Date(
              a.seendate.slice(0, 4) + '-' + a.seendate.slice(4, 6) + '-' + a.seendate.slice(6, 8)
            )
          : new Date(),
      }))
  } catch {
    return []
  }
}

/**
 * Cron — günde 2 kez. Her aktif kullanıcı için lokasyon + hava + olay tarar.
 */
export async function tickWorldMonitor(): Promise<{
  weatherChecked: number
  eventsCreated: number
  newsCreated: number
}> {
  let weatherChecked = 0
  let eventsCreated = 0
  let newsCreated = 0

  // Aktif kullanıcılar (son 7 günde mesaj atan)
  const since = new Date(Date.now() - 7 * 86400 * 1000)
  const activeUsers = await db.user.findMany({
    where: {
      assistantConversations: { some: { messages: { some: { createdAt: { gte: since } } } } },
    },
    select: { id: true },
    take: 200,
  })

  // Her kullanıcı için lokasyon
  for (const u of activeUsers) {
    await detectAndStoreUserLocation(u.id).catch(() => {})
  }

  // Unique konumlar için hava + olay
  const locations = await db.userLocation.findMany({
    where: { userId: { in: activeUsers.map((u) => u.id) } },
  })
  const seen = new Set<string>()
  for (const loc of locations) {
    const key = `${loc.countryCode}-${loc.city}`
    if (seen.has(key) || !loc.latitude || !loc.longitude) continue
    seen.add(key)

    const weather = await fetchWeather(loc.latitude, loc.longitude)
    if (!weather) continue
    weatherChecked++

    // Ekstrem hava → LocalEvent
    const isExtreme =
      weather.precipitation >= 1 ||
      weather.tempC > 33 ||
      weather.tempC < -2 ||
      [71, 73, 75, 77, 95, 96, 99].includes(weather.weatherCode)
    if (isExtreme && loc.countryCode) {
      const desc =
        weather.precipitation >= 1
          ? `Yağmur/kar var (${weather.precipitation}mm)`
          : weather.tempC > 33
            ? `Aşırı sıcak (${weather.tempC}°C)`
            : weather.tempC < -2
              ? `Aşırı soğuk (${weather.tempC}°C)`
              : 'Kötü hava'

      // Aynı gün aynı yerde duplicate ekleme
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const exists = await db.localEvent.findFirst({
        where: {
          countryCode: loc.countryCode,
          city: loc.city,
          category: 'weather',
          occurredAt: { gte: todayStart },
        },
      })
      if (!exists) {
        await db.localEvent.create({
          data: {
            countryCode: loc.countryCode,
            city: loc.city,
            category: 'weather',
            title: `${loc.city}'da hava: ${desc}`,
            description: desc,
            severity: 3,
            occurredAt: new Date(),
          },
        })
        eventsCreated++
      }
    }
  }

  // Önemli haberler (GDELT — ülke bazlı)
  const uniqueCountries = new Set(
    locations.map((l) => l.countryCode).filter((c): c is string => !!c)
  )
  for (const cc of uniqueCountries) {
    const news = await fetchMajorNews(cc)
    for (const n of news) {
      // Title duplicate kontrolü
      const exists = await db.localEvent.findFirst({
        where: { countryCode: cc, title: n.title },
      })
      if (exists) continue
      await db.localEvent.create({
        data: {
          countryCode: cc,
          city: null,
          category: 'news',
          title: n.title,
          description: n.description,
          severity: n.severity,
          occurredAt: n.occurredAt,
        },
      })
      newsCreated++
    }
  }

  // Eski event'leri solut (freshness decay)
  const stale = new Date(Date.now() - 3 * 86400 * 1000)
  await db.localEvent.updateMany({
    where: { occurredAt: { lt: stale }, freshness: { gt: 20 } },
    data: { freshness: { decrement: 30 } },
  })

  // Çok eski olanları sil
  const ancient = new Date(Date.now() - 14 * 86400 * 1000)
  await db.localEvent.deleteMany({ where: { occurredAt: { lt: ancient } } })

  return { weatherChecked, eventsCreated, newsCreated }
}

/**
 * Sistem prompt için: kullanıcının ve karakterin lokasyon + olayları.
 */
export async function buildLocalEventsBlock(args: {
  userId: string
  characterCity?: string | null
  characterCountryCode?: string | null
}): Promise<string> {
  const userLoc = await db.userLocation.findUnique({ where: { userId: args.userId } })

  // Kullanıcının yerindeki taze olaylar
  const userEvents = userLoc
    ? await db.localEvent.findMany({
        where: {
          countryCode: userLoc.countryCode ?? undefined,
          city: userLoc.city ?? undefined,
          freshness: { gte: 30 },
        },
        orderBy: { occurredAt: 'desc' },
        take: 3,
      })
    : []

  // Karakterin şehrindeki olaylar (farklı şehirdeyse)
  const charEvents =
    args.characterCity && args.characterCity !== userLoc?.city
      ? await db.localEvent.findMany({
          where: {
            countryCode: args.characterCountryCode ?? 'TR',
            city: args.characterCity,
            freshness: { gte: 30 },
          },
          orderBy: { occurredAt: 'desc' },
          take: 3,
        })
      : []

  if (userEvents.length === 0 && charEvents.length === 0) return ''

  let block = '[GÜNCEL DURUM]\n'
  if (userEvents.length > 0 && userLoc?.city) {
    block += `Kullanıcının şehrinde (${userLoc.city}):\n`
    for (const e of userEvents) block += `- ${e.title}\n`
  }
  if (charEvents.length > 0 && args.characterCity) {
    block += `Senin şehrinde (${args.characterCity}):\n`
    for (const e of charEvents) block += `- ${e.title}\n`
  }
  block += `KURAL: Doğal sızdır. Kullanıcı bahsetmeden de bahsedebilirsin. İlgi alanına göre filtre yap (magazin/spor/sanat/siyaset).\n\n`
  return block
}
