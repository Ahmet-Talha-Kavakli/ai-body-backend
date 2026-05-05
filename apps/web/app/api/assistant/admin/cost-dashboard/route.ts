/**
 * V4 Test — AiCallLog dashboard
 *
 * GET /api/assistant/admin/cost-dashboard?days=30
 *
 * Aylık AI maliyetini özetler:
 *   - Toplam $ (son N gün)
 *   - Model bazında breakdown
 *   - Purpose bazında breakdown (chat, decision, extractor, life_engine, avatar, ...)
 *   - Provider bazında (openai/fal/anthropic)
 *   - Günlük seri (trend)
 *
 * Sadece admin (ahmettalhakavakli32@gmail.com).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { withAuth } from '@/lib/api/with-auth'

const ADMIN_EMAIL = 'ahmettalhakavakli32@gmail.com'

export const GET = withAuth(async (req: NextRequest, { user }) => {
  if (user.email !== ADMIN_EMAIL) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const url = new URL(req.url)
  const days = Math.min(parseInt(url.searchParams.get('days') ?? '30', 10), 365)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // Sadece kullanıcının kendi log'ları (admin = test kullanıcısı şu an)
  // Production'da userId filter'ı kaldırılır, global log gösterir
  const where = { userId: user.id, createdAt: { gte: since } }

  const [total, byModel, byPurpose, byProvider, dailySeries, recent] = await Promise.all([
    // Toplam
    db.aiCallLog.aggregate({
      where,
      _sum: { costUsd: true, inputTokens: true, outputTokens: true, durationMs: true },
      _count: { _all: true },
    }),
    // Model bazında
    db.aiCallLog.groupBy({
      by: ['model'],
      where,
      _sum: { costUsd: true },
      _count: { _all: true },
      orderBy: { _sum: { costUsd: 'desc' } },
    }),
    // Purpose bazında
    db.aiCallLog.groupBy({
      by: ['purpose'],
      where,
      _sum: { costUsd: true },
      _count: { _all: true },
      orderBy: { _sum: { costUsd: 'desc' } },
    }),
    // Provider bazında
    db.aiCallLog.groupBy({
      by: ['provider'],
      where,
      _sum: { costUsd: true },
      _count: { _all: true },
    }),
    // Günlük seri — son 30 gün
    db.$queryRaw<Array<{ day: Date; cost: number; calls: bigint }>>`
      SELECT date_trunc('day', "createdAt") as day,
             SUM("costUsd")::float as cost,
             COUNT(*)::bigint as calls
      FROM "AiCallLog"
      WHERE "userId" = ${user.id} AND "createdAt" >= ${since}
      GROUP BY day
      ORDER BY day DESC
      LIMIT 60
    `,
    // Son 20 çağrı
    db.aiCallLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        model: true,
        purpose: true,
        provider: true,
        inputTokens: true,
        outputTokens: true,
        costUsd: true,
        durationMs: true,
        createdAt: true,
      },
    }),
  ])

  return NextResponse.json({
    days,
    total: {
      costUsd: total._sum.costUsd ?? 0,
      inputTokens: total._sum.inputTokens ?? 0,
      outputTokens: total._sum.outputTokens ?? 0,
      durationMs: total._sum.durationMs ?? 0,
      callCount: total._count._all,
    },
    byModel: byModel.map((b) => ({
      model: b.model,
      costUsd: b._sum.costUsd ?? 0,
      calls: b._count._all,
    })),
    byPurpose: byPurpose.map((b) => ({
      purpose: b.purpose,
      costUsd: b._sum.costUsd ?? 0,
      calls: b._count._all,
    })),
    byProvider: byProvider.map((b) => ({
      provider: b.provider,
      costUsd: b._sum.costUsd ?? 0,
      calls: b._count._all,
    })),
    dailySeries: dailySeries.map((d) => ({
      day: d.day.toISOString().slice(0, 10),
      cost: Number(d.cost ?? 0),
      calls: Number(d.calls ?? 0),
    })),
    recent,
  })
})
