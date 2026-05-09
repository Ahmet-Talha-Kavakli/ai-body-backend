/**
 * V4.6 M30 — Ortak arkadaşlardan dolaylı bilgi
 *
 * DM'de Mia'yla kavga edersen → Mia ortak arkadaş Selin'e anlatır →
 * Selin sana "ne yaptın Mia'ya?" diye yazabilir.
 *
 * V4.5 inter-character + perception sistemi üstüne köprü.
 */

import { db } from '@/lib/db/client'

/**
 * Bu karakterin (mediator) ortak arkadaşlarından duyduğu son bilgileri çek.
 * Mevcut perception kayıtları + son user-character conflict'leri.
 */
export async function loadCrossFriendContext(args: {
  userId: string
  characterId: string // şu an konuşulan karakter
  lookbackDays?: number
}): Promise<string> {
  const since = new Date(Date.now() - (args.lookbackDays ?? 5) * 86400 * 1000)

  // Bu kullanıcının diğer karakterlerle son zamandaki TENSION durumlarını kontrol et
  const otherTenseRels = await db.memoryRelationship.findMany({
    where: {
      userId: args.userId,
      characterId: { not: args.characterId },
      OR: [{ tensionScore: { gt: 60 } }, { status: { in: ['broken', 'cold'] } }],
      updatedAt: { gte: since },
    },
    select: {
      characterId: true,
      tensionScore: true,
      status: true,
      blockReason: true,
    },
    take: 3,
  })

  if (otherTenseRels.length === 0) return ''

  // Diğer karakterlerin isimlerini çek
  const otherIds = otherTenseRels.map((r) => r.characterId)
  const otherChars = await db.character.findMany({
    where: { id: { in: otherIds } },
    select: { id: true, name: true },
  })
  const nameById = new Map(otherChars.map((c) => [c.id, c.name]))

  const lines = otherTenseRels.map((r) => {
    const name = nameById.get(r.characterId) ?? '?'
    if (r.blockReason) return `- ${name} sana kırgın (${r.blockReason})`
    if (r.status === 'broken') return `- ${name} ile kavga etmişsin gibi görünüyor`
    if (r.status === 'cold') return `- ${name} ile aran soğumuş`
    return `- ${name} ile gerginsiniz`
  })

  return `[ORTAK ARKADAŞTAN DUYDUKLARIN]
Son ${args.lookbackDays ?? 5} günde:
${lines.join('\n')}
DAVRANIŞ: Uygun bağlamda dolaylı sorabilirsin ("X anlattı, ne oldu aranızda?"). Zorunlu değil — sadece bağlam uygunsa. Drama yapma, doğal merak.\n\n`
}
