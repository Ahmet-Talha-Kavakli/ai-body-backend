import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { effectiveConfidence } from '@/lib/assistant/memory'

// GET /api/assistant/memory — kullanıcının tüm memory verisi (görüntüleme amaçlı)
export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const [activeFacts, people, events] = await Promise.all([
    // Sadece aktif (supersede edilmemiş, arşivlenmemiş)
    db.assistantMemoryFact.findMany({
      where: { userId: user.id, archived: false, supersededById: null },
      orderBy: [{ category: 'asc' }, { lastConfirmedAt: 'desc' }],
      select: {
        id: true,
        beliefId: true,
        category: true,
        content: true,
        confidence: true,
        createdAt: true,
        lastUsedAt: true,
        lastConfirmedAt: true,
      },
    }),
    db.person.findMany({
      where: { userId: user.id, archived: false },
      orderBy: [{ importance: 'desc' }, { lastMentionedAt: 'desc' }],
      select: {
        id: true,
        name: true,
        relationship: true,
        importance: true,
        healthConditions: true,
        notes: true,
      },
    }),
    db.lifeEvent.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        date: true,
        resolved: true,
        stressLevel: true,
        person: { select: { name: true, relationship: true } },
      },
    }),
  ])

  // Her aktif fact için, beliefId ile geçmiş versiyonları çek (timeline)
  const beliefIds = Array.from(
    new Set(activeFacts.map((f) => f.beliefId).filter(Boolean) as string[])
  )
  const allVersions = beliefIds.length
    ? await db.assistantMemoryFact.findMany({
        where: { userId: user.id, beliefId: { in: beliefIds } },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          beliefId: true,
          content: true,
          createdAt: true,
          archived: true,
          supersededById: true,
          supersededAt: true,
        },
      })
    : []
  const versionsByBelief = new Map<string, typeof allVersions>()
  for (const v of allVersions) {
    if (!v.beliefId) continue
    const arr = versionsByBelief.get(v.beliefId) ?? []
    arr.push(v)
    versionsByBelief.set(v.beliefId, arr)
  }

  // Effective confidence + history attach
  const facts = activeFacts.map((f) => {
    const eff = effectiveConfidence(f.confidence, f.lastConfirmedAt)
    const history = (f.beliefId ? (versionsByBelief.get(f.beliefId) ?? []) : [])
      .filter((v) => v.id !== f.id) // mevcudu çıkar
      .map((v) => ({
        id: v.id,
        content: v.content,
        createdAt: v.createdAt,
        supersededAt: v.supersededAt,
      }))
    return {
      ...f,
      effectiveConfidence: eff,
      history,
    }
  })

  return NextResponse.json({ facts, people, events })
})
