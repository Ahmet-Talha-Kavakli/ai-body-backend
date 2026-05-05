/**
 * V4 Faz B — V3 → Graph Lazy Migration
 *
 * Kullanıcı için ilk kez graph context yüklendiğinde tetiklenir.
 * V3 verisini (AssistantMemoryFact, Person, LifeEvent) graph node'larına çevirir.
 *
 * V3 tabloları SİLİNMEZ — sadece kopyalanır. Rollback için.
 *
 * İşaret: kullanıcının graph'ında hiç node yoksa → migrasyon yap.
 *
 * Tek seferlik. Tekrar tetiklenirse zaten node varsa skip.
 */

import { db } from '@/lib/db/client'

export async function migrateUserToGraph(userId: string): Promise<{
  migrated: boolean
  nodesCreated: number
  edgesCreated: number
}> {
  // Zaten graph node'u varsa → migrasyon yapılmış demektir
  const existingCount = await db.memoryNode.count({
    where: { userId, ownerType: 'user' },
  })
  if (existingCount > 0) {
    return { migrated: false, nodesCreated: 0, edgesCreated: 0 }
  }

  let nodesCreated = 0
  let edgesCreated = 0

  try {
    // 1) Person → 'person' node
    const people = await db.person.findMany({
      where: { userId, archived: false },
      take: 50,
    })

    const personIdToNodeId = new Map<string, string>()
    for (const p of people) {
      try {
        const content = [
          `İlişki: ${p.relationship}`,
          p.healthConditions?.length ? `Sağlık: ${p.healthConditions.join(', ')}` : null,
          p.isEmergencyContact ? 'Acil durum kişisi' : null,
          p.notes ?? null,
        ]
          .filter(Boolean)
          .join(' — ')

        const node = await db.memoryNode.create({
          data: {
            userId,
            ownerType: 'user',
            ownerId: userId,
            type: 'person',
            title: p.name,
            content: content || p.name,
            importance: Math.max(3, Math.min(5, p.importance ?? 3)),
            visibility: 'public',
            sourceType: 'inference',
          },
          select: { id: true },
        })
        personIdToNodeId.set(p.id, node.id)
        nodesCreated++
      } catch {}
    }

    // 2) LifeEvent → 'event' node
    const events = await db.lifeEvent.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 50,
    })
    for (const e of events) {
      try {
        const importance = e.resolved ? 3 : 4
        await db.memoryNode.create({
          data: {
            userId,
            ownerType: 'user',
            ownerId: userId,
            type: 'event',
            title: e.title,
            content: `[${e.type}] ${e.title}${e.resolved ? ' (çözüldü)' : ''}`,
            importance,
            visibility: 'public',
            sourceType: 'inference',
            createdAt: e.date,
          },
        })
        nodesCreated++
      } catch {}
    }

    // 3) AssistantMemoryFact → uygun tipe map
    // category → node type
    const categoryToType: Record<string, string> = {
      identity: 'value',
      preference: 'habit',
      pattern: 'pattern',
      event: 'event',
      promise: 'goal',
      life_event: 'event',
    }
    const facts = await db.assistantMemoryFact.findMany({
      where: { userId, archived: false, supersededById: null },
      take: 200,
    })
    for (const f of facts) {
      try {
        const type = categoryToType[f.category] ?? 'belief'
        // Title kısa, content uzun
        const titleSrc = f.content.split(/[.!?]/)[0]?.slice(0, 80) || f.content.slice(0, 80)
        await db.memoryNode.create({
          data: {
            userId,
            ownerType: 'user',
            ownerId: userId,
            type,
            title: titleSrc,
            content: f.content,
            importance: Math.max(2, Math.min(5, f.importance ?? 2)),
            confidence: f.confidence ?? 1.0,
            visibility: 'public',
            sourceType: 'inference',
            createdAt: f.createdAt,
          },
        })
        nodesCreated++
      } catch {}
    }

    return { migrated: true, nodesCreated, edgesCreated }
  } catch (e) {
    console.error('[graph-migration] failed:', e)
    return { migrated: false, nodesCreated, edgesCreated }
  }
}
