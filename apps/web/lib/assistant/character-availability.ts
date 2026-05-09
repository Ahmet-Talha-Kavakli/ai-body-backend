/**
 * V4.5 Faz 14 — Karakter Müsaitlik / Yanıt Gecikmesi
 *
 * Sorun: Karakter mood'u "tired", activity'si "sleeping" olsa bile şu an
 * 1 saniyede yanıt veriyor. Bu vizyonu kırıyor.
 *
 * Çözüm: Stream çağrılırken karakterin durumuna göre yanıt gecikmesi hesaplanır.
 *   - sleeping     → 30dk-6saat (gece) | dev'de 30sn-2dk
 *   - working/busy → 5-30 dk
 *   - eating       → 3-10 dk
 *   - angry        → 5-15 dk
 *   - tired        → 2-8 dk
 *   - normal       → 0-30sn (gerçek "yazıyor" hissi)
 *
 * Chain wake-up: kullanıcı arka arkaya 5+ mesaj attıysa süre kısaltılır.
 *
 * Dev mode: NEXT_PUBLIC_DEV_FAST_DELAYS=true ise tüm süreler /30 küçültülür.
 */

const DEV_FAST = process.env.DEV_FAST_DELAYS === 'true' || process.env.NODE_ENV !== 'production'
const DEV_SCALE = DEV_FAST ? 30 : 1

interface AvailabilityInput {
  currentActivity: string | null
  currentMood: string | null
  status: string | null
  pendingChainCount: number
  // saat (yerel)
  hourLocal: number
  // V4.6 M39 — kullanıcı mesaj uzunluğu (kelime sayısı) → okuma süresi
  userMessageWordCount?: number
  // V4.6 M36 — aktif saatler dışındaysa gecikme 1.5-3x
  outsideActiveHours?: boolean
}

export interface AvailabilityResult {
  /** Bu yanıt için beklenecek toplam ms (0 = anında) */
  delayMs: number
  /** Karakter şu an "açık" mı (hızlı tepki ya da kısa gecikme) */
  isOnline: boolean
  /** Hangi sebep ile delayed (UI'da gösterilebilir) */
  reason: 'sleeping' | 'busy' | 'eating' | 'angry' | 'tired' | 'normal'
}

function jitter(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min))
}

/**
 * Saatten uyku tahmini: Mia'nın sleepSchedule'ı varsa kesin, yoksa heuristic.
 * Şu an sadece basic heuristic — daha sonra sleepSchedule entegre edilebilir.
 */
function isSleepingHour(hour: number): boolean {
  return hour >= 0 && hour < 7
}

export function computeAvailability(input: AvailabilityInput): AvailabilityResult {
  const { currentActivity, currentMood, status, pendingChainCount, hourLocal } = input

  // Departed/silent karakterler zaten skip oluyor başka yerde
  // Burada sadece "müsait olmadığında ne kadar bekleyeceği"

  // Sleeping
  const sleepingByActivity = currentActivity === 'sleeping' || currentActivity === 'sleep'
  const sleepingByHour = isSleepingHour(hourLocal)
  if (sleepingByActivity || sleepingByHour) {
    // V4.6 M38 — %5 ihtimalle "tuvalete gidip eline aldı" (kısa uykulu cevap)
    // 4+ ardışık mesajda %30 wake-up
    const wakeUpProb = pendingChainCount >= 4 ? 0.3 : 0.05
    const wokeUp = Math.random() < wakeUpProb

    let baseMin = 30 * 60 * 1000
    let baseMax = 6 * 60 * 60 * 1000
    if (wokeUp) {
      baseMin = 30 * 1000 // 30sn
      baseMax = 3 * 60 * 1000 // 3dk — uykulu kısa cevap
    } else if (pendingChainCount >= 5) {
      baseMin = 1 * 60 * 1000
      baseMax = 5 * 60 * 1000
    } else if (pendingChainCount >= 3) {
      baseMin = 5 * 60 * 1000
      baseMax = 20 * 60 * 1000
    }
    return {
      delayMs: jitter(baseMin / DEV_SCALE, baseMax / DEV_SCALE),
      isOnline: false,
      reason: 'sleeping',
    }
  }

  // Working / commuting / studying
  if (
    currentActivity === 'working' ||
    currentActivity === 'studying' ||
    currentActivity === 'commuting'
  ) {
    const min = 5 * 60 * 1000
    const max = 30 * 60 * 1000
    if (pendingChainCount >= 4) {
      // Çok dikkat çekti, ara verdi
      return { delayMs: jitter(min / 4, min / DEV_SCALE), isOnline: false, reason: 'busy' }
    }
    return { delayMs: jitter(min / DEV_SCALE, max / DEV_SCALE), isOnline: false, reason: 'busy' }
  }

  // Eating
  if (currentActivity === 'eating') {
    return {
      delayMs: jitter((3 * 60 * 1000) / DEV_SCALE, (10 * 60 * 1000) / DEV_SCALE),
      isOnline: false,
      reason: 'eating',
    }
  }

  // Angry mood — kasıtlı geç cevap (alınmış gibi)
  if (currentMood === 'angry' || status === 'cold') {
    return {
      delayMs: jitter((5 * 60 * 1000) / DEV_SCALE, (15 * 60 * 1000) / DEV_SCALE),
      isOnline: true, // teknik olarak ekranı görüyor ama yavaş cevap
      reason: 'angry',
    }
  }

  // Tired mood — yavaş yazıyor
  if (currentMood === 'tired') {
    return {
      delayMs: jitter((2 * 60 * 1000) / DEV_SCALE, (8 * 60 * 1000) / DEV_SCALE),
      isOnline: true,
      reason: 'tired',
    }
  }

  // Normal — kısa "yazıyor" gecikmesi (1-25 saniye, gerçek typing hissi)
  let baseMin = 1000
  let baseMax = 25000

  // V4.6 M39 — Kullanıcı uzun mesaj attıysa karakter okuma süresi geçirir
  // kelime başı 200ms, cap 30sn
  if (input.userMessageWordCount && input.userMessageWordCount > 10) {
    const readingMs = Math.min(30000, input.userMessageWordCount * 200)
    baseMin += readingMs * 0.5
    baseMax += readingMs
  }

  // V4.6 M36 — Aktif saatler dışında gecikme 1.5-3x
  if (input.outsideActiveHours) {
    baseMin = Math.floor(baseMin * 1.5)
    baseMax = Math.floor(baseMax * 3)
  }

  return {
    delayMs: jitter(baseMin, baseMax),
    isOnline: true,
    reason: 'normal',
  }
}

/**
 * "Son görüldü" zamanını insancıl formatta yaz.
 * 30sn → "az önce"
 * 5dk → "5 dk önce"
 * 90dk → "1 saat önce"
 * 5 saat → "5 saat önce"
 * 1 gün → "dün"
 * 2+ gün → "X gün önce"
 */
export function formatLastSeen(lastSeenAt: Date | null): string {
  if (!lastSeenAt) return 'çevrimdışı'
  const diff = Date.now() - lastSeenAt.getTime()
  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hour = Math.floor(min / 60)
  const day = Math.floor(hour / 24)

  if (sec < 30) return 'çevrimiçi'
  if (sec < 60) return 'az önce'
  if (min === 1) return '1 dakika önce'
  if (min < 60) return `${min} dk önce`
  if (hour === 1) return '1 saat önce'
  if (hour < 24) return `${hour} saat önce`
  if (day === 1) return 'dün'
  if (day < 7) return `${day} gün önce`
  return 'uzun süre önce'
}
