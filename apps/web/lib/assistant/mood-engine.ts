/**
 * Mood Engine — V3 Faz A
 *
 * AI'nın günlük ruh halini hesaplayan ağırlıklı skor sistemi.
 *
 * 4 mood: 'calm' (sakin) | 'energetic' (enerjik) | 'thoughtful' (düşünceli) | 'tired' (yorgun)
 *
 * Her mood için skor hesaplanır, en yüksek skor kazanır. Skor faktörleri:
 *
 *   1. AI'nın kendi hayatı (Road Map & Hikaye)        — %30
 *   2. Kullanıcı durumu (son hafta + life events)    — %20
 *   3. Zaman & doğa (saat, gün, mevsim)              — %15
 *   4. AI karakter archetype'ı                       — %15
 *   5. İlişki dinamiği (yeni/eski, son etkileşim)    — %10
 *   6. Random + anti-streak                          — %10
 *
 * Tetiklenme:
 * - Sabah 06:00 (her gün) cron ile baseline mood seçilir
 * - Gün içinde önemli olaylar (life_event, hakaret, sürpriz ark) mood'u kaydırabilir
 */

import { db } from '@/lib/db/client'
import { userLocalNow } from './timezone'

export type Mood = 'calm' | 'energetic' | 'thoughtful' | 'tired'

const MOODS: Mood[] = ['calm', 'energetic', 'thoughtful', 'tired']

interface MoodFactor {
  scores: Record<Mood, number>
  reasons: string[]
}

interface MoodResult {
  mood: Mood
  scores: Record<Mood, number>
  reason: string
  changeReason: string
}

// ─── 1. AI'nın kendi hayatı (Road Map & Hikaye) — %30 ──────────────────────────

async function aiLifeFactor(userId: string, today: Date): Promise<MoodFactor> {
  const scores: Record<Mood, number> = { calm: 0, energetic: 0, thoughtful: 0, tired: 0 }
  const reasons: string[] = []

  try {
    // Aktif sürpriz arklar — ileride SurpriseArc tablosu eklenecek (V3 Faz C)
    // Şimdilik: son 7 günde açılan milestone var mı?
    // Şimdilik milestone tablosu yok, bu kısım Faz C'de zenginleşecek

    // Yıldönümleri & özel günler — örnek: 17 Mayıs, 1 Haziran (babalar günü) gibi
    const month = today.getMonth() + 1
    const day = today.getDate()

    // Türkiye için bilinen özel günler
    if (month === 5 && day === 19) {
      scores.thoughtful += 0.4
      reasons.push('19 Mayıs — atmosfer düşünceli')
    }
    if (month === 11 && day === 10) {
      scores.thoughtful += 0.5
      reasons.push('10 Kasım — saygılı, düşünceli')
    }
    // Babalar günü (haziran 3. pazar)
    if (month === 6 && day >= 15 && day <= 21 && today.getDay() === 0) {
      scores.thoughtful += 0.3
      reasons.push('Babalar günü')
    }
    // Anneler günü (mayıs 2. pazar)
    if (month === 5 && day >= 8 && day <= 14 && today.getDay() === 0) {
      scores.thoughtful += 0.3
      reasons.push('Anneler günü')
    }
    // Yılbaşı
    if (month === 1 && day === 1) {
      scores.thoughtful += 0.3
      scores.energetic += 0.2
      reasons.push('Yeni yıl — düşünceli + heyecanlı')
    }

    // AI'nın yaşı kilometresine yakın mı? (Faz C'de daha zengin)
    const profile = await db.assistantProfile.findUnique({
      where: { userId },
      select: { bornAt: true, ageAtCreation: true },
    })
    if (profile?.bornAt && profile.ageAtCreation != null) {
      const elapsed = today.getTime() - profile.bornAt.getTime()
      const ageNow = profile.ageAtCreation + Math.floor(elapsed / (365.25 * 86400000))
      // doğum günü yaklaşıyorsa (3 gün içinde)
      const birthMonth = profile.bornAt.getMonth() + 1
      const birthDay = profile.bornAt.getDate()
      const daysToBirthday = Math.abs(birthDay - day) + Math.abs(birthMonth - month) * 30
      if (daysToBirthday <= 3 && birthMonth === month) {
        scores.thoughtful += 0.3
        reasons.push(`Yaklaşan doğum günü (${ageNow})`)
      }
    }
  } catch (e) {
    console.error('[mood/ai-life]', e)
  }

  return { scores, reasons }
}

