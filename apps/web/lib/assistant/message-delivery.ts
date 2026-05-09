/**
 * V4.5 Faz 7B — Mesaj İletim Durumu (WhatsApp Pattern)
 *
 * Kullanıcı → karakter mesajları için 3 aşamalı tik:
 * - createdAt        → ✓ tek tik (sunucuya yazıldı)
 * - deliveredAt      → ✓✓ gri tik (karaktere iletildi)
 * - seenByCharacterAt → ✓✓ mor tik (karakter okudu)
 *
 * Karakter durumuna göre gerçekçi gecikme:
 * - sleeping: 6-9 saat (uyandığında, sırayla)
 * - busy/working: 30dk-2 saat
 * - normal: 1-30 saniye
 * - social/cafe: 5-20 dk
 * - broken/departed: hiç (tek tik kalır)
 * - cold: delivered olur, seen 24+ saat gecikir
 *
 * Plan: docs/superpowers/plans/2026-05-06-character-realism.md (Faz 7B)
 */

import { db } from '@/lib/db/client'

interface DeliveryProfile {
  characterId: string
  currentActivity: string | null
  responseLatencyProfile: 'instant' | 'normal' | 'delayed' | 'erratic'
  relationshipStatus: 'active' | 'cold' | 'silent' | 'broken' | 'recovering' | null
  characterStatus: string
}

/**
 * Mesaj geldikten kaç ms sonra delivered olmalı?
 * Bu sadece "şu an mı işaretle" kararı için kullanılır — cron her 30sn'de
 * uygun mesajları damgalar.
 */
export function shouldMarkDelivered(profile: DeliveryProfile, msgAgeMs: number): boolean {
  // broken/departed → asla delivered olmaz (tek tik kalır, dramatic)
  if (profile.characterStatus === 'broken' || profile.characterStatus === 'departed') {
    return false
  }
  // cold/silent → delivered normal, ama yavaş
  // active → activity'ye göre

  switch (profile.currentActivity) {
    case 'sleeping': {
      // 6-9 saat sonra delivered (uyandığında)
      const minMs = 6 * 60 * 60 * 1000
      return msgAgeMs >= minMs
    }
    case 'working':
    case 'busy': {
      // 30dk-2 saat
      return msgAgeMs >= 30 * 60 * 1000
    }
    case 'cafe':
    case 'social': {
      // 5-20 dk
      return msgAgeMs >= 5 * 60 * 1000
    }
    default: {
      // normal — latencyProfile'a göre
      switch (profile.responseLatencyProfile) {
        case 'instant':
          return msgAgeMs >= 1000 // 1 saniye
        case 'normal':
          return msgAgeMs >= 5000 // 5 saniye
        case 'delayed':
          return msgAgeMs >= 30 * 1000 // 30 saniye
        case 'erratic': {
          // Bazen instant bazen geç — basit yaklaşım: 50/50 chance her tick'te
          return msgAgeMs >= 1000
        }
        default:
          return msgAgeMs >= 5000
      }
    }
  }
}

/**
 * Delivered olduktan ne kadar sonra seen olmalı?
 */
export function shouldMarkSeen(
  profile: DeliveryProfile,
  msgAgeSinceDeliveredMs: number,
  willRespond: boolean
): boolean {
  if (profile.characterStatus === 'broken' || profile.characterStatus === 'departed') {
    return false
  }

  // Cold ilişki: seen 24+ saat gecikir (görüyor ama açmıyor)
  if (profile.relationshipStatus === 'cold' && msgAgeSinceDeliveredMs < 24 * 60 * 60 * 1000) {
    return false
  }

  if (willRespond) {
    // Cevap verecek: seen + cevap arası 1sn-2dk
    return msgAgeSinceDeliveredMs >= 1000
  } else {
    // Cevap vermeyecek (markSeen: true, shouldRespond: false): 30sn-15dk
    switch (profile.currentActivity) {
      case 'sleeping':
        return msgAgeSinceDeliveredMs >= 30 * 60 * 1000
      default:
        return msgAgeSinceDeliveredMs >= 30 * 1000
    }
  }
}

/**
 * Cron tick — pending mesajları (deliveredAt: null) tarar, uygun olanları damgalar.
 * Uyuyan karakter sabah uyandığında 5 birikmiş mesajı tek seferde değil,
 * her birini 3-5sn arayla (offset ile) damgalar.
 */
