/**
 * DEV ONLY — Feature flag yönetimi
 *
 * GET  /api/dev/flags                          → tüm flag durumları
 * POST /api/dev/flags?flag=v4_life_engine&enabled=1  → global flag set
 * POST /api/dev/flags?flag=...&enabled=1&userId=...  → user-specific
 *
 * V4.6 Faz 1: lokal dev için global flag açma yardımcısı.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { setFlag, V4FlagName } from '@/lib/assistant/feature-flags'

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

export async function GET() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_ENDPOINTS !== '1') {
    return NextResponse.json({ error: 'dev_only' }, { status: 403 })
  }
  const rows = await db.featureFlag.findMany({
    orderBy: [{ flagName: 'asc' }, { userId: 'asc' }],
  })
  return NextResponse.json({ ok: true, flags: rows })
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_ENDPOINTS !== '1') {
    return NextResponse.json({ error: 'dev_only' }, { status: 403 })
  }
  const url = new URL(req.url)
  const flag = url.searchParams.get('flag') as V4FlagName | 'all' | null
  const enabled = url.searchParams.get('enabled') === '1'
  const userId = url.searchParams.get('userId')

  if (!flag) {
    return NextResponse.json({ error: 'flag_required' }, { status: 400 })
  }

  const targets: V4FlagName[] = flag === 'all' ? ALL_FLAGS : [flag as V4FlagName]
  for (const f of targets) {
    await setFlag(f, enabled, userId)
  }
  return NextResponse.json({ ok: true, set: targets, enabled, userId: userId ?? 'global' })
}