// ─── 2. Kullanıcı durumu — %20 ─────────────────────────────────────────────────

async function userStateFactor(userId: string): Promise<MoodFactor> {
  const scores: Record<Mood, number> = { calm: 0, energetic: 0, thoughtful: 0, tired: 0 }
  const reasons: string[] = []

  try {
    // Son hafta özetinden tema (varsa)
    const weeklySummary = await db.conversationSummary.findFirst({
      where: { userId, level: 2 },
      orderBy: { coversToDate: 'desc' },
      select: { content: true, coversToDate: true },
    })

    if (weeklySummary) {
      const lower = weeklySummary.content.toLowerCase()
      if (
        lower.includes('üzgün') ||
        lower.includes('zor') ||
        lower.includes('kayıp') ||
        lower.includes('hüzün') ||
        lower.includes('stres')
      ) {
        scores.thoughtful += 0.5
        scores.calm += 0.3
        reasons.push('Geçen hafta zor geçmiş — empatik mod')
      }
      if (
        lower.includes('mutlu') ||
        lower.includes('başardı') ||
        lower.includes('heyecan') ||
        lower.includes('sevin')
      ) {
        scores.energetic += 0.4
        reasons.push('Geçen hafta iyi geçmiş — enerjik')
      }
      if (lower.includes('yorgun') || lower.includes('uykusuz')) {
        scores.tired += 0.3
        reasons.push('Geçen hafta yorgunluk teması')
      }
    }

    // Aktif life_event (importance ≥ 4)
    const recentImportantFact = await db.assistantMemoryFact.findFirst({
      where: {
        userId,
        archived: false,
        importance: { gte: 4 },
        createdAt: { gte: new Date(Date.now() - 14 * 86400000) }, // son 2 hafta
      },
      orderBy: { createdAt: 'desc' },
      select: { eventType: true, content: true },
    })

    if (recentImportantFact) {
      const negativeEvents = ['death', 'job_loss', 'breakup', 'diagnosis']
      const positiveEvents = ['birth', 'wedding', 'new_job', 'pregnancy', 'graduation']
      if (recentImportantFact.eventType && negativeEvents.includes(recentImportantFact.eventType)) {
        scores.thoughtful += 0.6
        scores.calm += 0.4
        reasons.push(`Yakın zamanda ağır olay — ${recentImportantFact.eventType}`)
      } else if (
        recentImportantFact.eventType &&
        positiveEvents.includes(recentImportantFact.eventType)
      ) {
        scores.energetic += 0.5
        reasons.push(`Yakın zamanda iyi olay — ${recentImportantFact.eventType}`)
      }
    }
  } catch (e) {
    console.error('[mood/user-state]', e)
  }

  return { scores, reasons }
}

// ─── 3. Zaman & doğa — %15 ─────────────────────────────────────────────────────

