import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { cached } from '@/lib/redis/client'
import { checkQuotaForCreate } from '@/lib/marketplace/quota'

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const data = await cached(`chars:mine:${user.id}`, 30, async () => {
    const characters = await db.character.findMany({
      where: { creatorId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        age: true,
        gender: true,
        avatarUrl: true,
        category: true,
        publishStatus: true,
        tier: true,
        dnaScore: true,
        isRetired: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return { characters }
  })
  const quota = await checkQuotaForCreate(user.id)
  return NextResponse.json({ ...data, quota })
})
