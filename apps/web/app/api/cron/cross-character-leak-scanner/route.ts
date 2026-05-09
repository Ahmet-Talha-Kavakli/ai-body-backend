/**
 * V4.7 M1 — Cross-Character Leak Scanner
 *
 * Haftalık cron. CrossCharacterDisclosure kayıtlarından sızdırma kararı verir.
 *
 * Formül:
 *   leak_probability = listener_drama × listener_subject_closeness × (1 - listener_loyalty) × sensitivity
 *   eşik > 0.4 → sızıntı
 *
 * Sızıntı sonucu:
 *   - subject karakter için CharacterMemoryFact (subject='user', category='leaked_info')
 *   - CharacterKnowledgeOrigin kayıt (acquiredVia='leaked_via_<listenerCharId>')
 *   - CharacterSocialReaction tetiklenir (subject karakter kullanıcıya tepki gösterebilir)
 *
 * Lokal: curl http://localhost:3000/api/cron/cross-character-leak-scanner
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export const maxDuration = 180

const LEAK_THRESHOLD = 0.4

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

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Henüz sızdırılmamış disclosures (son 14 gün — bekleme penceresi)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const pending = await db.crossCharacterDisclosure.findMany({
    where: {
      leakedAt: null,
      detectedAt: { gte: fourteenDaysAgo },
      subjectCharId: { not: null }, // sadece karakter hakkındaki disclosurelar
    },
    take: 100,
    orderBy: { detectedAt: 'asc' },
  })

  let leaked = 0
  let kept = 0
  let errors = 0

  for (const d of pending) {
    try {
      if (!d.subjectCharId) continue
      // Aynı karakter hakkında ise atla (Mia kendi hakkında konuşmuyor)
      if (d.listenerCharId === d.subjectCharId) {
        await db.crossCharacterDisclosure.update({
          where: { id: d.id },
          data: { leakedAt: now, leakProbability: 0, leakDecisionAt: now },
        })
        kept++
        continue
      }

      // Listener drama + loyalty
      const listener = await db.character.findUnique({
        where: { id: d.listenerCharId },
        select: { id: true, dramaScore: true, loyaltyScore: true, name: true },
      })
      if (!listener) {
        await db.crossCharacterDisclosure.update({
          where: { id: d.id },
          data: { leakedAt: now, leakProbability: 0, leakDecisionAt: now },
        })
        kept++
        continue
      }

      // Listener-subject yakınlığı (InterCharacterInteraction sayısından)
      const interactionCount = await db.interCharacterInteraction.count({
        where: {
          OR: [
            { characterAId: d.listenerCharId, characterBId: d.subjectCharId },
            { characterAId: d.subjectCharId, characterBId: d.listenerCharId },
          ],
        },
      })
      // 0-20+ arası → 0-1 normalize
      const closeness = Math.min(1, interactionCount / 20)

      // Formül
      const probability =
        listener.dramaScore * closeness * (1 - listener.loyaltyScore) * d.sensitivity

      if (probability >= LEAK_THRESHOLD) {
        // Sızıntı oluyor
        // 1. Subject karakter için memory fact
        const fact = await db.characterMemoryFact.create({
          data: {
            userId: d.userId,
            characterId: d.subjectCharId,
            subject: 'user',
            category: 'leaked_info',
            content: `${listener.name} bana senin hakkında şöyle dedi: "${d.content.slice(0, 200)}"`,
            importance: Math.round(2 + d.sensitivity * 2), // 2-4
          },
        })
        // 2. Origin kayıt
        await db.characterKnowledgeOrigin.create({
          data: {
            characterId: d.subjectCharId,
            factId: fact.id,
            factType: 'memory_fact',
            origin: `leaked_via_${d.listenerCharId}`,
            sourceCharId: d.listenerCharId,
          },
        })
        // 3. Eğer sensitivity yüksekse (negatif/önemli bilgi) reactive trigger
        if (d.sensitivity >= 0.6) {
          await db.characterSocialReaction.create({
            data: {
              characterId: d.subjectCharId,
              triggerCharId: d.listenerCharId,
              reactionType: d.sensitivity >= 0.8 ? 'attack' : 'defense',
              triggerEvent: `leaked_disclosure:${d.id}`,
              scheduledFor: new Date(now.getTime() + (1 + Math.random() * 23) * 60 * 60 * 1000), // 1-24h
            },
          })
        }
        await db.crossCharacterDisclosure.update({
          where: { id: d.id },
          data: {
            leakedAt: now,
            leakTargetCharId: d.subjectCharId,
            leakProbability: probability,
            leakDecisionAt: now,
          },
        })
        leaked++
      } else {
        // Tutuluyor — ama disclosure 14 gün'den eskiyse archive
        if (d.detectedAt < sevenDaysAgo) {
          await db.crossCharacterDisclosure.update({
            where: { id: d.id },
            data: { leakDecisionAt: now, leakProbability: probability },
          })
          kept++
        }
      }
    } catch (e) {
      console.error('[leak-scanner]', e)
      errors++
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: pending.length,
    leaked,
    kept,
    errors,
  })
}