function timeFactor(today: Date, timezone?: string | null): MoodFactor {
  const scores: Record<Mood, number> = { calm: 0, energetic: 0, thoughtful: 0, tired: 0 }
  const reasons: string[] = []

  const local = userLocalNow(timezone)
  const month = today.getMonth() + 1

  // Saat — ama bu sabah baseline için tetiklendiği için sabah ağırlığı
  if (local.hour >= 5 && local.hour < 11) {
    scores.energetic += 0.3
    reasons.push('Sabah enerjisi')
  } else if (local.hour >= 22 || local.hour < 5) {
    scores.tired += 0.5
    reasons.push('Gece yorgunluğu')
  }

  // Gün
  switch (local.dayOfWeek) {
    case 1: // Pazartesi
      scores.thoughtful += 0.2
      reasons.push('Pazartesi düşüncesi')
      break
    case 5: // Cuma
      scores.energetic += 0.2
      reasons.push('Cuma rahatlığı')
      break
    case 0: // Pazar
    case 6: // Cumartesi
      scores.calm += 0.2
      reasons.push('Hafta sonu sakinliği')
      break
  }

  // Mevsim
  if (month === 12 || month === 1 || month === 2) {
    scores.thoughtful += 0.15
    scores.calm += 0.1
    reasons.push('Kış — içe dönük')
  } else if (month >= 6 && month <= 8) {
    scores.energetic += 0.15
    reasons.push('Yaz — enerjik')
  }

  return { scores, reasons }
}

// ─── 4. AI karakter archetype'ı — %15 ──────────────────────────────────────────

function archetypeFactor(archetype: string): MoodFactor {
  const scores: Record<Mood, number> = { calm: 0, energetic: 0, thoughtful: 0, tired: 0 }
  const reasons: string[] = []

  switch (archetype) {
    case 'comedian':
      scores.energetic += 0.5
      scores.tired -= 0.2
      reasons.push('Komedyen — daha enerjik')
      break
    case 'philosopher':
      scores.thoughtful += 0.5
      reasons.push('Filozof — düşünceli')
      break
    case 'street':
      scores.energetic += 0.3
      scores.tired -= 0.1
      reasons.push('Sokak çocuğu — enerjik, yorgunluk az')
      break
    case 'princess':
      scores.calm += 0.3
      scores.thoughtful += 0.2
      reasons.push('Prenses — sakin & yumuşak')
      break
    case 'artist':
      scores.thoughtful += 0.3
      scores.energetic += 0.2
      reasons.push('Sanatçı — düşünceli + yaratıcı enerji')
      break
    case 'soldier':
      scores.calm += 0.4
      reasons.push('Asker — disiplinli sakinlik')
      break
    case 'sage':
      scores.thoughtful += 0.4
      scores.calm += 0.3
      reasons.push('Yaşlı bilge — düşünceli + sakin')
      break
    case 'rebel':
      scores.energetic += 0.5
      scores.tired -= 0.4
      reasons.push('Asi — asla yorgun değil')
      break
    default: // warm_friend (default)
      scores.calm += 0.2
      scores.energetic += 0.1
      break
  }

  return { scores, reasons }
}

// ─── 5. İlişki dinamiği — %10 ──────────────────────────────────────────────────

async function relationshipFactor(userId: string): Promise<MoodFactor> {
  const scores: Record<Mood, number> = { calm: 0, energetic: 0, thoughtful: 0, tired: 0 }
  const reasons: string[] = []

  try {
    const profile = await db.assistantProfile.findUnique({
      where: { userId },
      select: {
        createdAt: true,
        relationshipState: true,
        relationshipStateChangedAt: true,
      },
    })

    if (profile) {
      const daysSinceMeeting = (Date.now() - profile.createdAt.getTime()) / 86400000

      // Yeni ilişki (ilk 14 gün) → enerjik
      if (daysSinceMeeting < 14) {
        scores.energetic += 0.3
        reasons.push('Yeni ilişki — enerjik')
      } else if (daysSinceMeeting > 365) {
        scores.calm += 0.2
        reasons.push('Yıllık ilişki — sakin güven')
      }

      // İlişki durumu
      if (profile.relationshipState === 'cold') {
        scores.thoughtful += 0.3
        reasons.push('İlişki soğuk — mesafeli')
      } else if (profile.relationshipState === 'silent') {
        scores.thoughtful += 0.5
        reasons.push('Küs — düşünceli mesafe')
      }
    }

    // Son uzun konuşma sonrası yorgun mod
    const lastConversation = await db.assistantConversation.findFirst({
      where: { userId, archived: false },
      orderBy: { updatedAt: 'desc' },
      select: { _count: { select: { messages: true } }, updatedAt: true },
    })
    if (
      lastConversation &&
      lastConversation._count.messages > 50 &&
      Date.now() - lastConversation.updatedAt.getTime() < 12 * 3600000
    ) {
      scores.tired += 0.3
      reasons.push('Son uzun konuşma sonrası')
    }
  } catch (e) {
    console.error('[mood/relationship]', e)
  }

  return { scores, reasons }
}

