/**
 * Full Profile — V3 Faz B
 *
 * Profil sayfası için zengin veri:
 *   - Avatar, isim, bio
 *   - İlk konuşma tarihi
 *   - Toplam mesaj sayısı
 *   - İlişki durumu (relationshipState)
 *   - Mood + reason
 *   - Yıldızlanan mesaj sayısı
 *   - Online/offline tahmini (saat + mood'a göre)
 *
 * GET /api/assistant/profile/full
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { userLocalNow } from '@/lib/assistant/timezone'

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  try {
    const [profile, userRow, firstMessage, totalMessages, starredCount] = await Promise.all([
      db.assistantProfile.findUnique({
        where: { userId: user.id },
        select: {
          name: true,
          archetype: true,
          avatarUrl: true,
          bio: true,
          currentMood: true,
          moodReason: true,
          relationshipState: true,
          relationshipStateChangedAt: true,
          blockedUntil: true,
          createdAt: true,
        },
      }),
      db.user.findUnique({
        where: { id: user.id },
        select: { timezone: true },
      }),
      db.assistantMessage.findFirst({
        where: { conversation: { userId: user.id } },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      db.assistantMessage.count({
        where: { conversation: { userId: user.id } },
      }),
      db.assistantMessage.count({
        where: { conversation: { userId: user.id }, isPinned: true },
      }),
    ])

    if (!profile) {
      return NextResponse.json({ error: 'profile_not_found' }, { status: 404 })
    }

    // Online/offline durumu — kullanıcı timezone'una göre AI günlük ritmi
    const local = userLocalNow(userRow?.timezone)
    let onlineState: 'online' | 'offline' | 'sleeping' = 'online'
    if (local.hour >= 0 && local.hour < 6) {
      onlineState = 'sleeping'
    } else if (profile.currentMood === 'tired' && (local.hour >= 22 || local.hour < 7)) {
      onlineState = 'sleeping'
    }
    // Engelli ise offline gösterilir
    const isBlocked = profile.relationshipState === 'blocked'

    return NextResponse.json({
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      archetype: profile.archetype,

      // Durum
      onlineState: isBlocked ? 'unavailable' : onlineState,
      relationshipState: profile.relationshipState,
      blockedUntil: profile.blockedUntil?.toISOString() ?? null,

      // Mood (sadece UI debug — kullanıcıya direkt gösterilmez)
      currentMood: profile.currentMood,
      moodReason: profile.moodReason,

      // Tarihler & istatistikler
      firstConversationAt: firstMessage?.createdAt.toISOString() ?? profile.createdAt.toISOString(),
      profileCreatedAt: profile.createdAt.toISOString(),
      totalMessages,
      starredMessageCount: starredCount,
    })
  } catch (e) {
    console.error('[profile/full]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown' }, { status: 500 })
  }
})
