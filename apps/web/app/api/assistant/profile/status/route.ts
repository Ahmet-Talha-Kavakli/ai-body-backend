/**
 * AI Anlık Durum — V3 Faz B
 *
 * GET /api/assistant/profile/status
 *
 * AI'nın o anki "presence" durumunu döner:
 *   - online      → uyanık, mesaja hızlı cevap verir
 *   - dozing      → yorgun, geç cevap verir
 *   - sleeping    → uyuyor (gece 23-07), gecikmeli cevap
 *   - cold        → küs, isteksiz
 *   - silent      → konuşmuyor (silent state)
 *   - blocked     → engelledi, mesajlar gitmez
 *
 * Mood + relationship + saat ile hesaplanır.
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export type AIStatus = 'online' | 'dozing' | 'sleeping' | 'cold' | 'silent' | 'blocked'

export const GET = withAuth(async (_req, { user }) => {
  const profile = await db.assistantProfile.findFirst({
    where: { userId: user.id },
    select: {
      currentMood: true,
      relationshipState: true,
      blockedUntil: true,
    },
  })

  if (!profile) {
    return NextResponse.json({ status: 'online', label: 'çevrimiçi' })
  }

  const now = new Date()
  const hour = now.getHours() // server saati TR varsayımı; ileride user.timezone

  let status: AIStatus = 'online'
  let label = 'çevrimiçi'

  // 1. Engelli mi?
  if (
    profile.relationshipState === 'blocked' &&
    profile.blockedUntil &&
    profile.blockedUntil > now
  ) {
    status = 'blocked'
    label = 'şu an konuşmuyor'
  }
  // 2. Sessiz state
  else if (profile.relationshipState === 'silent') {
    status = 'silent'
    label = 'sessiz'
  }
  // 3. Küs (cold)
  else if (profile.relationshipState === 'cold') {
    status = 'cold'
    label = 'mesafeli'
  }
  // 4. Saat tabanlı uyku — 23:00–07:00 arası
  else if (hour >= 23 || hour < 7) {
    status = 'sleeping'
    label = 'uyuyor'
  }
  // 5. Yorgunsa gündüz dahi dozing — sabah 7-10 ve akşam 21-23 arasında
  else if (profile.currentMood === 'tired' && (hour >= 21 || hour < 10)) {
    status = 'dozing'
    label = 'yorgun'
  }
  // 6. Default
  else {
    status = 'online'
    label = 'çevrimiçi'
  }

  return NextResponse.json({ status, label })
})
