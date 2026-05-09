/**
 * V4.6 M6 — Gerçek Engelleme Sistemi
 *
 * Karakter "engelliyorum" der ve gerçekten engellesin. Stream output'unda
 * `[ACTION:BLOCK reason="..." duration="..."]` tag'i görürsek MemoryRelationship
 * üzerinde blockedUntil set ederiz.
 *
 * Kullanıcı engelliyse mesaj atamaz (endpoint kontrol eder, "iletilmedi" döner).
 *
 * Açma yolları:
 *   1. blockedUntil geçince otomatik (zaman bazlı)
 *   2. Karakter mood/storyline durumuna göre erken açabilir (cron decideEarlyUnblock)
 *   3. Ortak arkadaş aracılığıyla özür (BlockMediation)
 */

import { db } from '@/lib/db/client'
import { appendBreakingPoint } from './cross-context-state'

export interface ActionTag {
  type:
    | 'BLOCK'
    | 'UNBLOCK'
    | 'DECISION_CHANGE'
    | 'DELETE_AFTER'
    | 'MEDIATE_FORWARD'
    | 'MEDIATE_REJECT'
  reason?: string
  duration?: string // "24h" | "permanent" | "3d"
  rest: Record<string, string>
}

const TAG_RE = /\[ACTION:(\w+)\s+([^\]]+)\]/gi

/**
 * Stream output'unda action tag'lerini parse et + ana metinden kaldır.
 */
export function extractActionTags(text: string): {
  cleanText: string
  tags: ActionTag[]
} {
  const tags: ActionTag[] = []
  const cleanText = text.replace(TAG_RE, (_match, type: string, body: string) => {
    const attrs: Record<string, string> = {}
    const attrRe = /(\w+)="([^"]*)"/g
    let m: RegExpExecArray | null
    while ((m = attrRe.exec(body)) !== null) {
      attrs[m[1]] = m[2]
    }
    tags.push({
      type: type.toUpperCase() as ActionTag['type'],
      reason: attrs.reason,
      duration: attrs.duration,
      rest: attrs,
    })
    return ''
  })
  return { cleanText: cleanText.trim(), tags }
}

/**
 * Süre string'ini ms'ye çevir. "24h" → 86400000, "3d" → 259200000, "permanent" → null
 */
export function parseDuration(d: string | undefined): number | null {
  if (!d || d === 'permanent') return null
  const m = /^(\d+)\s*([hd])$/i.exec(d.trim())
  if (!m) return null
  const n = parseInt(m[1], 10)
  if (m[2].toLowerCase() === 'h') return n * 3600 * 1000
  if (m[2].toLowerCase() === 'd') return n * 86400 * 1000
  return null
}

/**
 * Karakter blok kararı verdi → DB'ye uygula.
 */
export async function applyBlockAction(args: {
  userId: string
  characterId: string
  tag: ActionTag
}): Promise<{ blocked: boolean; until: Date | null; reason: string | null }> {
  const { userId, characterId, tag } = args
  const durationMs = parseDuration(tag.duration)
  const until = durationMs ? new Date(Date.now() + durationMs) : null
  // permanent veya duration yoksa: kalıcı sayılır (hem block, hem ended)
  const isPermanent = tag.duration === 'permanent' || (!tag.duration && !durationMs)

  const existing = await db.memoryRelationship.findUnique({
    where: { userId_characterId: { userId, characterId } },
    select: { breakingPoints: true },
  })

  await db.memoryRelationship.update({
    where: { userId_characterId: { userId, characterId } },
    data: {
      blockedUntil: until,
      blockReason: tag.reason ?? null,
      status: 'broken',
      permanentlyEnded: isPermanent ? true : undefined,
      tensionScore: { increment: 25 },
      lastInteractionAt: new Date(),
      // Breaking point ekle
      breakingPoints: appendBreakingPoint(existing?.breakingPoints, {
        severity: 'severe',
        reason: tag.reason ?? 'block_action',
      }) as unknown as object,
    },
  })

  return {
    blocked: true,
    until,
    reason: tag.reason ?? null,
  }
}

/**
 * Kullanıcı bu karaktere mesaj atabiliyor mu?
 * Stream başında ve mesaj endpoint'inde çağrılır.
 */
