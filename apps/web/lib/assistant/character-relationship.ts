/**
 * V4 Faz C — Character Relationship Engine
 *
 * Kullanıcı ↔ karakter ilişki skorları + durum makinesi.
 *
 * Skorlar:
 *   - trustScore (0-100) — güven, yavaş artar, kavgayla hızlı düşer
 *   - loveScore (0-100) — sevgi/yakınlık, etkileşim sıklığıyla artar
 *   - intimacyDepth (0-1) — derinlik, paylaşılan secret/trauma sayısıyla artar
 *   - recentMomentum (-1 to +1) — son 2 hafta gidişat
 *   - accumulationDays — toplam birlikte gün sayısı
 *
 * Durumlar (status):
 *   active → cold → silent → broken → recovering → active
 *
 * Otomatik geçişler:
 *   - 7 gün etkileşim yok → cold
 *   - 21 gün etkileşim yok → silent
 *   - kullanıcı küfretmiş veya hostility event 3+ → broken
 *   - broken durumdan kullanıcı yumuşak konuşursa → recovering
 *   - recovering 7 gün başarılı → active
 *
 * V3'teki AssistantProfile.relationshipState'ten farklı: bu **karakter bazlı** ilişki.
 * V3 Jarvis için tek bir state, V4'te her karakterin ayrı state'i var.
 */

import { db } from '@/lib/db/client'
import { parseRecentBreakingPoints } from './cross-context-state'

export type RelationshipStatus = 'active' | 'cold' | 'silent' | 'broken' | 'recovering'

interface InteractionDelta {
  trust?: number // -10 ile +10
  love?: number
  intimacy?: number // 0-0.05
  momentumImpact?: number // -1 ile +1
  reason?: string
}

/**
 * Bir etkileşim sonrası ilişkiyi güncelle.
 * Mesaj atıldığında, sohbet bitirildiğinde, hostility tespit edildiğinde çağrılır.
 */
export async function updateRelationshipAfterInteraction(args: {
  userId: string
  characterId: string
  delta: InteractionDelta
}): Promise<void> {
  const { userId, characterId, delta } = args

  const rel = await db.memoryRelationship.findUnique({
    where: { userId_characterId: { userId, characterId } },
  })
  if (!rel) return

  const trustChange = clamp(delta.trust ?? 0, -15, 15)
  const loveChange = clamp(delta.love ?? 0, -15, 15)
  const intimacyChange = clamp(delta.intimacy ?? 0, -0.05, 0.05)
  const momentumImpact = clamp(delta.momentumImpact ?? 0, -1, 1)

  // Momentum exponential decay — yarısı kalır, yenisi eklenir
  const newMomentum = clamp(rel.recentMomentum * 0.5 + momentumImpact * 0.5, -1, 1)

  await db.memoryRelationship.update({
    where: { userId_characterId: { userId, characterId } },
    data: {
      trustScore: clamp(rel.trustScore + trustChange, 0, 100),
      loveScore: clamp(rel.loveScore + loveChange, 0, 100),
      intimacyDepth: clamp(rel.intimacyDepth + intimacyChange, 0, 1),
      recentMomentum: newMomentum,
      totalInteractions: rel.totalInteractions + 1,
      lastInteractionAt: new Date(),
      lastMessageAt: new Date(),
    },
  })

  // Durum makinesi kontrolü
  await checkAndTransitionStatus(userId, characterId, delta.reason)
}

/**
 * Durum makinesi — uygun geçişleri kontrol et ve uygula.
 * RelationshipEvent log'una yazılır.
 */
async function checkAndTransitionStatus(
  userId: string,
  characterId: string,
  reason?: string
): Promise<void> {
  const rel = await db.memoryRelationship.findUnique({
    where: { userId_characterId: { userId, characterId } },
  })
  if (!rel) return

  const currentStatus = rel.status as RelationshipStatus
  let nextStatus: RelationshipStatus | null = null
  let eventType: string | null = null

  // Hostility / düşük momentum → broken
  if (rel.recentMomentum < -0.7 && rel.trustScore < 30 && currentStatus !== 'broken') {
    nextStatus = 'broken'
    eventType = 'breaking_point'
  }
  // Broken → recovering: kullanıcı yumuşak konuşmaya başladı (momentum yükseliyor)
  else if (currentStatus === 'broken' && rel.recentMomentum > 0.2) {
    nextStatus = 'recovering'
    eventType = 'reconciliation'
  }
  // Recovering → active: 7 gün başarılı + momentum pozitif
  else if (
    currentStatus === 'recovering' &&
    rel.recentMomentum > 0.3 &&
    rel.lastInteractionAt &&
    Date.now() - rel.updatedAt.getTime() > 7 * 24 * 60 * 60 * 1000
  ) {
    nextStatus = 'active'
    eventType = 'recovery_complete'
  }

  if (nextStatus && nextStatus !== currentStatus) {
    await db.memoryRelationship.update({
      where: { userId_characterId: { userId, characterId } },
      data: { status: nextStatus },
    })
    if (eventType) {
      await db.relationshipEvent.create({
        data: {
          characterId,
          targetType: 'user',
          targetId: userId,
          eventType,
          severity: 3,
          reason: reason ?? null,
        },
      })
    }
  }
}

