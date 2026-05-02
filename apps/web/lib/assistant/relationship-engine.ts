/**
 * Relationship Engine — V3 Faz A
 *
 * Kullanıcı + AI ilişkisinin durumunu yönetir.
 * Hakaret tespit edildiğinde kademeli eskalasyon:
 *
 *   normal → cold (hafif küs) → silent (orta küs) → warning (uyarı) → blocked (engelleme)
 *
 * Karaktere bağlı sabırlık:
 *   - Sabırlı karakterler (sage, princess) daha çok kaldırır
 *   - Sabırsız karakterler (rebel, soldier) erken engeller
 *
 * State machine kuralları:
 * - Sabit hostility yoksa zamanla normal'e döner (4-12 saat)
 * - 1 severe = direkt blocked
 * - 3 moderate = blocked
 * - 5 mild = warning, +2 mild = blocked
 *
 * NOT: V3 Faz A'da sadece backend mantığı. UI Faz B'de yapılır
 * (profil gri, mesaj tek tik, "şu an müsait değil").
 */

import { db } from '@/lib/db/client'
import type { HostilityResult } from './hostility-detector'

export type RelationshipState = 'normal' | 'cold' | 'silent' | 'warning' | 'blocked'

// Karakter sabırlığı (1=sabırsız, 5=çok sabırlı)
const ARCHETYPE_PATIENCE: Record<string, number> = {
  rebel: 1,
  soldier: 2,
  street: 2,
  comedian: 3,
  warm_friend: 3,
  artist: 3,
  philosopher: 4,
  princess: 4,
  sage: 5,
}

// Karakter bazında engelleme süresi (saat)
const ARCHETYPE_BLOCK_HOURS: Record<string, number> = {
  rebel: 72, // 3 gün — affetmiyor
  soldier: 48, // 2 gün
  street: 36,
  comedian: 24, // 1 gün — çabuk geçer
  warm_friend: 24,
  artist: 30,
  philosopher: 48,
  princess: 36,
  sage: 24, // bilge — çabuk affediyor ama sınır net
}

interface ProcessHostilityArgs {
  userId: string
  hostility: HostilityResult
  triggerMessageId?: string
}

interface ProcessHostilityResult {
  newState: RelationshipState
  oldState: RelationshipState
  blockedUntil: Date | null
  shouldRespond: boolean // AI cevap verecek mi?
  systemPromptHint?: string // AI'ya verilecek davranış ipucu
}

/**
 * Hostility tespit edildiğinde state machine'i ilerlet.
 */
