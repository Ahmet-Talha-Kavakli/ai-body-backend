/**
 * V4.6 M75 — Status feed
 *
 * GET /api/assistant/status/feed
 * Kullanıcının görmesi gereken aktif status'leri döner:
 * - Kullanıcının kendi status'leri
 * - Karakter status'leri (hiddenFrom içinde userId yoksa)
 * - Süresi dolmamış (expiresAt > now)
 *
 * Her grup (author bazlı) için view durumu (allViewed) döner — UI halka rengi için.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { withAuth } from '@/lib/api/with-auth'

type AuthorGroup = {
  authorType: 'user' | 'character'
  authorId: string
  authorName: string
  authorAvatarUrl: string | null
  statuses: Array<{
    id: string
    contentType: string
    mediaUrl: string | null
    caption: string | null
    bgColor: string | null
    createdAt: string
    viewedByMe: boolean
  }>
  allViewed: boolean
  latestAt: string
}

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const now = new Date()

  const characters = await db.character.findMany({
    where: { userId: user.id, status: { not: 'departed' } },
    select: { id: true, name: true, avatarUrl: true },
  })
  const charMap = new Map(characters.map((c) => [c.id, c]))
  const charIds = characters.map((c) => c.id)

  const myProfile = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true, avatarUrl: true },
  })

  const statuses = await db.status.findMany({
    where: {
      expiresAt: { gt: now },
      OR: [
        { authorType: 'user', authorUserId: user.id },
        {
          authorType: 'character',
          authorCharId: { in: charIds },
          NOT: { hiddenFrom: { has: user.id } },
        },
      ],
    },
    orderBy: { createdAt: 'asc' },
    include: {
      views: {
        where: { viewerType: 'user', viewerUserId: user.id },
        select: { id: true },
      },
    },
  })

  const groups = new Map<string, AuthorGroup>()

  for (const s of statuses) {
    const isUser = s.authorType === 'user'
    const key = isUser ? `user:${s.authorUserId}` : `char:${s.authorCharId}`

    let group = groups.get(key)
    if (!group) {
      if (isUser) {
        group = {
          authorType: 'user',
          authorId: user.id,
          authorName: myProfile?.name || 'Sen',
          authorAvatarUrl: myProfile?.avatarUrl || null,
          statuses: [],
          allViewed: true,
          latestAt: s.createdAt.toISOString(),
        }
      } else {
        const c = charMap.get(s.authorCharId!)
        if (!c) continue
        group = {
          authorType: 'character',
          authorId: c.id,
          authorName: c.name,
          authorAvatarUrl: c.avatarUrl,
          statuses: [],
          allViewed: true,
          latestAt: s.createdAt.toISOString(),
        }
      }
      groups.set(key, group)
    }

    const viewedByMe = isUser ? true : s.views.length > 0
    if (!viewedByMe) group.allViewed = false
    if (s.createdAt.toISOString() > group.latestAt) {
      group.latestAt = s.createdAt.toISOString()
    }

    group.statuses.push({
      id: s.id,
      contentType: s.contentType,
      mediaUrl: s.mediaUrl,
      caption: s.caption,
      bgColor: s.bgColor,
      createdAt: s.createdAt.toISOString(),
      viewedByMe,
    })
  }

  // Sıralama: önce kullanıcının kendi status'ü, sonra görülmemişler, sonra görülmüşler (latest desc)
  const arr = Array.from(groups.values())
  arr.sort((a, b) => {
    if (a.authorType === 'user' && b.authorType !== 'user') return -1
    if (b.authorType === 'user' && a.authorType !== 'user') return 1
    if (a.allViewed !== b.allViewed) return a.allViewed ? 1 : -1
    return b.latestAt.localeCompare(a.latestAt)
  })

  return NextResponse.json({ groups: arr })
})