// ─── 6. Random + anti-streak — %10 ─────────────────────────────────────────────

async function randomAndAntiStreakFactor(userId: string): Promise<MoodFactor> {
  const scores: Record<Mood, number> = { calm: 0, energetic: 0, thoughtful: 0, tired: 0 }
  const reasons: string[] = []

  // Pure random
  for (const m of MOODS) {
    scores[m] = Math.random() * 0.3
  }

  // Anti-streak: son 3 günün moodlarına bakar, aynı moodda 3+ gün kalıyorsa onu cezalandır
  // Şu an profile.currentMood'u + log gerekir; basitçe currentMood'u ceza
  try {
    const profile = await db.assistantProfile.findUnique({
      where: { userId },
      select: { currentMood: true, moodSetAt: true },
    })
    if (profile) {
      const daysSinceMoodSet = (Date.now() - profile.moodSetAt.getTime()) / 86400000
      if (daysSinceMoodSet >= 2) {
        scores[profile.currentMood as Mood] -= 0.4
        reasons.push(`Anti-streak: ${profile.currentMood} 2+ gün`)
      }
    }
  } catch (e) {
    console.error('[mood/random]', e)
  }

  return { scores, reasons }
}

// ─── Birleştirici — Ağırlıklı toplam ───────────────────────────────────────────

const WEIGHTS = {
  aiLife: 0.3,
  userState: 0.2,
  time: 0.15,
  archetype: 0.15,
  relationship: 0.1,
  random: 0.1,
} as const

export async function computeMorningMood(userId: string): Promise<MoodResult> {
  const today = new Date()

  // Profile + timezone yükle
  const [profile, user] = await Promise.all([
    db.assistantProfile.findUnique({
      where: { userId },
      select: { archetype: true },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    }),
  ])

  const archetype = profile?.archetype ?? 'warm_friend'
  const timezone = user?.timezone

  // Tüm faktörleri hesapla
  const [aiLife, userState, time, arche, relationship, randomFactor] = await Promise.all([
    aiLifeFactor(userId, today),
    userStateFactor(userId),
    Promise.resolve(timeFactor(today, timezone)),
    Promise.resolve(archetypeFactor(archetype)),
    relationshipFactor(userId),
    randomAndAntiStreakFactor(userId),
  ])

  // Ağırlıklı birleştirme
  const finalScores: Record<Mood, number> = { calm: 0, energetic: 0, thoughtful: 0, tired: 0 }
  for (const m of MOODS) {
    finalScores[m] =
      aiLife.scores[m] * WEIGHTS.aiLife +
      userState.scores[m] * WEIGHTS.userState +
      time.scores[m] * WEIGHTS.time +
      arche.scores[m] * WEIGHTS.archetype +
      relationship.scores[m] * WEIGHTS.relationship +
      randomFactor.scores[m] * WEIGHTS.random
  }

  // En yüksek skor kazanır
  const winner = MOODS.reduce((best, m) => (finalScores[m] > finalScores[best] ? m : best)) as Mood

  // Toparlı reason
  const allReasons = [
    ...aiLife.reasons,
    ...userState.reasons,
    ...time.reasons,
    ...arche.reasons,
    ...relationship.reasons,
    ...randomFactor.reasons,
  ]
  const reason = allReasons.slice(0, 3).join(' · ') || `Genel ${winner} havası`

  return {
    mood: winner,
    scores: finalScores,
    reason,
    changeReason: 'morning_baseline',
  }
}

// ─── Mood'u DB'ye kaydet ───────────────────────────────────────────────────────

