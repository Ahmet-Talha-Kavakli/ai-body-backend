/**
 * AI Story — V3 Faz C
 *
 * GET /api/assistant/story
 *   AI'ın temel hikayesi + milestone'ları (kilitli/açık).
 *   Status: pending | generating | ready | failed
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (_req, { user }) => {
  const profile = await db.assistantProfile.findFirst({
    where: { userId: user.id },
    select: { id: true, name: true, archetype: true, bornAt: true, ageAtCreation: true },
  })
  if (!profile) {
    return NextResponse.json({ error: 'profile_not_found' }, { status: 404 })
  }

  const story = await db.characterStory.findUnique({
    where: { assistantProfileId: profile.id },
    include: {
      milestones: {
        orderBy: { chronologicalOrder: 'asc' },
        include: {
          comments: {
            orderBy: { createdAt: 'desc' },
            select: { id: true, content: true, createdAt: true },
          },
        },
      },
      sharedMilestones: {
        orderBy: { sharedOrder: 'asc' },
        include: {
          comments: {
            orderBy: { createdAt: 'desc' },
            select: { id: true, content: true, createdAt: true },
          },
        },
      },
      characters: true,
    },
  })

  if (!story) {
    return NextResponse.json({
      status: 'pending',
      profile: { name: profile.name, archetype: profile.archetype },
      story: null,
      milestones: [],
      sharedMilestones: [],
    })
  }

  return NextResponse.json({
    status: story.generationStatus,
    profile: {
      name: profile.name,
      archetype: profile.archetype,
      bornAt: profile.bornAt,
      ageAtCreation: profile.ageAtCreation,
    },
    story: {
      birthplace: story.birthplace,
      childhood: story.childhood,
      familyDynamics: story.familyDynamics,
      firstLoss: story.firstLoss,
      firstLove: story.firstLove,
      passion: story.passion,
      achievement: story.achievement,
      failure: story.failure,
      turningPoint: story.turningPoint,
      currentSituation: story.currentSituation,
      generatedAt: story.generatedAt,
    },
    // Geçmiş milestone'ları (AI'ın hayatı, pivot'tan önce — aşağıda)
    milestones: story.milestones.map((m) => ({
      id: m.id,
      title: m.title,
      bodyText: m.isLocked ? null : m.bodyText,
      illustrationUrl: m.isLocked ? null : m.illustrationUrl,
      age: m.age,
      year: m.year,
      location: m.location,
      emotion: m.emotion,
      isLocked: m.isLocked,
      unlockedAt: m.unlockedAt,
      arcType: m.arcType,
      importance: m.importance,
      chronologicalOrder: m.chronologicalOrder,
      comments: m.isLocked ? [] : m.comments,
      // Bu anıda geçen kişiler (kilitliyse boş)
      characters: m.isLocked
        ? []
        : story.characters
            .filter((c) => c.milestoneIds.includes(m.id))
            .map((c) => ({
              id: c.id,
              name: c.name,
              relationship: c.relationship,
              description: c.description,
              avatarUrl: c.avatarUrl,
            })),
    })),
    // Birlikte yaşanan anlar (pivot 0, sonrası 1+)
    sharedMilestones: story.sharedMilestones.map((m) => ({
      id: m.id,
      type: m.type,
      title: m.title,
      bodyText: m.bodyText,
      illustrationUrl: m.illustrationUrl,
      emotion: m.emotion,
      importance: m.importance,
      sharedOrder: m.sharedOrder,
      occurredAt: m.occurredAt,
      comments: m.comments,
    })),
  })
})