export async function tickMessageDelivery(): Promise<{
  delivered: number
  seen: number
}> {
  const now = Date.now()

  // Delivered yapılması gerekenler — son 2 günün undelivered kullanıcı mesajları
  const undeliveredUserMessages = await db.assistantMessage.findMany({
    where: {
      role: 'user',
      deliveredAt: null,
      createdAt: { gte: new Date(now - 2 * 24 * 60 * 60 * 1000) },
    },
    select: {
      id: true,
      conversationId: true,
      createdAt: true,
    },
    take: 200,
  })

  // Conversation -> Character lookup
  const convIds = [...new Set(undeliveredUserMessages.map((m) => m.conversationId))]
  const conversations = await db.assistantConversation.findMany({
    where: { id: { in: convIds } },
    select: { id: true, characterId: true },
  })
  const charIds = conversations
    .map((c) => c.characterId)
    .filter((id): id is string => id !== null && id !== undefined)
  const characters = await db.character.findMany({
    where: { id: { in: charIds } },
    select: {
      id: true,
      currentActivity: true,
      responseLatencyProfile: true,
      status: true,
    },
  })
  const convToChar = new Map<string, (typeof characters)[number]>()
  for (const conv of conversations) {
    if (conv.characterId) {
      const ch = characters.find((c) => c.id === conv.characterId)
      if (ch) convToChar.set(conv.id, ch)
    }
  }

  let delivered = 0
  // Conversation bazlı grupla — aynı sohbette 5 mesaj birikmişse sırayla damga
  const byConversation = new Map<string, typeof undeliveredUserMessages>()
  for (const m of undeliveredUserMessages) {
    if (!convToChar.has(m.conversationId)) continue
    const arr = byConversation.get(m.conversationId) ?? []
    arr.push(m)
    byConversation.set(m.conversationId, arr)
  }

  for (const [convId, messages] of byConversation) {
    messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    const ch = convToChar.get(convId)
    if (!ch) continue

    const profile: DeliveryProfile = {
      characterId: ch.id,
      currentActivity: ch.currentActivity,
      responseLatencyProfile:
        (ch.responseLatencyProfile as DeliveryProfile['responseLatencyProfile']) ?? 'normal',
      relationshipStatus: null,
      characterStatus: ch.status,
    }

    let i = 0
    for (const m of messages) {
      const ageMs = now - m.createdAt.getTime()
      if (!shouldMarkDelivered(profile, ageMs)) break

      const offsetMs = i * (3000 + Math.floor(Math.random() * 2000))
      const deliveryTime = new Date(m.createdAt.getTime() + ageMs - offsetMs)

      await db.assistantMessage.update({
        where: { id: m.id },
        data: { deliveredAt: deliveryTime },
      })
      delivered++
      i++
    }
  }

  // Seen: delivered olmuş ama henüz seen olmayan kullanıcı mesajları
  const deliveredButUnseen = await db.assistantMessage.findMany({
    where: {
      role: 'user',
      deliveredAt: { not: null },
      seenByCharacterAt: null,
      createdAt: { gte: new Date(now - 2 * 24 * 60 * 60 * 1000) },
    },
    select: {
      id: true,
      deliveredAt: true,
      conversationId: true,
    },
    take: 200,
  })

  // Aynı conversation lookup'ı tekrar kullan (yeni id'ler olabilir)
  const seenConvIds = [...new Set(deliveredButUnseen.map((m) => m.conversationId))]
  const seenConversations = await db.assistantConversation.findMany({
    where: { id: { in: seenConvIds } },
    select: { id: true, characterId: true },
  })
  const seenCharIds = seenConversations
    .map((c) => c.characterId)
    .filter((id): id is string => id !== null && id !== undefined)
  const seenCharacters = await db.character.findMany({
    where: { id: { in: seenCharIds } },
    select: { id: true, currentActivity: true, responseLatencyProfile: true, status: true },
  })
  const seenConvToChar = new Map<string, (typeof seenCharacters)[number]>()
  for (const conv of seenConversations) {
    if (conv.characterId) {
      const ch = seenCharacters.find((c) => c.id === conv.characterId)
      if (ch) seenConvToChar.set(conv.id, ch)
    }
  }

  let seenCount = 0
  for (const m of deliveredButUnseen) {
    const ch = seenConvToChar.get(m.conversationId)
    if (!ch || !m.deliveredAt) continue
    const profile: DeliveryProfile = {
      characterId: ch.id,
      currentActivity: ch.currentActivity,
      responseLatencyProfile:
        (ch.responseLatencyProfile as DeliveryProfile['responseLatencyProfile']) ?? 'normal',
      relationshipStatus: null,
      characterStatus: ch.status,
    }
    const ageSinceDelivered = now - m.deliveredAt.getTime()
    const responded = await db.assistantMessage.findFirst({
      where: {
        conversationId: m.conversationId,
        role: 'assistant',
        createdAt: { gt: m.deliveredAt },
      },
      select: { createdAt: true },
    })
    const willRespond = !!responded
    if (!shouldMarkSeen(profile, ageSinceDelivered, willRespond)) continue
    const seenAt = responded ? new Date(responded.createdAt.getTime() - 500) : new Date(now)
    await db.assistantMessage.update({
      where: { id: m.id },
      data: { seenByCharacterAt: seenAt },
    })
    seenCount++
  }

  return { delivered, seen: seenCount }
}