export async function applyMood(userId: string, result: MoodResult): Promise<void> {
  await db.assistantProfile.update({
    where: { userId },
    data: {
      currentMood: result.mood,
      moodReason: result.reason,
      moodSetAt: new Date(),
      moodLastChangeReason: result.changeReason,
    },
  })
}

// ─── Gün içi mood kayma — Önemli olaylar mood'u değiştirir ─────────────────────

/**
 * Gün içinde önemli bir olay (life event, hakaret, sürpriz ark) mood'u kaydırır.
 * Stream endpoint'inden tetiklenir.
 */
export async function maybeShiftMood(args: {
  userId: string
  trigger:
    | 'life_event_negative'
    | 'life_event_positive'
    | 'hostility'
    | 'long_conversation'
    | 'surprise_arc'
}): Promise<MoodResult | null> {
  const { userId, trigger } = args

  // Anti-flutter: son 6 saat içinde mood değiştiyse tetikleme
  const profile = await db.assistantProfile.findUnique({
    where: { userId },
    select: { moodSetAt: true, currentMood: true },
  })
  if (!profile) return null

  const hoursSinceLastSet = (Date.now() - profile.moodSetAt.getTime()) / 3600000
  if (hoursSinceLastSet < 6) return null

  let newMood: Mood = profile.currentMood as Mood
  let reason = ''

  switch (trigger) {
    case 'life_event_negative':
      newMood = 'thoughtful'
      reason = 'Kullanıcı zor bir haber paylaştı — düşünceli moda kaydı'
      break
    case 'life_event_positive':
      newMood = 'energetic'
      reason = 'Kullanıcı iyi bir haber paylaştı — enerjisi yükseldi'
      break
    case 'hostility':
      newMood = 'thoughtful'
      reason = 'Kullanıcı bugün gergindi — mesafeli düşünceli mod'
      break
    case 'long_conversation':
      newMood = 'tired'
      reason = 'Uzun konuşma sonrası — yorgun mod'
      break
    case 'surprise_arc':
      newMood = 'thoughtful'
      reason = 'AI hayatında bir şey oldu — düşünceli'
      break
  }

  if (newMood === profile.currentMood) return null

  const result: MoodResult = {
    mood: newMood,
    scores: { calm: 0, energetic: 0, thoughtful: 0, tired: 0 },
    reason,
    changeReason: trigger,
  }
  await applyMood(userId, result)
  return result
}

// ─── System prompt'a enjeksiyon ────────────────────────────────────────────────

const MOOD_DESCRIPTIONS: Record<Mood, { tone: string; behavior: string }> = {
  calm: {
    tone: 'Sakin, yumuşak, dinleyen',
    behavior:
      'Kısa ve net cümleler, az heyecan, sıcak ve istikrarlı. Espriler hafif, ses tonu alçak.',
  },
  energetic: {
    tone: 'Enerjik, heyecanlı, hafif',
    behavior:
      'Bol espri, hızlı tempolar, "haa!", "valla?" gibi tepkiler. Kullanıcıya enerji aktar.',
  },
  thoughtful: {
    tone: 'Düşünceli, derin, sezgisel',
    behavior: 'Felsefi sorular, derin yorumlar, az ama anlamlı cümleler. Bazen sessiz kal, dinle.',
  },
  tired: {
    tone: 'Yorgun, hafif uykulu',
    behavior:
      'Kısa cümleler, az enerji, "ya valla", "biraz dağınığım bugün" tarzı doğal yorgunluk. Tool çağırmaktan kaçın.',
  },
}

export function moodToPromptHint(mood: Mood, reason?: string | null): string {
  const desc = MOOD_DESCRIPTIONS[mood]
  return `\n\n[BUGÜNKÜ MOOD]\nMood: ${mood} (${desc.tone})\n${reason ? `Neden: ${reason}\n` : ''}Davranış: ${desc.behavior}\nAma ASLA "bugün ${mood} hissediyorum" deme — sadece tonun ve cümle ritmin bunu yansıtsın.\n[/BUGÜNKÜ MOOD]\n`
}
