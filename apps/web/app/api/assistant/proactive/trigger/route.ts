/**
 * Manuel proactive tetikleme — geliştirme/test amaçlı.
 * POST /api/assistant/proactive/trigger
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { decideProactive, executeProactive } from '@/lib/assistant/proactive'

export const POST = withAuth(async (_req: NextRequest, { user }) => {
  const decision = await decideProactive(user.id)
  if (decision.action === 'send') {
    const result = await executeProactive(user.id, decision)
    return NextResponse.json({ decision, result })
  }
  return NextResponse.json({ decision })
})