/**
 * Cron job tarafından çağrılır — uzun süre etkileşim olmamış ilişkileri cold/silent yap.
 */
export async function decayInactiveRelationships(): Promise<{ updated: number }> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const twentyOneDaysAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)

  // Active → cold (7 gün)
  const coldResult = await db.memoryRelationship.updateMany({
    where: {
      status: 'active',
      OR: [
        { lastInteractionAt: { lt: sevenDaysAgo } },
        { lastInteractionAt: null, updatedAt: { lt: sevenDaysAgo } },
      ],
    },
    data: { status: 'cold' },
  })

  // Cold → silent (21 gün)
  const silentResult = await db.memoryRelationship.updateMany({
    where: {
      status: 'cold',
      OR: [
        { lastInteractionAt: { lt: twentyOneDaysAgo } },
        { lastInteractionAt: null, updatedAt: { lt: twentyOneDaysAgo } },
      ],
    },
    data: { status: 'silent' },
  })

  return { updated: coldResult.count + silentResult.count }
}

/**
 * Accumulation days günlük cron — her ilişki için günlük 1 puan ekler.
 * Bu sayede 1 yıl sonra accumulationDays = 365.
 */
export async function incrementAccumulationDays(): Promise<{ updated: number }> {
  // Sadece aktif veya recovering ilişkiler için
  const result = await db.memoryRelationship.updateMany({
    where: {
      status: { in: ['active', 'recovering'] },
    },
    data: {
      accumulationDays: { increment: 1 },
    },
  })
  return { updated: result.count }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

/**
 * Karakter için ilişki snapshot'ı — system prompt'a verilir.
 */
export async function loadRelationshipSnapshot(
  userId: string,
  characterId: string
): Promise<{
  status: RelationshipStatus
  trustScore: number
  loveScore: number
  intimacyDepth: number
  recentMomentum: number
  accumulationDays: number
  totalInteractions: number
  daysSinceLastInteraction: number | null
  recentBreakingPoints: ReturnType<typeof parseRecentBreakingPoints>
  // V4.6 M9 — 5 eksen
  respectScore: number
  tensionScore: number
  familiarityScore: number
  // V4.6 M7 — İlişki tipi
  relationshipType: string
  typeIntensity: number
  pendingTypeChange: { proposedType?: string; proposedAt?: string; status?: string } | null
  // V4.6 M6 — Engelleme
  blockedUntil: Date | null
  blockReason: string | null
  permanentlyEnded: boolean
} | null> {
  const rel = await db.memoryRelationship.findUnique({
    where: { userId_characterId: { userId, characterId } },
  })
  if (!rel) return null

  const daysSince = rel.lastInteractionAt
    ? Math.floor((Date.now() - rel.lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24))
    : null

  return {
    status: rel.status as RelationshipStatus,
    trustScore: rel.trustScore,
    loveScore: rel.loveScore,
    intimacyDepth: rel.intimacyDepth,
    recentMomentum: rel.recentMomentum,
    accumulationDays: rel.accumulationDays,
    totalInteractions: rel.totalInteractions,
    daysSinceLastInteraction: daysSince,
    // V4.6 M3 — Cross-context conflict memory
    recentBreakingPoints: parseRecentBreakingPoints(rel.breakingPoints),
    // V4.6 M9 — 5 eksen skor
    respectScore: rel.respectScore,
    tensionScore: rel.tensionScore,
    familiarityScore: rel.familiarityScore,
    // V4.6 M7 — İlişki katmanları
    relationshipType: rel.relationshipType,
    typeIntensity: rel.typeIntensity,
    pendingTypeChange: (rel.pendingTypeChange as Record<string, string> | null) ?? null,
    // V4.6 M6 — Engelleme
    blockedUntil: rel.blockedUntil,
    blockReason: rel.blockReason,
    permanentlyEnded: rel.permanentlyEnded,
  }
}
