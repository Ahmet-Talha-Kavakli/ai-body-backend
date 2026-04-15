import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

// POST { type: 'pet' | 'feed' | 'play' } — etkileşim kaydeder, XP verir
export const POST = withAuth(async (req: NextRequest, { user }) => {
  const { type } = (await req.json()) as { type: 'pet' | 'feed' | 'play' }
  const xpGain = ({ pet: 5, feed: 10, play: 15 } as const)[type] ?? 5

  const pet = await db.pet.update({
    where: { userId: user.id },
    data: { xp: { increment: xpGain } },
  })

  await db.petInteraction.create({
    data: { userId: user.id, petId: pet.id, type },
  })

  return NextResponse.json({ xp: pet.xp, xpGain })
})
