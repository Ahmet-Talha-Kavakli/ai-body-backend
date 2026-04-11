import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { isValidCronRequest } from '@/lib/env/validate'
import { calculateDecayScore } from '@/lib/memory/memory-writer'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

const BATCH_SIZE = 100

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!isValidCronRequest(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Tüm memory'leri çek (embedding hariç — büyük alan)
    const memories = await prisma.userMemoryEmbedding.findMany({
      select: { id: true, createdAt: true, type: true },
    })

    logger.info({ count: memories.length }, 'memory-decay: updating scores')

    let updated = 0
    let errors = 0

    // Batch olarak güncelle
    for (let i = 0; i < memories.length; i += BATCH_SIZE) {
      const batch = memories.slice(i, i + BATCH_SIZE)

      const results = await Promise.allSettled(
        batch.map((m) =>
          prisma.userMemoryEmbedding.update({
            where: { id: m.id },
            data: { decayScore: calculateDecayScore(m.createdAt, m.type) },
          })
        )
      )

      for (const result of results) {
        if (result.status === 'fulfilled') updated++
        else {
          errors++
          logger.error({ reason: result.reason }, 'memory-decay: batch item failed')
        }
      }
    }

    return NextResponse.json({ updated, errors, total: memories.length })
  } catch (err) {
    logger.error({ err }, 'memory-decay cron failed')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