export async function checkBlockStatus(
  userId: string,
  characterId: string
): Promise<{
  isBlocked: boolean
  reason: string | null
  until: Date | null
  permanent: boolean
}> {
  const rel = await db.memoryRelationship.findUnique({
    where: { userId_characterId: { userId, characterId } },
    select: {
      blockedUntil: true,
      blockReason: true,
      permanentlyEnded: true,
    },
  })
  if (!rel) {
    return { isBlocked: false, reason: null, until: null, permanent: false }
  }
  if (rel.permanentlyEnded) {
    return { isBlocked: true, reason: rel.blockReason, until: null, permanent: true }
  }
  if (rel.blockedUntil && rel.blockedUntil.getTime() > Date.now()) {
    return {
      isBlocked: true,
      reason: rel.blockReason,
      until: rel.blockedUntil,
      permanent: false,
    }
  }
  // Süre dolmuşsa otomatik temizle
  if (rel.blockedUntil && rel.blockedUntil.getTime() <= Date.now()) {
    await db.memoryRelationship
      .update({
        where: { userId_characterId: { userId, characterId } },
        data: {
          blockedUntil: null,
          blockReason: null,
          status: 'recovering',
        },
      })
      .catch(() => {})
  }
  return { isBlocked: false, reason: null, until: null, permanent: false }
}

/**
 * Ortak arkadaş aracılığıyla özür gönder.
 * Selin'in bir sonraki konuşmasında promptuna inject olur.
 */
export async function createMediation(args: {
  userId: string
  blockedCharId: string
  mediatorCharId: string
  message: string
}): Promise<{ id: string }> {
  // Aracının zaten pending bir mediation'ı varsa onun yerine güncelle
  const existing = await db.blockMediation.findFirst({
    where: {
      userId: args.userId,
      blockedCharId: args.blockedCharId,
      mediatorCharId: args.mediatorCharId,
      status: 'pending',
    },
  })
  if (existing) {
    await db.blockMediation.update({
      where: { id: existing.id },
      data: { message: args.message, createdAt: new Date() },
    })
    return { id: existing.id }
  }
  const created = await db.blockMediation.create({
    data: {
      userId: args.userId,
      blockedCharId: args.blockedCharId,
      mediatorCharId: args.mediatorCharId,
      message: args.message,
      status: 'pending',
    },
  })
  return { id: created.id }
}

/**
 * Aracılık karakterinin promptuna injecte edilecek bilgi.
 * Selin için: "Mia kullanıcıyı engelledi, kullanıcı sana şunu yazdı..."
 */
export async function loadMediationContextForCharacter(args: {
  userId: string
  mediatorCharId: string
}): Promise<string | null> {
  const pending = await db.blockMediation.findFirst({
    where: {
      userId: args.userId,
      mediatorCharId: args.mediatorCharId,
      status: 'pending',
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!pending) return null

  const blockedChar = await db.character.findUnique({
    where: { id: pending.blockedCharId },
    select: { name: true },
  })
  if (!blockedChar) return null

  return `[ARACILIK İSTEĞİ]
Kullanıcı seni aracı yapıyor. ${blockedChar.name} kendisini engellemiş, kullanıcı senden ona şunu iletmeni istiyor:

"${pending.message}"

DAVRANIŞ:
- Bu mesajı doğal şekilde tartabilirsin: kullanıcıya "ne yaptın ona?" diye sorabilirsin
- Aracılığa devam etmek isteyip istemediğine sen karar ver
- Eğer aracılık etmek istersen: cevabının sonuna [ACTION:MEDIATE_FORWARD] ekle
- Eğer reddedersen [ACTION:MEDIATE_REJECT reason="..."] ekle
- Hiçbir şey eklemezsen Selin sadece dinler, henüz karar vermemiştir`
}

/**
 * Mediation tag'ini işle (Selin'in cevabından).
 */
export async function applyMediationTag(args: {
  mediationId: string
  tag: ActionTag
}): Promise<void> {
  if (args.tag.type !== 'MEDIATE_FORWARD' && args.tag.type !== 'MEDIATE_REJECT') return
  const newStatus = args.tag.type === 'MEDIATE_FORWARD' ? 'forwarded' : 'rejected'
  await db.blockMediation
    .update({
      where: { id: args.mediationId },
      data: {
        status: newStatus,
        resolvedAt: new Date(),
      },
    })
    .catch(() => {})
}