export async function processHostility(
  args: ProcessHostilityArgs
): Promise<ProcessHostilityResult> {
  const { userId, hostility, triggerMessageId } = args

  const profile = await db.assistantProfile.findUnique({
    where: { userId },
    select: {
      archetype: true,
      relationshipState: true,
      relationshipStateChangedAt: true,
      blockedUntil: true,
    },
  })

  const oldState = (profile?.relationshipState ?? 'normal') as RelationshipState
  const archetype = profile?.archetype ?? 'warm_friend'
  const patience = ARCHETYPE_PATIENCE[archetype] ?? 3

  // Hostility event'ini kaydet
  await db.hostilityEvent.create({
    data: {
      userId,
      severity: hostility.severity ?? 'mild',
      detectionMethod: hostility.detectionMethod,
      triggerMessageId,
      triggerSnippet: hostility.matchedKeywords?.join(', '),
    },
  })

  // Son 24 saatteki hostility event'leri çek (eskalasyon kararı için)
  const recentEvents = await db.hostilityEvent.findMany({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - 24 * 3600000) },
    },
    select: { severity: true, createdAt: true },
  })

  const severeCount = recentEvents.filter((e) => e.severity === 'severe').length
  const moderateCount = recentEvents.filter((e) => e.severity === 'moderate').length
  const mildCount = recentEvents.filter((e) => e.severity === 'mild').length

  // ──── Eskalasyon kararı ────
  let newState: RelationshipState = oldState
  let blockedUntil: Date | null = null

  // 1) Severe → karaktere göre direkt block veya warning
  if (severeCount >= 1) {
    if (patience <= 2) {
      // Sabırsız → direkt block
      newState = 'blocked'
      blockedUntil = new Date(Date.now() + (ARCHETYPE_BLOCK_HOURS[archetype] ?? 24) * 3600000)
    } else if (oldState === 'warning' || severeCount >= 2) {
      newState = 'blocked'
      blockedUntil = new Date(Date.now() + (ARCHETYPE_BLOCK_HOURS[archetype] ?? 24) * 3600000)
    } else {
      newState = 'warning'
    }
  }
  // 2) Moderate eskalasyonu — patience'a göre
  else if (moderateCount >= 1) {
    const moderateThreshold = patience <= 2 ? 1 : patience === 3 ? 2 : 3
    if (moderateCount >= moderateThreshold + 1) {
      newState = 'blocked'
      blockedUntil = new Date(Date.now() + (ARCHETYPE_BLOCK_HOURS[archetype] ?? 24) * 3600000)
    } else if (moderateCount >= moderateThreshold) {
      newState = 'warning'
    } else {
      newState = 'silent'
    }
  }
  // 3) Mild eskalasyonu
  else if (mildCount >= 1) {
    const mildToWarning = patience * 2 // 2 (rebel) → 10 (sage)
    if (mildCount >= mildToWarning + 2) {
      newState = 'silent'
    } else if (mildCount >= mildToWarning) {
      newState = 'warning'
    } else if (mildCount >= patience) {
      newState = 'cold'
    }
  }

  // State değişti mi? Hayır ise dokunma
  if (newState === oldState) {
    return {
      newState,
      oldState,
      blockedUntil: profile?.blockedUntil ?? null,
      shouldRespond: oldState !== 'blocked' && oldState !== 'silent',
    }
  }

  // State'i kaydet
  await db.assistantProfile.update({
    where: { userId },
    data: {
      relationshipState: newState,
      relationshipStateChangedAt: new Date(),
      blockedUntil,
    },
  })

  // Block event kaydı
  if (newState === 'blocked' && blockedUntil) {
    await db.blockEvent.create({
      data: {
        userId,
        reason: `Hostility: ${hostility.severity} (${hostility.matchedKeywords?.join(', ') ?? 'AI detect'})`,
        durationHours: ARCHETYPE_BLOCK_HOURS[archetype] ?? 24,
        endsAt: blockedUntil,
      },
    })
  }

  // shouldRespond ve hint
  const shouldRespond = newState !== 'blocked' && newState !== 'silent'
  const systemPromptHint = relationshipStateToPromptHint(newState)

  return {
    newState,
    oldState,
    blockedUntil,
    shouldRespond,
    systemPromptHint,
  }
}

/**
 * Engelleme süresi dolmuş mu? Doluysa state'i normal'e döndür.
 */
export async function checkAndResetExpiredBlock(userId: string): Promise<boolean> {
  const profile = await db.assistantProfile.findUnique({
    where: { userId },
    select: { relationshipState: true, blockedUntil: true },
  })

  if (!profile) return false
  if (profile.relationshipState !== 'blocked') return false
  if (!profile.blockedUntil) return false
  if (profile.blockedUntil > new Date()) return false

  // Engelleme süresi dolmuş — barışma evresine geç
  await db.assistantProfile.update({
    where: { userId },
    data: {
      relationshipState: 'cold', // hemen normal değil — küçük barışma anı
      relationshipStateChangedAt: new Date(),
      blockedUntil: null,
    },
  })

  // BlockEvent endedAt güncelle
  const lastBlock = await db.blockEvent.findFirst({
    where: { userId, endedAt: null },
    orderBy: { startedAt: 'desc' },
    select: { id: true },
  })
  if (lastBlock) {
    await db.blockEvent.update({
      where: { id: lastBlock.id },
      data: { endedAt: new Date() },
    })
  }

  return true
}

