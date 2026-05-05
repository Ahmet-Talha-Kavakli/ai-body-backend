/**
 * V4 Test — Flag açma/kapama endpoint'i (sadece test için)
 *
 * GET → kullanıcının V4 flag durumunu döner
 * POST { flag: 'v4_graph_memory' | ..., enabled: true|false } → flag'i toggle eder
 *
 * Sadece Talha (admin) için açık. Diğer kullanıcılar 403 alır.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { setFlag, isFlagEnabled, type V4FlagName } from '@/lib/assistant/feature-flags'

const ADMIN_EMAIL = 'ahmettalhakavakli32@gmail.com'

const ALL_FLAGS: V4FlagName[] = [
  'v4_graph_memory',
  'v4_characters',
  'v4_life_engine',
  'v4_decision_engine',
  'v4_group_chat',
  'v4_ui',
  'v4_inner_thought',
  'v4_avatar_consistency',
]

export const GET = withAuth(async (req: NextRequest, { user }) => {
  if (user.email !== ADMIN_EMAIL) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const flags: Record<string, boolean> = {}
  for (const f of ALL_FLAGS) {
    flags[f] = await isFlagEnabled(f, user.id)
  }
  return NextResponse.json({ flags })
})

export const POST = withAuth(async (req: NextRequest, { user }) => {
  if (user.email !== ADMIN_EMAIL) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const flag = body.flag as V4FlagName
  const enabled = !!body.enabled

  if (!ALL_FLAGS.includes(flag)) {
    return new NextResponse('Invalid flag', { status: 400 })
  }

  await setFlag(flag, enabled, user.id)
  return NextResponse.json({ ok: true, flag, enabled })
})
