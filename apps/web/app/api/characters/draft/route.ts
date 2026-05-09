/**
 * V4.8 Faz A — Yeni karakter draft yarat
 * POST /api/characters/draft
 */
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { checkQuotaForCreate } from '@/lib/marketplace/quota'

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json().catch(() => ({}))
  const { name, age, gender, category } = body

  if (!name || typeof name !== 'string' || name.length < 2) {
    return NextResponse.json({ error: 'İsim en az 2 karakter olmalı' }, { status: 400 })
  }
  if (!age || typeof age !== 'number' || age < 18 || age > 99) {
    return NextResponse.json({ error: 'Yaş 18-99 arası olmalı' }, { status: 400 })
  }

  const quota = await checkQuotaForCreate(user.id)
  if (!quota.allowed) {
    return NextResponse.json({ error: quota.reason, quota }, { status: 403 })
  }

  const character = await db.character.create({
    data: {
      userId: user.id,
      creatorId: user.id,
      name,
      age,
      gender: gender ?? null,
      archetype: 'user_created',
      tier: 'user_created',
      category: (category as any) ?? 'friend',
      publishStatus: 'draft',
      bibleMetadata: {
        fillRatio: 0,
        aiFilledFields: [],
        totalFields: 20,
        validationResults: null,
      },
    },
    select: { id: true, name: true, publishStatus: true, category: true },
  })

  return NextResponse.json({ character, quota })
})