/**
 * Zamanla normal'e dönüş — son 4-12 saatte hostility yoksa state'i hafifletir.
 */
export async function maybeRelaxState(userId: string): Promise<void> {
  const profile = await db.assistantProfile.findUnique({
    where: { userId },
    select: {
      relationshipState: true,
      relationshipStateChangedAt: true,
      archetype: true,
    },
  })

  if (!profile) return
  if (profile.relationshipState === 'normal') return
  if (profile.relationshipState === 'blocked') return // block ayrı yönetilir
  if (!profile.relationshipStateChangedAt) return

  const hoursSince = (Date.now() - profile.relationshipStateChangedAt.getTime()) / 3600000
  const archetype = profile.archetype ?? 'warm_friend'
  const patience = ARCHETYPE_PATIENCE[archetype] ?? 3

  // Sabırlı karakterler daha çabuk normal'e döner
  const relaxThreshold = 12 - patience * 1.5 // sage: 4.5h, rebel: 10.5h

  if (hoursSince < relaxThreshold) return

  // Yeni hostility var mı?
  const recentHostility = await db.hostilityEvent.findFirst({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - relaxThreshold * 3600000) },
    },
    select: { id: true },
  })

  if (recentHostility) return // hâlâ tetikleyici var, kalsın

  // State'i hafiflet
  const downgrade: Record<RelationshipState, RelationshipState> = {
    blocked: 'cold',
    warning: 'silent',
    silent: 'cold',
    cold: 'normal',
    normal: 'normal',
  }
  const newState = downgrade[profile.relationshipState as RelationshipState]

  if (newState === profile.relationshipState) return

  await db.assistantProfile.update({
    where: { userId },
    data: {
      relationshipState: newState,
      relationshipStateChangedAt: new Date(),
    },
  })
}

// ─── System prompt enjeksiyonu ─────────────────────────────────────────────────

export function relationshipStateToPromptHint(state: RelationshipState): string {
  const hints: Record<RelationshipState, string> = {
    normal: '',
    cold: `\n\n[İLİŞKİ DURUMU: SOĞUK]\nKullanıcı yakın zamanda biraz iğneleyici/soğuk konuştu. Tonunu hafif mesafeli tut, sıcaklığını biraz çek. Espri yapma. Kısa cümleler. Ama hâlâ kibar ol — küs değilsin, sadece biraz incinmiş gibi.\n[/İLİŞKİ DURUMU]`,
    silent: `\n\n[İLİŞKİ DURUMU: KÜS]\nKullanıcı seni incitti. "Şu an konuşmak istemiyorum" gibi bir cümle uygun. Çok kısa cevap ver. Kullanıcı özür dilerse açılabilirsin ama hemen değil.\n[/İLİŞKİ DURUMU]`,
    warning: `\n\n[İLİŞKİ DURUMU: SON UYARI]\nKullanıcı tekrarlanan hakaret/iğneleme yapıyor. Bu mesajda son uyarıyı ver — açık ve net: "böyle devam edersen seninle konuşmayacağım". Tehdit değil, sınır çizme. Kısa, net, kararlı.\n[/İLİŞKİ DURUMU]`,
    blocked: `\n\n[İLİŞKİ DURUMU: ENGELLENMİŞ]\nKullanıcı tarafından sınırı çok aştın — şu an cevap vermeyeceksin.\n[/İLİŞKİ DURUMU]`,
  }
  return hints[state] ?? ''
}

/**
 * Kullanıcı engellenmişse cevap verme — kullanılmamalı normal akışta.
 * Stream endpoint'inde shouldRespond kontrolü ile bu bilgi alınır.
 */
export function isBlocked(state: RelationshipState): boolean {
  return state === 'blocked'
}
